import type {
  CholeskyDecomposition,
  Complex,
  DiagonalDominanceInfo,
  EigenPair,
  GershgorinDisc,
  LUDecomposition,
  LpMetrics,
  MatrixProperties,
  Metrics,
  PositiveDefiniteInfo,
  QRDecomposition,
  SVDResult,
  StabilityLevel,
} from '../types/math'

const EPS = 1e-10

export function identityMatrix(dim: 2 | 3): number[][] {
  return dim === 2
    ? [
        [1, 0],
        [0, 1],
      ]
    : [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]
}

export function cloneMatrix(m: number[][]): number[][] {
  return m.map((row) => [...row])
}

export function transposeMatrix(m: number[][]): number[][] {
  const n = m.length
  const res: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      res[j][i] = m[i][j]
    }
  }
  return res
}

export function multiplyMatrices(a: number[][], b: number[][]): number[][] {
  const n = a.length
  const res: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0
      for (let k = 0; k < n; k++) sum += a[i][k] * b[k][j]
      res[i][j] = sum
    }
  }
  return res
}

export function applyMatrix(m: number[][], v: number[]): number[] {
  return m.map((row) => row.reduce((acc, val, idx) => acc + val * (v[idx] ?? 0), 0))
}

export function interpolateMatrix(a: number[][], t: number): number[][] {
  const n = a.length as 2 | 3
  const id = identityMatrix(n)
  return a.map((row, i) => row.map((val, j) => (1 - t) * id[i][j] + t * val))
}

export function vecNorm(v: number[]): number {
  return Math.hypot(...v)
}

export function vecNormP(v: number[], p: number): number {
  if (!Number.isFinite(p) || p > 50) {
    let maxVal = 0
    for (const x of v) {
      const ax = Math.abs(x)
      if (ax > maxVal) maxVal = ax
    }
    return maxVal
  }
  if (p === 1) {
    let sum = 0
    for (const x of v) sum += Math.abs(x)
    return sum
  }
  if (p === 2) {
    return Math.hypot(...v)
  }
  let sum = 0
  for (const x of v) {
    sum += Math.pow(Math.abs(x), p)
  }
  return Math.pow(sum, 1 / p)
}

export function normalizeVec(v: number[]): number[] {
  const n = vecNorm(v)
  if (n < 1e-12) return v.map(() => 0)
  let sign = 1
  for (const x of v) {
    if (Math.abs(x) > 1e-6) {
      sign = x < 0 ? -1 : 1
      break
    }
  }
  return v.map((x) => (sign * x) / n)
}

export function dotVec(a: number[], b: number[]): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

export function cross3(a: number[], b: number[]): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

export function det2(a: number[][]): number {
  return a[0][0] * a[1][1] - a[0][1] * a[1][0]
}

export function det3(a: number[][]): number {
  return (
    a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) -
    a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) +
    a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0])
  )
}

export function computeDet(a: number[][]): number {
  return a.length === 2 ? det2(a) : det3(a)
}

export function computeTrace(a: number[][]): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i][i]
  return s
}

export function computeFrobenius(a: number[][]): number {
  let s = 0
  for (const row of a) {
    for (const v of row) s += v * v
  }
  return Math.sqrt(s)
}

export function computeNorm1(a: number[][]): number {
  const n = a.length
  let maxCol = 0
  for (let c = 0; c < n; c++) {
    let sum = 0
    for (let r = 0; r < n; r++) sum += Math.abs(a[r][c])
    if (sum > maxCol) maxCol = sum
  }
  return maxCol
}

export function computeNormInf(a: number[][]): number {
  let maxRow = 0
  for (const row of a) {
    const sum = row.reduce((acc, v) => acc + Math.abs(v), 0)
    if (sum > maxRow) maxRow = sum
  }
  return maxRow
}

export function invertMatrix(a: number[][]): number[][] | null {
  const n = a.length
  const d = computeDet(a)
  if (Math.abs(d) < 1e-10) return null
  if (n === 2) {
    return [
      [a[1][1] / d, -a[0][1] / d],
      [-a[1][0] / d, a[0][0] / d],
    ]
  }
  return [
    [
      (a[1][1] * a[2][2] - a[1][2] * a[2][1]) / d,
      (a[0][2] * a[2][1] - a[0][1] * a[2][2]) / d,
      (a[0][1] * a[1][2] - a[0][2] * a[1][1]) / d,
    ],
    [
      (a[1][2] * a[2][0] - a[1][0] * a[2][2]) / d,
      (a[0][0] * a[2][2] - a[0][2] * a[2][0]) / d,
      (a[0][2] * a[1][0] - a[0][0] * a[1][2]) / d,
    ],
    [
      (a[1][0] * a[2][1] - a[1][1] * a[2][0]) / d,
      (a[0][1] * a[2][0] - a[0][0] * a[2][1]) / d,
      (a[0][0] * a[1][1] - a[0][1] * a[1][0]) / d,
    ],
  ]
}

