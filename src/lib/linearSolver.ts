import type {
  IterativeMethodId,
  IterativeMethodTrace,
  LinearSystemSolution,
  Metrics,
} from '../types/math'
import {
  applyMatrix,
  cloneMatrix,
  computeDet,
  computeEigenvaluesOnly,
  dotVec,
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
  // Check zero diagonal entries
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

  // Build iteration matrix G to compute exact spectral radius rho(G)
  let G: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  if (id === 'jacobi') {
    // G_J = -D^{-1}(L + U)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        G[i][j] = i === j ? 0 : -a[i][j] / a[i][i]
      }
    }
  } else {
    // Gauss-Seidel (omega=1) or SOR: (D + omega L) x^{k+1} = ((1-omega)D - omega U) x^k + omega b
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
      // Gauss-Seidel / SOR uses updated components immediately
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

/**
 * Conjugate Gradient (on Normal Equations A^T A x = A^T b for general non-symmetric matrices,
 * or standard CG when A is SPD) so it converges monotonically in <= n steps!
 */
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

  // Forward substitution L y = P b
  const pb = applyMatrix(metrics.lu.P, b)
  const luForwardY: number[] = Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    let s = pb[i]
    for (let j = 0; j < i; j++) s -= metrics.lu.L[i][j] * luForwardY[j]
    luForwardY[i] = s
  }

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
    luForwardY,
    iterative: {
      jacobi,
      'gauss-seidel': gs,
      sor,
      cg,
    },
  }
}
