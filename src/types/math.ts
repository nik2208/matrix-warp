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

export type StabilityLevel = 'optimal' | 'moderate' | 'ill-conditioned' | 'singular'

export interface Metrics {
  det: number
  trace: number
  rank: number
  nullity: number
  normFrobenius: number
  normSpectral: number
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
}

export interface LayerVisibility {
  baseGrid: boolean
  warpedGrid: boolean
  unitArea: boolean
  svdCircle: boolean
  eigenLines: boolean
  vectors: boolean
  trajectory: boolean
}