function jacobiSymmetric(sym: number[][]): { values: number[]; vectors: number[][] } {
  const n = sym.length
  const A = cloneMatrix(sym)
  const V = identityMatrix(n as 2 | 3)

  for (let iter = 0; iter < 50; iter++) {
    let maxVal = 0
    let p = 0
    let q = 1
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(A[i][j]) > maxVal) {
          maxVal = Math.abs(A[i][j])
          p = i
          q = j
        }
      }
    }
    if (maxVal < 1e-15) break

    const app = A[p][p]
    const aqq = A[q][q]
    const apq = A[p][q]
    const tau = (aqq - app) / (2 * apq)
    const t =
      tau >= 0 ? 1 / (tau + Math.sqrt(1 + tau * tau)) : -1 / (-tau + Math.sqrt(1 + tau * tau))
    const c = 1 / Math.sqrt(1 + t * t)
    const s = t * c

    A[p][p] = app - t * apq
    A[q][q] = aqq + t * apq
    A[p][q] = 0
    A[q][p] = 0

    for (let r = 0; r < n; r++) {
      if (r !== p && r !== q) {
        const arp = A[r][p]
        const arq = A[r][q]
        A[r][p] = c * arp - s * arq
        A[p][r] = A[r][p]
        A[r][q] = s * arp + c * arq
        A[q][r] = A[r][q]
      }
    }

    for (let r = 0; r < n; r++) {
      const vrp = V[r][p]
      const vrq = V[r][q]
      V[r][p] = c * vrp - s * vrq
      V[r][q] = s * vrp + c * vrq
    }
  }

  const values = Array.from({ length: n }, (_, i) => A[i][i])
  const vectors = Array.from({ length: n }, (_, col) =>
    Array.from({ length: n }, (__, row) => V[row][col])
  )
  return { values, vectors }
}

function completeOrthonormalBasis(existing: number[][], n: number): number[][] {
  const basis = existing.map((v) => [...v])
  const candidates =
    n === 2
      ? [
          [1, 0],
          [0, 1],
        ]
      : [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ]

  for (const cand of candidates) {
    if (basis.length >= n) break
    let v = [...cand]
    for (const b of basis) {
      const proj = dotVec(v, b)
      v = v.map((x, idx) => x - proj * b[idx])
    }
    const norm = vecNorm(v)
    if (norm > 1e-6) {
      basis.push(v.map((x) => x / norm))
    }
  }
  return basis
}

export function computeSVD(a: number[][]): SVDResult {
  const n = a.length
  const at = transposeMatrix(a)
  const ata = multiplyMatrices(at, a)
  const { vectors: rawV } = jacobiSymmetric(ata)

  const items = rawV.map((v) => {
    const av = applyMatrix(a, v)
    const sigma = vecNorm(av)
    return { sigma, v, av }
  })

  items.sort((x, y) => y.sigma - x.sigma)

  const singularValues = items.map((it) => it.sigma)
  const vVectors = items.map((it) => it.v)

  const validU: number[][] = []
  for (const it of items) {
    if (it.sigma > 1e-10) {
      let u = it.av.map((x) => x / it.sigma)
      for (const prev of validU) {
        const d = dotVec(u, prev)
        u = u.map((x, idx) => x - d * prev[idx])
      }
      const norm = vecNorm(u)
      if (norm > 1e-8) {
        validU.push(u.map((x) => x / norm))
      }
    }
  }

  const uVectors = completeOrthonormalBasis(validU, n)

  return {
    singularValues,
    uVectors,
    vVectors,
  }
}

export function computePseudoinverse(svd: SVDResult): number[][] {
  const n = svd.singularValues.length
  // A^+ = sum_{sigma_i > 1e-8} (1 / sigma_i) v_i u_i^T
  const pinv: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  for (let k = 0; k < n; k++) {
    const s = svd.singularValues[k]
    if (s > 1e-8) {
      const u = svd.uVectors[k]
      const v = svd.vVectors[k]
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          pinv[i][j] += (v[i] * u[j]) / s
        }
      }
    }
  }
  return pinv
}

