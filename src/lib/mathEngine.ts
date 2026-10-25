import type { Complex, EigenPair, Metrics, SVDResult, StabilityLevel } from '../types/math'

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

export function normalizeVec(v: number[]): number[] {
  const n = vecNorm(v)
  if (n < 1e-12) return v.map(() => 0)
  // Canonical sign: make the first significant component positive for visual stability
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

/**
 * Jacobi eigenvalue solver for real symmetric n x n matrices (n = 2 or 3).
 * Returns eigenvalues and corresponding orthonormal eigenvectors (as column vectors).
 */
function jacobiSymmetric(sym: number[][]): { values: number[]; vectors: number[][] } {
  const n = sym.length
  const A = cloneMatrix(sym)
  const V = identityMatrix(n as 2 | 3)

  for (let iter = 0; iter < 50; iter++) {
    // Find largest off-diagonal entry
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
    const t = tau >= 0 ? 1 / (tau + Math.sqrt(1 + tau * tau)) : -1 / (-tau + Math.sqrt(1 + tau * tau))
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

/**
 * Complete an incomplete set of orthonormal vectors in R^n to a full orthonormal basis.
 */
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

  // Compute Av_i and exact singular values ||A v_i||_2
  const items = rawV.map((v) => {
    const av = applyMatrix(a, v)
    const sigma = vecNorm(av)
    return { sigma, v, av }
  })

  // Sort descending by sigma
  items.sort((x, y) => y.sigma - x.sigma)

  const singularValues = items.map((it) => it.sigma)
  const vVectors = items.map((it) => it.v)

  // Construct orthonormal left singular vectors U
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
    // Count how many singular values of (A - lambda I) are ~0
    const nullVecs: number[][] = []
    for (let i = svdB.singularValues.length - 1; i >= 0; i--) {
      if (svdB.singularValues[i] < 1e-6) {
        nullVecs.push(svdB.vVectors[i])
      }
    }
    if (nullVecs.length >= 2) {
      return [
        makeEigenPair(lambda, 0, nullVecs[0]),
        makeEigenPair(lambda, 0, nullVecs[1]),
      ]
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

  return [
    makeEigenPair(l1, 0, extractVec2(l1)),
    makeEigenPair(l2, 0, extractVec2(l2)),
  ]
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
    // 1 real root, 2 complex conjugate roots
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

  // 3 real roots
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

  // Sort real roots by descending magnitude
  roots.sort((x, y) => Math.abs(y) - Math.abs(x))

  // Group close roots so repeated eigenvalues get distinct orthogonal nullspace vectors
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
    // Candidate eigenvectors are right singular vectors from smallest singular value upwards
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

export function computeMetrics(a: number[][]): Metrics {
  const dim = a.length as 2 | 3
  const det = computeDet(a)
  const trace = computeTrace(a)
  const normFrobenius = computeFrobenius(a)
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

  const inverse = invertMatrix(a)

  return {
    det,
    trace,
    rank,
    nullity,
    normFrobenius,
    normSpectral,
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
  }
}

/**
 * Compute sequence v_0, v_1, ..., v_k where v_{m} = A v_{m-1} (optionally normalized at each step).
 */
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
      // Guard against numeric explosion while preserving direction
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
