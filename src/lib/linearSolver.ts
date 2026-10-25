import type {
  CholeskySolveTrace,
  GaussianEliminationTrace,
  GaussianStep,
  IterativeMethodId,
  IterativeMethodTrace,
  LinearSystemSolution,
  Metrics,
  ThomasAlgorithmTrace,
} from '../types/math'
import {
  applyMatrix,
  cloneMatrix,
  computeDet,
  computeEigenvaluesOnly,
  dotVec,
  formatNum,
  invertMatrix,
  multiplyMatrices,
  transposeMatrix,
  vecNorm,
} from './mathEngine'

function residualNorm(a: number[][], x: number[], b: number[]): number {
  const ax = applyMatrix(a, x)
  return Math.hypot(...ax.map((v, i) => v - (b[i] ?? 0)))
}

function clampVec(v: number[], maxMag = 250): number[] {
  const n = vecNorm(v)
  if (!Number.isFinite(n)) return v.map(() => 0)
  if (n > maxMag) return v.map((x) => (x / n) * maxMag)
  return v
}

function solveLowerUnit(L: number[][], rhs: number[]): number[] {
  const n = L.length
  const y = Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    let s = rhs[i] ?? 0
    for (let j = 0; j < i; j++) s -= L[i][j] * y[j]
    y[i] = s
  }
  return y
}

function solveUpper(U: number[][], y: number[]): number[] {
  const n = U.length
  const x = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i] ?? 0
    for (let j = i + 1; j < n; j++) s -= U[i][j] * x[j]
    x[i] = Math.abs(U[i][i]) > 1e-12 ? s / U[i][i] : 0
  }
  return x
}

function buildGaussianTrace(
  a: number[][],
  b: number[],
  metrics: Metrics
): GaussianEliminationTrace {
  const n = a.length
  const A = cloneMatrix(a)
  const B = [...b]
  const steps: GaussianStep[] = [
    {
      stepIndex: 0,
      description: 'Initial augmented system [A⁽⁰⁾ | b⁽⁰⁾]',
      matrixA: cloneMatrix(A),
      vectorB: [...B],
    },
  ]

  let stepIdx = 1
  for (let k = 0; k < n - 1; k++) {
    let maxRow = k
    let maxVal = Math.abs(A[k][k])
    for (let r = k + 1; r < n; r++) {
      if (Math.abs(A[r][k]) > maxVal) {
        maxVal = Math.abs(A[r][k])
        maxRow = r
      }
    }
    if (maxRow !== k) {
      ;[A[k], A[maxRow]] = [A[maxRow], A[k]]
      ;[B[k], B[maxRow]] = [B[maxRow], B[k]]
      steps.push({
        stepIndex: stepIdx++,
        description: `Partial Pivoting: swap R_${k + 1} ↔ R_${maxRow + 1} (|pivot| = ${formatNum(maxVal, 3)})`,
        matrixA: cloneMatrix(A),
        vectorB: [...B],
      })
    }

    if (Math.abs(A[k][k]) > 1e-12) {
      const elimOps: string[] = []
      for (let i = k + 1; i < n; i++) {
        const m = A[i][k] / A[k][k]
        if (Math.abs(m) > 1e-12) {
          elimOps.push(`R_${i + 1} ← R_${i + 1} − (${formatNum(m, 2)})R_${k + 1}`)
        }
        for (let j = k; j < n; j++) {
          A[i][j] -= m * A[k][j]
        }
        B[i] -= m * B[k]
      }
      steps.push({
        stepIndex: stepIdx++,
        description:
          elimOps.length > 0
            ? `Eliminate col ${k + 1}: ${elimOps.join(', ')}`
            : `Col ${k + 1} already zero below pivot`,
        matrixA: cloneMatrix(A),
        vectorB: [...B],
      })
    }
  }

  // Partial pivoting PA = LU forward & backward
  const pb = applyMatrix(metrics.lu.P, b)
  const forwardY = solveLowerUnit(metrics.lu.L, pb)
  const backwardX = solveUpper(metrics.lu.U, forwardY)

  // Naive Gauss without pivoting
  let naiveY: number[] | null = null
  let naiveX: number[] | null = null
  if (!metrics.lu.naiveBreakdown && metrics.lu.naiveL && metrics.lu.naiveU) {
    naiveY = solveLowerUnit(metrics.lu.naiveL, b)
    naiveX = solveUpper(metrics.lu.naiveU, naiveY)
  }

  // Complete pivoting P_c A Q_c = L_c U_c => L_c y_c = P_c b, U_c z_c = y_c, x = Q_c z_c
  const pcb = applyMatrix(metrics.lu.Pc, b)
  const yc = solveLowerUnit(metrics.lu.Lc, pcb)
  const zc = solveUpper(metrics.lu.Uc, yc)
  const completeX = applyMatrix(metrics.lu.Qc, zc)

  return {
    steps,
    forwardY,
    backwardX,
    naiveY,
    naiveX,
    completeX,
  }
}