export function computeLU(a: number[][]): LUDecomposition {
  const n = a.length as 2 | 3

  // 1. Partial Pivoting: P A = L U
  const U = cloneMatrix(a)
  const L = identityMatrix(n)
  const P = identityMatrix(n)
  let swaps = 0

  for (let k = 0; k < n; k++) {
    let maxRow = k
    let maxVal = Math.abs(U[k][k])
    for (let r = k + 1; r < n; r++) {
      if (Math.abs(U[r][k]) > maxVal) {
        maxVal = Math.abs(U[r][k])
        maxRow = r
      }
    }
    if (maxRow !== k) {
      ;[U[k], U[maxRow]] = [U[maxRow], U[k]]
      ;[P[k], P[maxRow]] = [P[maxRow], P[k]]
      for (let j = 0; j < k; j++) {
        ;[L[k][j], L[maxRow][j]] = [L[maxRow][j], L[k][j]]
      }
      swaps++
    }
    if (Math.abs(U[k][k]) > 1e-12) {
      for (let i = k + 1; i < n; i++) {
        const factor = U[i][k] / U[k][k]
        L[i][k] = factor
        for (let j = k; j < n; j++) {
          U[i][j] -= factor * U[k][j]
        }
      }
    }
  }

  // 2. Naive Gaussian Elimination (No Pivoting): A = L_naive U_naive
  const naiveU = cloneMatrix(a)
  const naiveL = identityMatrix(n)
  let naiveBreakdown = false
  for (let k = 0; k < n; k++) {
    if (Math.abs(naiveU[k][k]) < 1e-10) {
      naiveBreakdown = true
      break
    }
    for (let i = k + 1; i < n; i++) {
      const factor = naiveU[i][k] / naiveU[k][k]
      naiveL[i][k] = factor
      for (let j = k; j < n; j++) {
        naiveU[i][j] -= factor * naiveU[k][j]
      }
    }
  }

  // 3. Complete Pivoting: P_c A Q_c = L_c U_c
  const Uc = cloneMatrix(a)
  const Lc = identityMatrix(n)
  const Pc = identityMatrix(n)
  const Qc = identityMatrix(n)
  for (let k = 0; k < n; k++) {
    let maxR = k
    let maxC = k
    let maxV = Math.abs(Uc[k][k])
    for (let r = k; r < n; r++) {
      for (let c = k; c < n; c++) {
        if (Math.abs(Uc[r][c]) > maxV) {
          maxV = Math.abs(Uc[r][c])
          maxR = r
          maxC = c
        }
      }
    }
    if (maxR !== k) {
      ;[Uc[k], Uc[maxR]] = [Uc[maxR], Uc[k]]
      ;[Pc[k], Pc[maxR]] = [Pc[maxR], Pc[k]]
      for (let j = 0; j < k; j++) {
        ;[Lc[k][j], Lc[maxR][j]] = [Lc[maxR][j], Lc[k][j]]
      }
    }
    if (maxC !== k) {
      for (let r = 0; r < n; r++) {
        ;[Uc[r][k], Uc[r][maxC]] = [Uc[r][maxC], Uc[r][k]]
        ;[Qc[r][k], Qc[r][maxC]] = [Qc[r][maxC], Qc[r][k]]
      }
    }
    if (Math.abs(Uc[k][k]) > 1e-12) {
      for (let i = k + 1; i < n; i++) {
        const factor = Uc[i][k] / Uc[k][k]
        Lc[i][k] = factor
        for (let j = k; j < n; j++) {
          Uc[i][j] -= factor * Uc[k][j]
        }
      }
    }
  }

  return {
    P,
    L,
    U,
    swaps,
    naiveL: naiveBreakdown ? null : naiveL,
    naiveU: naiveBreakdown ? null : naiveU,
    naiveBreakdown,
    Pc,
    Qc,
    Lc,
    Uc,
  }
}

export function computeCholesky(a: number[][], isSymmetric: boolean): CholeskyDecomposition {
  const n = a.length as 2 | 3
  if (!isSymmetric) {
    return {
      isSPD: false,
      L: null,
      LD: null,
      D: null,
      reason: 'A ≠ Aᵀ (Cholesky requires a Symmetric Positive Definite matrix)',
    }
  }

  // LDL^T factorization (for symmetric matrices without square roots)
  const LD = identityMatrix(n)
  const D: number[] = Array(n).fill(0)
  let ldOk = true
  for (let j = 0; j < n; j++) {
    let dj = a[j][j]
    for (let k = 0; k < j; k++) {
      dj -= LD[j][k] * LD[j][k] * D[k]
    }
    D[j] = dj
    if (Math.abs(dj) < 1e-11) {
      ldOk = false
      break
    }
    for (let i = j + 1; i < n; i++) {
      let s = a[i][j]
      for (let k = 0; k < j; k++) {
        s -= LD[i][k] * LD[j][k] * D[k]
      }
      LD[i][j] = s / dj
    }
  }

  // Standard Cholesky A = L L^T
  const L: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k]
      }
      if (i === j) {
        const diag = a[i][i] - sum
        if (diag <= 1e-10) {
          return {
            isSPD: false,
            L: null,
            LD: ldOk ? LD : null,
            D: ldOk ? D : null,
            reason: `Not Positive Definite: pivot i=${i + 1} has a_${i + 1}${i + 1} - ∑ L² ≤ 0 (${formatNum(diag, 3)})`,
          }
        }
        L[i][j] = Math.sqrt(diag)
      } else {
        L[i][j] = (a[i][j] - sum) / L[j][j]
      }
    }
  }

  return {
    isSPD: true,
    L,
    LD: ldOk ? LD : null,
    D: ldOk ? D : null,
    reason: 'SPD Matrix: exact A = L Lᵀ and A = L_D D L_Dᵀ factorizations',
  }
}

