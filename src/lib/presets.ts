export interface MatrixPreset {
  id: string
  name: string
  badge: string
  description: string
  matrix: number[][]
}

export const PRESETS_2D: MatrixPreset[] = [
  {
    id: 'identity',
    name: 'Identity',
    badge: 'I₂',
    description: 'Leaves all vectors unchanged. Area scale = 1, isotropic singular values σ₁ = σ₂ = 1.',
    matrix: [
      [1, 0],
      [0, 1],
    ],
  },
  {
    id: 'rotation-60',
    name: 'Rotation 60°',
    badge: 'SO(2)',
    description: 'Pure counter-clockwise rotation by 60°. Complex conjugate eigenvalues e^{±iπ/3}, no real invariant lines.',
    matrix: [
      [0.5, -0.866],
      [0.866, 0.5],
    ],
  },
  {
    id: 'rotation-90',
    name: 'Rotation 90°',
    badge: '±i',
    description: 'Quarter-turn orthogonal rotation. Preserves Euclidean norms and areas (det = 1, κ = 1).',
    matrix: [
      [0, -1],
      [1, 0],
    ],
  },
  {
    id: 'scaling',
    name: 'Anisotropic Scale',
    badge: 'Diag',
    description: 'Stretches X by 2× and compresses Y by 0.5×. Preserves total area (det = 1) while deforming the unit circle into an ellipse.',
    matrix: [
      [2, 0],
      [0, 0.5],
    ],
  },
  {
    id: 'shear',
    name: 'Horizontal Shear',
    badge: 'Defective',
    description: 'Slants space parallel to the X-axis. Repeated eigenvalue λ = 1 with only 1 real eigenvector direction (non-diagonalizable).',
    matrix: [
      [1, 1.2],
      [0, 1],
    ],
  },
  {
    id: 'reflection',
    name: 'Reflection (y = x)',
    badge: 'det = -1',
    description: 'Swaps X and Y axes, reversing spatial orientation (det = -1). Eigenvectors along y = x (λ = 1) and y = -x (λ = -1).',
    matrix: [
      [0, 1],
      [1, 0],
    ],
  },
  {
    id: 'spiral',
    name: 'Spiral Contraction',
    badge: 'Damped',
    description: 'Rotates and contracts vectors toward the origin under repeated powers A^k v (|λ| < 1).',
    matrix: [
      [0.75, -0.45],
      [0.45, 0.75],
    ],
  },
  {
    id: 'projection',
    name: 'Projection (Rank 1)',
    badge: 'Idempotent',
    description: 'Orthogonal projection onto the line 2x + y. Collapses 2D space onto a 1D subspace (det = 0, κ = ∞).',
    matrix: [
      [0.8, 0.4],
      [0.4, 0.2],
    ],
  },
  {
    id: 'singular',
    name: 'Singular Collapse',
    badge: 'det = 0',
    description: 'Linearly dependent columns collapse the entire 2D plane onto the span of (1, 0.5).',
    matrix: [
      [1, 2],
      [0.5, 1],
    ],
  },
  {
    id: 'ill-conditioned',
    name: 'Ill-Conditioned',
    badge: 'High κ',
    description: 'Nearly collinear columns produce an extreme aspect-ratio SVD ellipse and high condition number κ(A) ≫ 1.',
    matrix: [
      [1, 0.98],
      [0.98, 1],
    ],
  },
]

export const PRESETS_3D: MatrixPreset[] = [
  {
    id: 'identity-3d',
    name: 'Identity',
    badge: 'I₃',
    description: '3D identity operator. Unit cube and unit sphere remain invariant.',
    matrix: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
  },
  {
    id: 'rotation-z',
    name: 'Helical Rotation',
    badge: 'SO(3)',
    description: 'Rotation around the Z-axis by 60° with slight Z expansion. One real eigen-axis (Z) and complex conjugate pair in XY.',
    matrix: [
      [0.5, -0.866, 0],
      [0.866, 0.5, 0],
      [0, 0, 1.2],
    ],
  },
  {
    id: 'scaling-3d',
    name: 'Triaxial Ellipsoid',
    badge: 'Diag',
    description: 'Distinct principal stretches along X (1.8×), Y (1.1×), and Z (0.5×).',
    matrix: [
      [1.8, 0, 0],
      [0, 1.1, 0],
      [0, 0, 0.5],
    ],
  },
  {
    id: 'shear-3d',
    name: '3D Shear',
    badge: 'det = 1',
    description: 'Volume-preserving 3D shear transformation skewing X with Y and Z.',
    matrix: [
      [1, 0.9, 0.5],
      [0, 1, 0.6],
      [0, 0, 1],
    ],
  },
  {
    id: 'reflection-3d',
    name: 'Mirror Inversion',
    badge: 'det < 0',
    description: 'Inverts handedness across the YZ plane while stretching Y and Z (det < 0).',
    matrix: [
      [-1, 0, 0],
      [0, 1.3, 0.3],
      [0, 0.3, 1.3],
    ],
  },
  {
    id: 'projection-3d',
    name: 'Plane Projection',
    badge: 'Rank 2',
    description: 'Flattens 3D space onto the XY plane (rank = 2, det = 0, κ = ∞).',
    matrix: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
  },
  {
    id: 'singular-line-3d',
    name: 'Line Collapse',
    badge: 'Rank 1',
    description: 'Rank-1 matrix that crushes all of 3D space onto a single 1D line along (1, 1, 1).',
    matrix: [
      [0.6, 0.6, 0.6],
      [0.6, 0.6, 0.6],
      [0.6, 0.6, 0.6],
    ],
  },
  {
    id: 'ill-conditioned-3d',
    name: 'Ill-Conditioned 3D',
    badge: 'High κ',
    description: 'Near-planar basis vectors yield a pancake-thin 3D ellipsoid and severe numerical sensitivity.',
    matrix: [
      [1, 0.95, 0.9],
      [0.95, 1, 0.95],
      [0.9, 0.95, 1],
    ],
  },
]
