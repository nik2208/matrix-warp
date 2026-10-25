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

export interface DiagonalDominanceRow {
  row: number
  diagAbs: number
  offDiagSum: number
  margin: number
  isStrict: boolean
  isWeak: boolean
}

export interface DiagonalDominanceInfo {
  isStrictRow: boolean
  isWeakRow: boolean
  isStrictCol: boolean
  isWeakCol: boolean
  rows: DiagonalDominanceRow[]
}

export interface PositiveDefiniteInfo {
  isSymmetric: boolean
  /** Sylvester's criterion leading principal minors: Delta_1, Delta_2, (Delta_3) */
  leadingMinors: number[]
  sylvesterPositive: boolean
  /** Whether symmetric part (A + A^T)/2 is positive definite (x^T A x > 0 for all x != 0) */
  isPositiveDefiniteQuadratic: boolean
  /** Strictly Symmetric Positive Definite (A = A^T and all eigenvalues/minors > 0) */
  isSPD: boolean
}

export interface MatrixProperties {
  isSymmetric: boolean
  isOrthogonal: boolean
  isNormal: boolean
  isPositiveDefinite: boolean
  isStrictlyDiagonallyDominant: boolean
  isTridiagonal: boolean
  isIdempotent: boolean
  isInvolutory: boolean
}

export interface LUDecomposition {
  P: number[][]
  L: number[][]
  U: number[][]
  swaps: number
  /** Naive LU without pivoting (null if zero pivot encountered) */
  naiveL: number[][] | null
  naiveU: number[][] | null
  naiveBreakdown: boolean
  /** Complete pivoting P_c A Q_c = L_c U_c */
  Pc: number[][]
  Qc: number[][]
  Lc: number[][]
  Uc: number[][]
}

export interface CholeskyDecomposition {
  /** True if A = L L^T succeeded (requires SPD) */
  isSPD: boolean
  /** Lower triangular Cholesky factor L such that A = L L^T */
  L: number[][] | null
  /** LDL^T factorization (for symmetric matrices without square roots) */
  LD: number[][] | null
  D: number[] | null
  reason: string
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
  diagDominance: DiagonalDominanceInfo
  posDefinite: PositiveDefiniteInfo
  properties: MatrixProperties
  lu: LUDecomposition
  cholesky: CholeskyDecomposition
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

export interface GaussianStep {
  stepIndex: number
  description: string
  /** Current state of matrix A^(k) */
  matrixA: number[][]
  /** Current state of RHS vector b^(k) */
  vectorB: number[]
}

export interface GaussianEliminationTrace {
  /** Step-by-step augmented states [A^(k) | b^(k)] with partial pivoting */
  steps: GaussianStep[]
  /** Forward substitution y solving L y = P b */
  forwardY: number[]
  /** Back substitution x solving U x = y */
  backwardX: number[]
  /** Naive Gauss without pivoting: forward y and backward x */
  naiveY: number[] | null
  naiveX: number[] | null
  /** Complete pivoting PAQ = LU solution */
  completeX: number[]
}

export interface ThomasAlgorithmTrace {
  isTridiagonal: boolean
  reason: string
  /** Sub-diagonal a_2..a_n, main diagonal d_1..d_n, super-diagonal c_1..c_{n-1} */
  subDiagA: number[]
  mainDiagD: number[]
  superDiagC: number[]
  /** Modified coefficients c'_i and d'_i during forward sweep */
  cPrime: number[]
  dPrime: number[]
  /** Solution vector x from Thomas back-substitution */
  xThomas: number[]
}

export interface CholeskySolveTrace {
  applicable: boolean
  reason: string
  /** Forward substitution L y = b */
  forwardY: number[] | null
  /** Backward substitution L^T x = y */
  backwardX: number[] | null
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
  /** Detailed Gaussian elimination & pivoting trace */
  gauss: GaussianEliminationTrace
  /** Cholesky L L^T direct solver trace */
  choleskySolve: CholeskySolveTrace
  /** Thomas algorithm (TDMA) direct solver trace */
  thomas: ThomasAlgorithmTrace
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