export function computeQR(a: number[][]): QRDecomposition {
  const n = a.length as 2 | 3
  const cols = Array.from({ length: n }, (_, j) => a.map((row) => row[j]))
  const qCols: number[][] = []
  const R: number[][] = Array.from({ length: n }, () => Array(n).fill(0))

  for (let j = 0; j < n; j++) {
    let v = [...cols[j]]
    for (let i = 0; i < j; i++) {
      const q = qCols[i]
      const rij = dotVec(q, cols[j])
      R[i][j] = rij
      v = v.map((val, idx) => val - rij * q[idx])
    }
    const norm = vecNorm(v)
    R[j][j] = norm
    if (norm > 1e-10) {
      qCols.push(v.map((val) => val / norm))
    } else {
      const completed = completeOrthonormalBasis(qCols, n)
      qCols.push(completed[qCols.length] ?? Array(n).fill(0))
    }
  }

  const Q: number[][] = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (__, c) => qCols[c][r])
  )
  return { Q, R }
}

function makeEigenPair(re: number, im: number, vec: number[] | null): EigenPair {
  const cleanRe = Math.abs(re) < 1e-12 ? 0 : re
  const cleanIm = Math.abs(im) < 1e-12 ? 0 : im
  const modulus = Math.hypot(cleanRe, cleanIm)
  const angleDeg = (Math.atan2(cleanIm, cleanRe) * 180) / Math.PI
  return {
    value: { re: cleanRe, im: cleanIm },
    isReal: Math.abs(cleanIm) < 1e-9,
    modulus,
    angleDeg,
    vector: vec ? normalizeVec(vec) : null,
  }
}

function solveEigen2(a: number[][]): EigenPair[] {
  const tr = a[0][0] + a[1][1]
  const d = det2(a)
  const disc = tr * tr - 4 * d

  if (disc < -1e-11) {
    const re = tr / 2
    const im = Math.sqrt(-disc) / 2
    return [makeEigenPair(re, im, null), makeEigenPair(re, -im, null)]
  }

  if (Math.abs(disc) <= 1e-11) {
    const lambda = tr / 2
    const b = [
      [a[0][0] - lambda, a[0][1]],
      [a[1][0], a[1][1] - lambda],
    ]
    const svdB = computeSVD(b)
    const nullVecs: number[][] = []
    for (let i = svdB.singularValues.length - 1; i >= 0; i--) {
      if (svdB.singularValues[i] < 1e-6) {
        nullVecs.push(svdB.vVectors[i])
      }
    }
    if (nullVecs.length >= 2) {
      return [makeEigenPair(lambda, 0, nullVecs[0]), makeEigenPair(lambda, 0, nullVecs[1])]
    }
    const v1 = nullVecs[0] ?? svdB.vVectors[1]
    return [makeEigenPair(lambda, 0, v1), makeEigenPair(lambda, 0, null)]
  }

  const sqrtDisc = Math.sqrt(disc)
  const l1 = (tr + sqrtDisc) / 2
  const l2 = (tr - sqrtDisc) / 2

  const extractVec2 = (lambda: number): number[] => {
    const b = [
      [a[0][0] - lambda, a[0][1]],
      [a[1][0], a[1][1] - lambda],
    ]
    const svdB = computeSVD(b)
    return svdB.vVectors[1]
  }

  return [makeEigenPair(l1, 0, extractVec2(l1)), makeEigenPair(l2, 0, extractVec2(l2))]
}

function cbrt(x: number): number {
  return x < 0 ? -Math.pow(-x, 1 / 3) : Math.pow(x, 1 / 3)
}

