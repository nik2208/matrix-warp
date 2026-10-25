export interface MatrixPreset {
  id: string
  name: string
  nameIt: string
  badge: string
  description: string
  descriptionIt: string
  matrix: number[][]
}

export const PRESETS_2D: MatrixPreset[] = [
  {
    id: 'identity',
    name: 'Identity',
    nameIt: 'Identità',
    badge: 'I₂',
    description:
      'Leaves all vectors unchanged. Area scale = 1, isotropic singular values σ₁ = σ₂ = 1.',
    descriptionIt:
      'Lascia invariati tutti i vettori. Fattore di area = 1, valori singolari isotropi σ₁ = σ₂ = 1.',
    matrix: [
      [1, 0],
      [0, 1],
    ],
  },
  {
    id: 'rotation-60',
    name: 'Rotation 60°',
    nameIt: 'Rotazione 60°',
    badge: 'SO(2)',
    description:
      'Pure counter-clockwise rotation by 60°. Complex conjugate eigenvalues e^{±iπ/3}, no real invariant lines.',
    descriptionIt:
      'Rotazione pura antioraria di 60°. Autovalori complessi coniugati e^{±iπ/3}, nessuna retta invariante reale.',
    matrix: [
      [0.5, -0.866],
      [0.866, 0.5],
    ],
  },
  {
    id: 'rotation-90',
    name: 'Rotation 90°',
    nameIt: 'Rotazione 90°',
    badge: '±i',
    description:
      'Quarter-turn orthogonal rotation. Preserves Euclidean norms and areas (det = 1, κ = 1).',
    descriptionIt:
      'Rotazione ortogonale di 90°. Preserva norme euclidee e aree (det = 1, κ = 1).',
    matrix: [
      [0, -1],
      [1, 0],
    ],
  },
  {
    id: 'scaling',
    name: 'Anisotropic Scale',
    nameIt: 'Scala Anisotropa',
    badge: 'Diag',
    description:
      'Stretches X by 2× and compresses Y by 0.5×. Preserves total area (det = 1) while deforming the unit circle into an ellipse.',
    descriptionIt:
      'Dilata X di 2× e comprime Y di 0.5×. Preserva l’area totale (det = 1) deformando il cerchio unitario in un’ellisse.',
    matrix: [
      [2, 0],
      [0, 0.5],
    ],
  },
  {
    id: 'shear',
    name: 'Horizontal Shear',
    nameIt: 'Taglio Orizzontale',
    badge: 'Defective',
    description:
      'Slants space parallel to the X-axis. Repeated eigenvalue λ = 1 with only 1 real eigenvector direction (non-diagonalizable).',
    descriptionIt:
      'Inclina il piano parallelamente all’asse X. Autovalore ripetuto λ = 1 con una sola direzione di autovettore (non diagonalizzabile).',
    matrix: [
      [1, 1.2],
      [0, 1],
    ],
  },
  {
    id: 'reflection',
    name: 'Reflection (y = x)',
    nameIt: 'Riflessione (y = x)',
    badge: 'det = -1',
    description:
      'Swaps X and Y axes, reversing spatial orientation (det = -1). Eigenvectors along y = x (λ = 1) and y = -x (λ = -1).',
    descriptionIt:
      'Scambia gli assi X e Y invertendo l’orientamento del piano (det = -1). Autovettori lungo y = x (λ = 1) e y = -x (λ = -1).',
    matrix: [
      [0, 1],
      [1, 0],
    ],
  },
  {
    id: 'spiral',
    name: 'Spiral Contraction',
    nameIt: 'Spirale Contrattiva',
    badge: 'Damped',
    description:
      'Rotates and contracts vectors toward the origin under repeated powers A^k v (|λ| < 1).',
    descriptionIt:
      'Ruota e contrae i vettori verso l’origine sotto potenze successive A^k v (|λ| < 1).',
    matrix: [
      [0.75, -0.45],
      [0.45, 0.75],
    ],
  },
  {
    id: 'projection',
    name: 'Projection (Rank 1)',
    nameIt: 'Proiezione (Rango 1)',
    badge: 'Idempotent',
    description:
      'Orthogonal projection onto the line 2x + y. Collapses 2D space onto a 1D subspace (det = 0, κ = ∞).',
    descriptionIt:
      'Proiezione ortogonale sulla retta 2x + y. Collassa il piano 2D su un sottospazio 1D (det = 0, κ = ∞).',
    matrix: [
      [0.8, 0.4],
      [0.4, 0.2],
    ],
  },
  {
    id: 'singular',
    name: 'Singular Collapse',
    nameIt: 'Collasso Singolare',
    badge: 'det = 0',
    description:
      'Linearly dependent columns collapse the entire 2D plane onto the span of (1, 0.5).',
    descriptionIt:
      'Colonne linearmente dipendenti che schiacciano l’intero piano 2D sulla retta generata da (1, 0.5).',
    matrix: [
      [1, 2],
      [0.5, 1],
    ],
  },
  {
    id: 'ill-conditioned',
    name: 'Ill-Conditioned',
    nameIt: 'Mal Condizionata',
    badge: 'High κ',
    description:
      'Nearly collinear columns produce an extreme aspect-ratio SVD ellipse and high condition number κ(A) ≫ 1.',
    descriptionIt:
      'Colonne quasi collineari producono un’ellisse SVD molto schiacciata e un numero di condizionamento κ(A) ≫ 1.',
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
    nameIt: 'Identità',
    badge: 'I₃',
    description: '3D identity operator. Unit cube and unit sphere remain invariant.',
    descriptionIt: 'Operatore identità 3D. Il cubo unitario e la sfera unitaria restano invariati.',
    matrix: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
  },
  {
    id: 'rotation-z',
    name: 'Helical Rotation',
    nameIt: 'Rotazione Elicoidale',
    badge: 'SO(3)',
    description:
      'Rotation around the Z-axis by 60° with slight Z expansion. One real eigen-axis (Z) and complex conjugate pair in XY.',
    descriptionIt:
      'Rotazione attorno all’asse Z di 60° con leggera dilatazione lungo Z. Un asse invariante reale (Z) e coppia complessa coniugata in XY.',
    matrix: [
      [0.5, -0.866, 0],
      [0.866, 0.5, 0],
      [0, 0, 1.2],
    ],
  },
  {
    id: 'scaling-3d',
    name: 'Triaxial Ellipsoid',
    nameIt: 'Ellissoide Triassiale',
    badge: 'Diag',
    description: 'Distinct principal stretches along X (1.8×), Y (1.1×), and Z (0.5×).',
    descriptionIt: 'Dilatazioni principali distinte lungo X (1.8×), Y (1.1×) e Z (0.5×).',
    matrix: [
      [1.8, 0, 0],
      [0, 1.1, 0],
      [0, 0, 0.5],
    ],
  },
  {
    id: 'shear-3d',
    name: '3D Shear',
    nameIt: 'Taglio 3D',
    badge: 'det = 1',
    description: 'Volume-preserving 3D shear transformation skewing X with Y and Z.',
    descriptionIt: 'Trasformazione di taglio 3D che preserva il volume inclinando X rispetto a Y e Z.',
    matrix: [
      [1, 0.9, 0.5],
      [0, 1, 0.6],
      [0, 0, 1],
    ],
  },
  {
    id: 'reflection-3d',
    name: 'Mirror Inversion',
    nameIt: 'Inversione Speculare',
    badge: 'det < 0',
    description: 'Inverts handedness across the YZ plane while stretching Y and Z (det < 0).',
    descriptionIt:
      'Inverte l’orientamento spaziale rispetto al piano YZ dilatando Y e Z (det < 0).',
    matrix: [
      [-1, 0, 0],
      [0, 1.3, 0.3],
      [0, 0.3, 1.3],
    ],
  },
  {
    id: 'projection-3d',
    name: 'Plane Projection',
    nameIt: 'Proiezione Planare',
    badge: 'Rank 2',
    description: 'Flattens 3D space onto the XY plane (rank = 2, det = 0, κ = ∞).',
    descriptionIt: 'Schiaccia lo spazio 3D sul piano XY (rango = 2, det = 0, κ = ∞).',
    matrix: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
  },
  {
    id: 'singular-line-3d',
    name: 'Line Collapse',
    nameIt: 'Collasso su Retta',
    badge: 'Rank 1',
    description:
      'Rank-1 matrix that crushes all of 3D space onto a single 1D line along (1, 1, 1).',
    descriptionIt:
      'Matrice di rango 1 che comprime tutto lo spazio 3D su una singola retta 1D lungo (1, 1, 1).',
    matrix: [
      [0.6, 0.6, 0.6],
      [0.6, 0.6, 0.6],
      [0.6, 0.6, 0.6],
    ],
  },
  {
    id: 'ill-conditioned-3d',
    name: 'Ill-Conditioned 3D',
    nameIt: 'Mal Condizionata 3D',
    badge: 'High κ',
    description:
      'Near-planar basis vectors yield a pancake-thin 3D ellipsoid and severe numerical sensitivity.',
    descriptionIt:
      'Vettori di base quasi complanari generano un ellissoide 3D sottilissimo ed elevata sensibilità numerica.',
    matrix: [
      [1, 0.95, 0.9],
      [0.95, 1, 0.95],
      [0.9, 0.95, 1],
    ],
  },
]