function buildCholeskySolve(b: number[], metrics: Metrics): CholeskySolveTrace {
  const chol = metrics.cholesky
  if (!chol.isSPD || !chol.L) {
    return {
      applicable: false,
      reason: chol.reason,
      forwardY: null,
      backwardX: null,
    }
  }
  const n = chol.L.length
  const L = chol.L
  // Forward substitution L y = b
  const y = Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    let s = b[i] ?? 0
    for (let j = 0; j < i; j++) s -= L[i][j] * y[j]
    y[i] = L[i][i] > 1e-12 ? s / L[i][i] : 0
  }
  // Backward substitution L^T x = y
  const x = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i]
    for (let j = i + 1; j < n; j++) s -= L[j][i] * x[j]
    x[i] = L[i][i] > 1e-12 ? s / L[i][i] : 0
  }
  return {
    applicable: true,
    reason: chol.reason,
    forwardY: y,
    backwardX: x,
  }
}

function buildThomasTrace(a: number[][], b: number[], isTridiagonal: boolean): ThomasAlgorithmTrace {
  const n = a.length
  const subDiagA: number[] = Array(n).fill(0)
  const mainDiagD: number[] = Array(n).fill(0)
  const superDiagC: number[] = Array(n).fill(0)

  for (let i = 0; i < n; i++) {
    mainDiagD[i] = a[i][i]
    if (i > 0) subDiagA[i] = a[i][i - 1]
    if (i < n - 1) superDiagC[i] = a[i][i + 1]
  }

  // Forward sweep O(n): compute c'_i and d'_i
  const cPrime: number[] = Array(n).fill(0)
  const dPrime: number[] = Array(n).fill(0)
  let zeroPivot = false

  if (Math.abs(mainDiagD[0]) < 1e-11) {
    zeroPivot = true
  } else {
    cPrime[0] = n > 1 ? superDiagC[0] / mainDiagD[0] : 0
    dPrime[0] = (b[0] ?? 0) / mainDiagD[0]
  }

  for (let i = 1; i < n && !zeroPivot; i++) {
    const denom = mainDiagD[i] - subDiagA[i] * cPrime[i - 1]
    if (Math.abs(denom) < 1e-11) {
      zeroPivot = true
      break
    }
    cPrime[i] = i < n - 1 ? superDiagC[i] / denom : 0
    dPrime[i] = ((b[i] ?? 0) - subDiagA[i] * dPrime[i - 1]) / denom
  }

  // Back substitution: x_{n-1} = d'_{n-1}, x_i = d'_i - c'_i x_{i+1}
  const xThomas: number[] = Array(n).fill(0)
  if (!zeroPivot) {
    xThomas[n - 1] = dPrime[n - 1]
    for (let i = n - 2; i >= 0; i--) {
      xThomas[i] = dPrime[i] - cPrime[i] * xThomas[i + 1]
    }
  }

  let reason = 'Exact O(n) Tridiagonal Matrix Algorithm (TDMA)'
  if (!isTridiagonal) {
    reason = 'Non-tridiagonal entries (a₁₃ or a₃₁ ≠ 0): TDMA ignores corner entries outside the 3 diagonals'
  } else if (zeroPivot) {
    reason = 'Zero pivot encountered during Thomas forward sweep'
  }

  return {
    isTridiagonal: isTridiagonal && !zeroPivot,
    reason,
    subDiagA,
    mainDiagD,
    superDiagC,
    cPrime,
    dPrime,
    xThomas,
  }
}

function runStationarySplitting(
  id: IterativeMethodId,
  name: string,
  color: string,
  a: number[][],
  b: number[],
  x0: number[],
  maxSteps: number,
  omega = 1
 ): IterativeMethodTrace {
  const n = a.length
  const hasZeroDiag = a.some((row, i) => Math.abs(row[i]) < 1e-10)
  if (hasZeroDiag) {
    return {
      id,
      name,
      color,
      spectralRadiusG: Infinity,
      converges: false,
      reason: 'Zero on diagonal (a_ii = 0): requires row pivoting',
      points: [x0],
      residuals: [residualNorm(a, x0, b)],
    }
  }

  let G: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  if (id === 'jacobi') {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        G[i][j] = i === j ? 0 : -a[i][j] / a[i][i]
      }
    }
  } else {
    const M = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (__, j) => {
        if (i === j) return a[i][i]
        if (i > j) return omega * a[i][j]
        return 0
      })
    )
    const N = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (__, j) => {
        if (i === j) return (1 - omega) * a[i][i]
        if (i < j) return -omega * a[i][j]
        return 0
      })
    )
    const invM = invertMatrix(M)
    if (invM) {
      G = multiplyMatrices(invM, N)
    }
  }

  const eigsG = computeEigenvaluesOnly(G)
  const rhoG = Math.max(0, ...eigsG.map((p) => p.modulus))
  const converges = rhoG < 0.9999

  const points: number[][] = [[...x0]]
  const residuals: number[] = [residualNorm(a, x0, b)]
  let curr = [...x0]

  for (let step = 1; step <= maxSteps; step++) {
    const next = [...curr]
    if (id === 'jacobi') {
      for (let i = 0; i < n; i++) {
        let sigma = 0
        for (let j = 0; j < n; j++) {
          if (j !== i) sigma += a[i][j] * curr[j]
        }
        next[i] = (b[i] - sigma) / a[i][i]
      }
    } else {
      for (let i = 0; i < n; i++) {
        let sigma = 0
        for (let j = 0; j < i; j++) sigma += a[i][j] * next[j]
        for (let j = i + 1; j < n; j++) sigma += a[i][j] * curr[j]
        const gsVal = (b[i] - sigma) / a[i][i]
        next[i] = (1 - omega) * curr[i] + omega * gsVal
      }
    }
    const clamped = clampVec(next)
    points.push(clamped)
    residuals.push(residualNorm(a, clamped, b))
    curr = clamped
  }

  return {
    id,
    name,
    color,
    spectralRadiusG: rhoG,
    converges,
    reason: converges
      ? `Converges (ρ(G) = ${rhoG.toFixed(3)} < 1)`
      : `Diverges (ρ(G) = ${rhoG.toFixed(3)} ≥ 1)`,
    points,
    residuals,
  }
}