function solveEigen3(a: number[][]): EigenPair[] {
  const c2 = computeTrace(a)
  const m01 = a[0][0] * a[1][1] - a[0][1] * a[1][0]
  const m02 = a[0][0] * a[2][2] - a[0][2] * a[2][0]
  const m12 = a[1][1] * a[2][2] - a[1][2] * a[2][1]
  const c1 = m01 + m02 + m12
  const c0 = det3(a)

  const shift = c2 / 3
  const p = c1 - (c2 * c2) / 3
  const q = (-2 * c2 * c2 * c2) / 27 + (c1 * c2) / 3 - c0

  const halfQ = q / 2
  const thirdP = p / 3
  const disc = halfQ * halfQ + thirdP * thirdP * thirdP

  if (disc > 1e-11) {
    const sqrtD = Math.sqrt(disc)
    const u = cbrt(-halfQ + sqrtD)
    const v = cbrt(-halfQ - sqrtD)
    const r1 = u + v + shift
    const re = -(u + v) / 2 + shift
    const im = ((u - v) * Math.sqrt(3)) / 2

    const b = [
      [a[0][0] - r1, a[0][1], a[0][2]],
      [a[1][0], a[1][1] - r1, a[1][2]],
      [a[2][0], a[2][1], a[2][2] - r1],
    ]
    const svdB = computeSVD(b)
    const vec1 = svdB.vVectors[2]

    return [
      makeEigenPair(r1, 0, vec1),
      makeEigenPair(re, Math.abs(im), null),
      makeEigenPair(re, -Math.abs(im), null),
    ]
  }

  let roots: number[]
  if (Math.abs(p) < 1e-12) {
    const y = cbrt(-q)
    roots = [y + shift, y + shift, y + shift]
  } else {
    const r = Math.sqrt(Math.max(0, -thirdP))
    const cosArg = Math.max(-1, Math.min(1, -halfQ / (r * r * r)))
    const phi = Math.acos(cosArg)
    roots = [
      2 * r * Math.cos(phi / 3) + shift,
      2 * r * Math.cos((phi + 2 * Math.PI) / 3) + shift,
      2 * r * Math.cos((phi + 4 * Math.PI) / 3) + shift,
    ]
  }

  roots.sort((x, y) => Math.abs(y) - Math.abs(x))

  const groups: { lambda: number; indices: number[] }[] = []
  roots.forEach((r, idx) => {
    const existing = groups.find((g) => Math.abs(g.lambda - r) < 1e-5)
    if (existing) {
      existing.indices.push(idx)
    } else {
      groups.push({ lambda: r, indices: [idx] })
    }
  })

  const pairs: EigenPair[] = new Array(3)
  for (const g of groups) {
    const l = g.lambda
    const b = [
      [a[0][0] - l, a[0][1], a[0][2]],
      [a[1][0], a[1][1] - l, a[1][2]],
      [a[2][0], a[2][1], a[2][2] - l],
    ]
    const svdB = computeSVD(b)
    const nullCandidates: (number[] | null)[] = []
    for (let k = 0; k < g.indices.length; k++) {
      const svIdx = 2 - k
      if (k === 0 || svdB.singularValues[svIdx] < 1e-5) {
        nullCandidates.push(svdB.vVectors[svIdx])
      } else {
        nullCandidates.push(null)
      }
    }
    g.indices.forEach((outIdx, k) => {
      pairs[outIdx] = makeEigenPair(roots[outIdx], 0, nullCandidates[k])
    })
  }

  return pairs
}

function formatCharacteristicPoly(a: number[][]): string {
  const n = a.length
  const term = (coeff: number, power: string) => {
    if (Math.abs(coeff) < 1e-9) return ''
    const sign = coeff >= 0 ? ' + ' : ' − '
    const absVal = Math.abs(coeff)
    const numStr = Math.abs(absVal - 1) < 1e-9 && power !== '' ? '' : formatNum(absVal, 2)
    return `${sign}${numStr}${power}`
  }

  if (n === 2) {
    const tr = computeTrace(a)
    const d = det2(a)
    const raw = `λ²${term(-tr, 'λ')}${term(d, '')}`
    return raw.trim() === 'λ²' ? 'λ² = 0' : `${raw} = 0`
  }

  const c2 = computeTrace(a)
  const m01 = a[0][0] * a[1][1] - a[0][1] * a[1][0]
  const m02 = a[0][0] * a[2][2] - a[0][2] * a[2][0]
  const m12 = a[1][1] * a[2][2] - a[1][2] * a[2][1]
  const c1 = m01 + m02 + m12
  const c0 = det3(a)
  return `λ³${term(-c2, 'λ²')}${term(c1, 'λ')}${term(-c0, '')} = 0`
}

function computeDiagonalDominance(a: number[][]): DiagonalDominanceInfo {
  const n = a.length
  const rows = a.map((row, i) => {
    const diagAbs = Math.abs(row[i])
    let offDiagSum = 0
    for (let j = 0; j < n; j++) {
      if (i !== j) offDiagSum += Math.abs(row[j])
    }
    const margin = diagAbs - offDiagSum
    const isStrict = margin > 1e-9
    const isWeak = margin >= -1e-9
    return {
      row: i + 1,
      diagAbs,
      offDiagSum,
      margin,
      isStrict,
      isWeak,
    }
  })

  const isStrictRow = rows.every((r) => r.isStrict)
  const isWeakRow = rows.every((r) => r.isWeak) && rows.some((r) => r.diagAbs > 1e-9)

  let isStrictCol = true
  let isWeakCol = true
  for (let j = 0; j < n; j++) {
    const diagAbs = Math.abs(a[j][j])
    let offCol = 0
    for (let i = 0; i < n; i++) {
      if (i !== j) offCol += Math.abs(a[i][j])
    }
    if (diagAbs <= offCol + 1e-9) isStrictCol = false
    if (diagAbs < offCol - 1e-9) isWeakCol = false
  }

  return {
    isStrictRow,
    isWeakRow,
    isStrictCol,
    isWeakCol,
    rows,
  }
}

