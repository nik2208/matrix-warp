export type Mode = '2d' | '3d'

export interface Complex {
  re: number
  im: number
}

export interface EigenPair {
  value: Complex
  isReal: boolean
  modulus: number
  angleDeg: number
  /** Normalized real eigenvector (null if eigenvalue is non-real) */
  vector: number[] | null
}

export interface SVDResult {
  /** Singular values sorted descending: sigma_1 >= sigma_2 (>= sigma_3) >= 0 */
  singularValues: number[]
  /** Orthonormal left singular vectors (columns of U, i.e. UCols[i] is u_i) */
  uVectors: number[][]
  /** Orthonormal right singular vectors (columns of V, i.e. VCols[i] is v_i) */
  vVectors: number[][]
}

export interface GershgorinDisc {
  row: number
  center: number
  radius: number
}

export interface MatrixProperties {
  isSymmetric: boolean
  isOrthogonal: boolean
  isNormal: boolean
  isPositiveDefinite: boolean
  isStrictlyDiagonallyDominant: boolean
  isIdempotent: boolean
  isInvolutory: boolean
}

export interface LUDecomposition {
  P: number[][]
  L: number[][]
  U: number[][]
  swaps: number
}

export interface QRDecomposition {
  Q: number[][]
  R: number[][]
}

export type StabilityLevel = 'optimal' | 'moderate' | 'ill-conditioned' | 'singular'

export interface Metrics {
  det: number
  trace: number
  rank: number
  nullity: number
  spectralRadius: number
  characteristicPoly: string
  normFrobenius: number
  normSpectral: number
  norm1: number
  normInf: number
  cond: number
  singular: boolean
  orientationFlipped: boolean
  collapseDescription: string
  stability: StabilityLevel
  eigenvalues: Complex[]
  eigenvectors: number[][]
  eigenPairs: EigenPair[]
  singularValues: number[]
  svd: SVDResult
  inverse: number[][] | null
  pseudoinverse: number[][]
  gershgorin: GershgorinDisc[]
  properties: MatrixProperties
  lu: LUDecomposition
  qr: QRDecomposition
  nullspaceBasis: number[][]
  colspaceBasis: number[][]
}

export interface LpMetrics {
  p: number // 1..10 or Infinity
  pLabel: string
  vecNormV: number
  vecNormAv: number
  vecNormB: number
  matrixNormP: number
  invMatrixNormP: number
  condP: number
  /** Unit vector in ||x||_p = 1 that achieves max ||Ax||_p */
  maximizerX: number[]
  /** Image A * maximizerX with ||A * maximizerX||_p = ||A||_p */
  maximizerAx: number[]
}

export type IterativeMethodId = 'jacobi' | 'gauss-seidel' | 'sor' | 'cg'

export interface IterativeMethodTrace {
  id: IterativeMethodId
  name: string
  color: string
  spectralRadiusG: number
  converges: boolean
  reason: string
  /** Sequence of iterates x^(0), x^(1), ..., x^(maxIter) */
  points: number[][]
  /** Residual norms ||A x^(k) - b||_2 at each step */
  residuals: number[]
}

export interface LinearSystemSolution {
  b: number[]
  /** Exact solution A^-1 b if nonsingular, or minimum-norm least-squares A^+ b if singular */
  xExact: number[]
  isExact: boolean
  residualNorm: number
  /** Determinants det(A_i) for Cramer's rule */
  cramerDets: number[]
  /** Intermediate y in L y = P b */
  luForwardY: number[]
  /** Iterative solver traces */
  iterative: Record<IterativeMethodId, IterativeMethodTrace>
}

export interface LayerVisibility {
  baseGrid: boolean
  warpedGrid: boolean
  unitArea: boolean
  svdCircle: boolean
  lpBall: boolean
  eigenLines: boolean
  rowPlanes: boolean
  colPicture: boolean
  vectors: boolean
  trajectory: boolean
  iterativePaths: boolean
}