function runConjugateGradient(
  a: number[][],
  b: number[],
  x0: number[],
  maxSteps: number,
  isSPD: boolean
): IterativeMethodTrace {
  const at = transposeMatrix(a)
  const M = isSPD ? a : multiplyMatrices(at, a)
  const rhs = isSPD ? b : applyMatrix(at, b)

  const points: number[][] = [[...x0]]
  const residuals: number[] = [residualNorm(a, x0, b)]

  let x = [...x0]
  const Mx0 = applyMatrix(M, x)
  let r = rhs.map((val, i) => val - Mx0[i])
  let p = [...r]
  let rsOld = dotVec(r, r)

  for (let step = 1; step <= maxSteps; step++) {
    if (Math.sqrt(rsOld) < 1e-12) {
      points.push([...x])
      residuals.push(residualNorm(a, x, b))
      continue
    }
    const Mp = applyMatrix(M, p)
    const pMp = dotVec(p, Mp)
    if (Math.abs(pMp) < 1e-14) {
      points.push([...x])
      residuals.push(residualNorm(a, x, b))
      continue
    }
    const alpha = rsOld / pMp
    x = x.map((xi, i) => xi + alpha * p[i])
    r = r.map((ri, i) => ri - alpha * Mp[i])
    const rsNew = dotVec(r, r)
    p = r.map((ri, i) => ri + (rsNew / Math.max(rsOld, 1e-18)) * p[i])
    rsOld = rsNew

    points.push([...x])
    residuals.push(residualNorm(a, x, b))
  }

  return {
    id: 'cg',
    name: isSPD ? 'Conjugate Gradient (CG)' : 'Krylov CGNR (AᵀAx = Aᵀb)',
    color: '#e879f9',
    spectralRadiusG: 0,
    converges: true,
    reason: isSPD
      ? 'SPD Matrix: exact convergence in ≤ n steps'
      : 'Normal equations Krylov projection (always converges)',
    points,
    residuals,
  }
}

export function solveLinearSystem(
  a: number[][],
  b: number[],
  metrics: Metrics,
  x0: number[],
  sorOmega = 1.25,
  maxSteps = 25
): LinearSystemSolution {
  const n = a.length
  const xExact = metrics.inverse
    ? applyMatrix(metrics.inverse, b)
    : applyMatrix(metrics.pseudoinverse, b)
  const resNorm = residualNorm(a, xExact, b)
  const isExact = !metrics.singular || resNorm < 1e-6

  // Cramer's Rule determinants det(A_i) where column i is replaced by b
  const cramerDets: number[] = []
  for (let col = 0; col < n; col++) {
    const ai = cloneMatrix(a)
    for (let r = 0; r < n; r++) ai[r][col] = b[r] ?? 0
    cramerDets.push(computeDet(ai))
  }

  const gauss = buildGaussianTrace(a, b, metrics)
  const choleskySolve = buildCholeskySolve(b, metrics)
  const thomas = buildThomasTrace(a, b, metrics.properties.isTridiagonal)

  const jacobi = runStationarySplitting('jacobi', 'Jacobi', '#38bdf8', a, b, x0, maxSteps, 1)
  const gs = runStationarySplitting(
    'gauss-seidel',
    'Gauss-Seidel',
    '#10b981',
    a,
    b,
    x0,
    maxSteps,
    1
  )
  const sor = runStationarySplitting(
    'sor',
    `SOR (ω=${sorOmega.toFixed(2)})`,
    '#f59e0b',
    a,
    b,
    x0,
    maxSteps,
    sorOmega
  )
  const cg = runConjugateGradient(a, b, x0, maxSteps, metrics.properties.isPositiveDefinite)

  return {
    b,
    xExact,
    isExact,
    residualNorm: resNorm,
    cramerDets,
    luForwardY: gauss.forwardY,
    gauss,
    choleskySolve,
    thomas,
    iterative: {
      jacobi,
      'gauss-seidel': gs,
      sor,
      cg,
    },
  }
}