function computePositiveDefiniteInfo(
  a: number[][],
  isSymmetric: boolean,
  eigenPairs: EigenPair[]
): PositiveDefiniteInfo {
  const n = a.length
  const delta1 = a[0][0]
  const delta2 = a[0][0] * a[1][1] - a[0][1] * a[1][0]
  const leadingMinors = n === 2 ? [delta1, delta2] : [delta1, delta2, det3(a)]
  const sylvesterPositive = leadingMinors.every((m) => m > 1e-8)

  // Symmetric part S = (A + A^T) / 2 for general quadratic form x^T A x > 0
  const symPart: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) => 0.5 * (a[i][j] + a[j][i]))
  )
  const symDelta1 = symPart[0][0]
  const symDelta2 = symPart[0][0] * symPart[1][1] - symPart[0][1] * symPart[1][0]
  const symMinors = n === 2 ? [symDelta1, symDelta2] : [symDelta1, symDelta2, det3(symPart)]
  const isPositiveDefiniteQuadratic = symMinors.every((m) => m > 1e-8)

  const isSPD =
    isSymmetric &&
    sylvesterPositive &&
    eigenPairs.every((p) => p.isReal && p.value.re > 1e-6)

  return {
    isSymmetric,
    leadingMinors,
    sylvesterPositive,
    isPositiveDefiniteQuadratic,
    isSPD,
  }
}

function analyzeMatrixProperties(a: number[][], eigenPairs: EigenPair[]): MatrixProperties {
  const n = a.length
  const tol = 1e-6

  // Symmetric: A = A^T
  let isSymmetric = true
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(a[i][j] - a[j][i]) > tol) isSymmetric = false
    }
  }

  // Orthogonal: A^T A = I
  const at = transposeMatrix(a)
  const ata = multiplyMatrices(at, a)
  const aat = multiplyMatrices(a, at)
  const id = identityMatrix(n as 2 | 3)
  let isOrthogonal = true
  let isNormal = true
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (Math.abs(ata[i][j] - id[i][j]) > 1e-4) isOrthogonal = false
      if (Math.abs(ata[i][j] - aat[i][j]) > 1e-4) isNormal = false
    }
  }

  // Positive definite: symmetric & all eigenvalues > 0
  const isPositiveDefinite =
    isSymmetric && eigenPairs.every((p) => p.isReal && p.value.re > 1e-6)

  // Strictly diagonally dominant: |a_ii| > sum_{j!=i} |a_ij|
  let isStrictlyDiagonallyDominant = true
  for (let i = 0; i < n; i++) {
    const diag = Math.abs(a[i][i])
    let off = 0
    for (let j = 0; j < n; j++) {
      if (i !== j) off += Math.abs(a[i][j])
    }
    if (diag <= off + 1e-9) isStrictlyDiagonallyDominant = false
  }

  // Tridiagonal: a_ij = 0 for |i - j| > 1
  let isTridiagonal = true
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (Math.abs(i - j) > 1 && Math.abs(a[i][j]) > 1e-8) {
        isTridiagonal = false
      }
    }
  }

  // Idempotent: A^2 = A; Involutory: A^2 = I
  const a2 = multiplyMatrices(a, a)
  let isIdempotent = true
  let isInvolutory = true
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (Math.abs(a2[i][j] - a[i][j]) > 1e-4) isIdempotent = false
      if (Math.abs(a2[i][j] - id[i][j]) > 1e-4) isInvolutory = false
    }
  }

  return {
    isSymmetric,
    isOrthogonal,
    isNormal,
    isPositiveDefinite,
    isStrictlyDiagonallyDominant,
    isTridiagonal,
    isIdempotent,
    isInvolutory,
  }
}

export function computeEigenvaluesOnly(a: number[][]): EigenPair[] {
  return a.length === 2 ? solveEigen2(a) : solveEigen3(a)
}

export function computeMetrics(a: number[][]): Metrics {
  const dim = a.length as 2 | 3
  const det = computeDet(a)
  const trace = computeTrace(a)
  const normFrobenius = computeFrobenius(a)
  const norm1 = computeNorm1(a)
  const normInf = computeNormInf(a)
  const svd = computeSVD(a)
  const singularValues = svd.singularValues
  const sigmaMax = singularValues[0] ?? 0
  const sigmaMin = singularValues[singularValues.length - 1] ?? 0
  const normSpectral = sigmaMax

  const rank = singularValues.filter((s) => s > 1e-7).length
  const nullity = dim - rank
  const singular = rank < dim || Math.abs(det) < EPS
  const orientationFlipped = !singular && det < 0

  let cond = Infinity
  if (!singular && sigmaMin > EPS) {
    cond = sigmaMax / sigmaMin
  }

  let stability: StabilityLevel = 'optimal'
  if (singular || !Number.isFinite(cond)) {
    stability = 'singular'
  } else if (cond > 100) {
    stability = 'ill-conditioned'
  } else if (cond > 10) {
    stability = 'moderate'
  }

  let collapseDescription = ''
  if (dim === 2) {
    if (rank === 2) {
      collapseDescription = orientationFlipped
        ? 'Full 2D Plane (Orientation Reversed)'
        : 'Full 2D Plane (Preserves Orientation)'
    } else if (rank === 1) {
      collapseDescription = 'Dimension Collapse: 2D Plane → 1D Line'
    } else {
      collapseDescription = 'Total Collapse: 2D Plane → 0D Origin Point'
    }
  } else {
    if (rank === 3) {
      collapseDescription = orientationFlipped
        ? 'Full 3D Space (Handedness Flipped)'
        : 'Full 3D Space (Preserves Handedness)'
    } else if (rank === 2) {
      collapseDescription = 'Dimension Collapse: 3D Space → 2D Plane'
    } else if (rank === 1) {
      collapseDescription = 'Dimension Collapse: 3D Space → 1D Line'
    } else {
      collapseDescription = 'Total Collapse: 3D Space → 0D Origin Point'
    }
  }

  const eigenPairs = dim === 2 ? solveEigen2(a) : solveEigen3(a)
  const eigenvalues: Complex[] = eigenPairs.map((p) => p.value)
  const eigenvectors: number[][] = eigenPairs
    .map((p) => p.vector)
    .filter((v): v is number[] => v !== null)

  const spectralRadius = Math.max(0, ...eigenPairs.map((p) => p.modulus))
  const characteristicPoly = formatCharacteristicPoly(a)
  const inverse = invertMatrix(a)
  const pseudoinverse = computePseudoinverse(svd)

  const gershgorin: GershgorinDisc[] = a.map((row, i) => ({
    row: i + 1,
    center: row[i],
    radius: row.reduce((acc, v, j) => (i === j ? acc : acc + Math.abs(v)), 0),
  }))

  const properties = analyzeMatrixProperties(a, eigenPairs)
  const diagDominance = computeDiagonalDominance(a)
  const posDefinite = computePositiveDefiniteInfo(a, properties.isSymmetric, eigenPairs)
  const lu = computeLU(a)
  const cholesky = computeCholesky(a, properties.isSymmetric)
  const qr = computeQR(a)

  const colspaceBasis: number[][] = []
  const nullspaceBasis: number[][] = []
  svd.singularValues.forEach((s, idx) => {
    if (s > 1e-7) {
      colspaceBasis.push(svd.uVectors[idx])
    } else {
      nullspaceBasis.push(svd.vVectors[idx])
    }
  })

  return {
    det,
    trace,
    rank,
    nullity,
    spectralRadius,
    characteristicPoly,
    normFrobenius,
    normSpectral,
    norm1,
    normInf,
    cond,
    singular,
    orientationFlipped,
    collapseDescription,
    stability,
    eigenvalues,
    eigenvectors,
    eigenPairs,
    singularValues,
    svd,
    inverse,
    pseudoinverse,
    gershgorin,
    diagDominance,
    posDefinite,
    properties,
    lu,
    cholesky,
    qr,
    nullspaceBasis,
    colspaceBasis,
  }
}

/**
 * Sample points on the 2D L_p unit circle { x in R^2 : ||x||_p = 1 }
 */
export function sampleLpUnitBall2D(p: number, segments = 180): [number, number][] {
  const pts: [number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2
    const cx = Math.cos(theta)
    const cy = Math.sin(theta)
    const n = vecNormP([cx, cy], p)
    pts.push(n > 1e-12 ? [cx / n, cy / n] : [0, 0])
  }
  return pts
}

/**
 * Compute induced matrix norm ||A||_p = max_{||x||_p = 1} ||Ax||_p and maximizer x_max,
 * plus vector norms ||v||_p, ||Av||_p, ||b||_p and condition number kappa_p(A).
 */
export function computeLpMetrics(
  a: number[][],
  v: number[],
  b: number[],
  p: number
): LpMetrics {
  const dim = a.length as 2 | 3
  const av = applyMatrix(a, v)
  const vecNormV = vecNormP(v, p)
  const vecNormAv = vecNormP(av, p)
  const vecNormB = vecNormP(b, p)
  const pLabel = !Number.isFinite(p) ? '∞' : Number(p.toFixed(2)).toString()

  // Candidate unit vectors on ||x||_p = 1
  const candidates: number[][] = []
  if (dim === 2) {
    const steps = 360
    for (let i = 0; i < steps; i++) {
      const theta = (i / steps) * Math.PI * 2
      const raw = [Math.cos(theta), Math.sin(theta)]
      const n = vecNormP(raw, p)
      if (n > 1e-12) candidates.push([raw[0] / n, raw[1] / n])
    }
    // Include exact cardinal & diagonal corners for L1 and L_inf
    const corners = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ]
    for (const c of corners) {
      const n = vecNormP(c, p)
      candidates.push([c[0] / n, c[1] / n])
    }
  } else {
    // 3D spherical grid projected onto ||x||_p = 1 + cube/octahedron vertices
    const latSteps = 28
    const lonSteps = 56
    for (let i = 0; i <= latSteps; i++) {
      const phi = (i / latSteps) * Math.PI
      const sp = Math.sin(phi)
      const cp = Math.cos(phi)
      for (let j = 0; j < lonSteps; j++) {
        const theta = (j / lonSteps) * Math.PI * 2
        const raw = [sp * Math.cos(theta), sp * Math.sin(theta), cp]
        const n = vecNormP(raw, p)
        if (n > 1e-12) candidates.push([raw[0] / n, raw[1] / n, raw[2] / n])
      }
    }
    const special3 = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 1],
      [1, 1, -1],
      [1, -1, 1],
      [-1, 1, 1],
    ]
    for (const c of special3) {
      const n = vecNormP(c, p)
      candidates.push([c[0] / n, c[1] / n, c[2] / n])
    }
  }

  let matrixNormP = 0
  let maximizerX: number[] = dim === 2 ? [1, 0] : [1, 0, 0]
  let maximizerAx: number[] = applyMatrix(a, maximizerX)

  for (const x of candidates) {
    const ax = applyMatrix(a, x)
    const val = vecNormP(ax, p)
    if (val > matrixNormP) {
      matrixNormP = val
      maximizerX = x
      maximizerAx = ax
    }
  }

  // Exact analytical override for p = 1 and p = Infinity
  if (p === 1) {
    matrixNormP = computeNorm1(a)
  } else if (!Number.isFinite(p)) {
    matrixNormP = computeNormInf(a)
  }

  const inv = invertMatrix(a)
  let invMatrixNormP = Infinity
  if (inv) {
    if (p === 1) {
      invMatrixNormP = computeNorm1(inv)
    } else if (!Number.isFinite(p)) {
      invMatrixNormP = computeNormInf(inv)
    } else {
      let maxInv = 0
      for (const x of candidates) {
        const invX = applyMatrix(inv, x)
        const val = vecNormP(invX, p)
        if (val > maxInv) maxInv = val
      }
      invMatrixNormP = maxInv
    }
  }

  const condP =
    !inv || matrixNormP < 1e-12 || !Number.isFinite(invMatrixNormP)
      ? Infinity
      : matrixNormP * invMatrixNormP

  return {
    p,
    pLabel,
    vecNormV,
    vecNormAv,
    vecNormB,
    matrixNormP,
    invMatrixNormP,
    condP,
    maximizerX,
    maximizerAx,
  }
}

export function computePowerOrbit(
  a: number[][],
  v0: number[],
  steps: number,
  normalizeEachStep = false
): number[][] {
  const orbit: number[][] = [[...v0]]
  let curr = [...v0]
  for (let i = 1; i <= steps; i++) {
    let next = applyMatrix(a, curr)
    if (normalizeEachStep) {
      const n = vecNorm(next)
      if (n > 1e-12) next = next.map((x) => x / n)
    } else {
      const n = vecNorm(next)
      if (n > 1e6) {
        next = next.map((x) => (x / n) * 1e6)
      }
    }
    orbit.push(next)
    curr = next
  }
  return orbit
}

export function formatNum(n: number, digits = 3): string {
  if (Number.isNaN(n)) return 'NaN'
  if (!Number.isFinite(n)) return n > 0 ? '∞' : '-∞'
  if (Math.abs(n) < 1e-10) return '0'
  if (Math.abs(n) >= 1e4 || (Math.abs(n) > 0 && Math.abs(n) < 1e-3)) {
    return n.toExponential(2)
  }
  return Number(n.toFixed(digits)).toString()
}

export function formatComplex(c: Complex, digits = 3): string {
  const reClean = Math.abs(c.re) < 1e-10 ? 0 : c.re
  const imClean = Math.abs(c.im) < 1e-10 ? 0 : c.im
  if (imClean === 0) return formatNum(reClean, digits)
  const imAbs = formatNum(Math.abs(imClean), digits)
  const sign = imClean >= 0 ? '+' : '−'
  if (reClean === 0) {
    return `${imClean < 0 ? '−' : ''}${imAbs}i`
  }
  return `${formatNum(reClean, digits)} ${sign} ${imAbs}i`
}
