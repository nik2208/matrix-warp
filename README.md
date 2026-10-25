# Matrix Warp — Interactive Linear Operator, Spectral & $Ax=b$ Studio 🧮✨

[![Live Demo - GitHub Pages](https://img.shields.io/badge/Live_Demo-GitHub_Pages-0ea5e9?style=for-the-badge&logo=github)](https://nik2208.github.io/matrix-warp/)
[![Deploy to GitHub Pages](https://github.com/nik2208/matrix-warp/actions/workflows/deploy.yml/badge.svg)](https://github.com/nik2208/matrix-warp/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React + Three.js](https://img.shields.io/badge/React_18-Three.js_WebGL-61dafb.svg?logo=react)](https://threejs.org/)

> **🌐 Live Application:** **[https://nik2208.github.io/matrix-warp/](https://nik2208.github.io/matrix-warp/)**

**Matrix Warp** is an interactive, zero-backend 2D (`2×2`) and 3D (`3×3`) Linear Algebra, Spectral Analysis, Minkowski $L_p$ Norm, and $Ax = b$ Numerical Solver visualizer built with **React**, **TypeScript**, **Three.js**, and **Tailwind CSS**.

It is designed for students, engineers, and researchers to geometrically see every fundamental property of a matrix $A$ in real time.

---

## 🎯 Core Features

### 1. Geometric Operator & Determinant ($2\text{D} \text{ & } 3\text{D}$)
- **2D Canvas & 3D WebGL Scene**: Switch seamlessly between $2\times 2$ planar transformations and $3\times 3$ spatial transformations with interactive camera presets (`Iso 3D`, `XY`, `XZ`, `YZ`, and `Auto-Orbit`).
- **Explicit Determinant Visualization**:
  - **2D**: Reference unit square $[0,1]^2$ ($\text{Area} = 1$) overlaid with the transformed parallelogram ($\text{Area} = |\det(A)|$) and an orientation arc from $Ae_1 \to Ae_2$ highlighting orientation preservation ($\det(A) > 0$), reflection ($\det(A) < 0$), or singular collapse ($\det(A) = 0$).
  - **3D**: Reference unit cube $[0,1]^3$ ($\text{Vol} = 1$) vs transformed 3D parallelepiped ($\text{Vol} = |\det(A)|$) spanned by columns $Ae_1, Ae_2, Ae_3$.
- **Direct Manipulation**: Drag the test vector $v$, target vector $b$, or matrix column handles $Ae_1, Ae_2$ directly on the 2D canvas.
- **Continuous Homotopy & Power Iteration**:
  - **Continuous Morph**: Animate $M(t) = (1-t)I + tA$ for $t \in [0, 1]$ to watch space deform continuously from the identity to $A$.
  - **Discrete Power Orbit**: Step through $v_k = A^k v$ (with optional unit normalization) to observe convergence toward the dominant eigenvector.

### 2. Continuous Minkowski $L_p$ Norm Explorer ($p \in [1, \infty]$)
- **Interactive $p$-Slider**: Sweep continuously from $L_1$ (Manhattan diamond/octahedron) through $L_2$ (Euclidean circle/sphere) up to $L_\infty$ (Chebyshev square/cube).
- **Vector & Induced Matrix Norms**:
  - Real-time computation of $\|v\|_p$, $\|Av\|_p$, magnification ratio $\|Av\|_p / \|v\|_p$, and right-hand side norm $\|b\|_p$.
  - **Induced Matrix Norm** $\|A\|_p = \max_{\|x\|_p = 1} \|Ax\|_p$, inverse norm $\|A^{-1}\|_p$, and **Generalized Condition Number** $\kappa_p(A) = \|A\|_p \|A^{-1}\|_p$.
- **2D & 3D $L_p$ Ball Rendering**: Renders both the unit $L_p$-ball $\{x : \|x\|_p = 1\}$ and its transformed image $\{Ax : \|x\|_p = 1\}$, highlighting the maximizer vector $x_{\max}$ where $\|Ax_{\max}\|_p = \|A\|_p$.

### 3. Spectral Analysis, Argand Plane & Matrix Decompositions
- **Eigenvalues & Eigenvectors**:
  - Exact analytical formulas in 2D and QR shifts + inverse iteration in 3D.
  - Draws invariant eigenspace lines/axes, unit eigenvectors $e_i$, scaled vectors $\lambda_i e_i$, and the **Spectral Radius circle** $|\lambda| = \rho(A) = \max_i |\lambda_i|$.
- **Complex Argand Plane & Gershgorin Discs**:
  - Plots $\lambda_i \in \mathbb{C}$ against the unit stability circle $|\lambda| = 1$, spectral radius $|\lambda| = \rho(A)$, and **Gershgorin circles** $D(a_{ii}, R_i)$ where $R_i = \sum_{j \neq i} |a_{ij}|$.
- **Characteristic Polynomial & Structural Classification**:
  - Displays $p(\lambda) = \det(\lambda I - A)$, rank, nullity, trace, and automatic structural badges (*Symmetric*, *Orthogonal*, *Normal*, *Positive Definite SPD*, *Diagonally Dominant*, *Idempotent*, *Involutory*).
- **Full Matrix Decompositions**:
  - **SVD ($A = U \Sigma V^T$)**: Singular values $\sigma_i$, principal stretching axes $\sigma_i u_i$, and condition number $\kappa_2(A) = \sigma_{\max}/\sigma_{\min}$.
  - **$PA = LU$**: Partial-pivoting LU factorization with permutation matrix $P$, unit lower-triangular $L$, and upper-triangular $U$.
  - **$A = QR$**: Gram-Schmidt orthogonal-triangular factorization.

### 4. Linear System $Ax = b$ Studio (Direct & Iterative Solvers)
- **Row Picture (Intersecting Lines & 3D Planes)**:
  - In **2D**, draws the row lines $a_{i1}x + a_{i2}y = b_i$ intersecting at the solution $x^*$.
  - In **3D**, renders the **3 translucent row planes** $a_{i1}x + a_{i2}y + a_{i3}z = b_i$ in 3D space and highlights their intersection point $x^*$.
- **Column Picture**:
  - Renders the tip-to-tail linear combination of the columns $x_1(Ae_1) + x_2(Ae_2) (+ x_3 Ae_3) = b$.
- **Direct Solvers (Gauss & Factorizations)**:
  - **Gaussian Elimination & Pivoting**: Step-by-step augmented matrix reduction $[A^{(k)} | b^{(k)}]$ comparing **Naive Gauss ($A=LU$)**, **Partial Pivoting ($PA=LU$)**, and **Complete Pivoting ($P_c A Q_c = L_c U_c$)** with forward ($Ly = Pb$) and backward ($Ux = y$) substitutions.
  - **Cholesky Factorization ($A = L L^T$ & $A = L_D D L_D^T$)**: Explicit Sylvester leading principal minors ($\Delta_1, \Delta_2, \Delta_3$) and SPD verification paired with condition number $\kappa_2(A)$.
  - **Thomas Algorithm (TDMA)**: Exact $O(n)$ Tridiagonal Matrix Algorithm displaying bands $(a_i, d_i, c_i)$, forward sweep coefficients $(c'_i, d'_i)$, and back-substitution.
  - **Cramer's Rule & Pseudoinverse**: Explicit determinants $\det(A_i)$, ratios $x_i = \det(A_i)/\det(A)$, and Moore-Penrose pseudoinverse $x^+ = A^+ b$ fallback for singular systems.
- **Iterative Solvers & Trajectories**:
  - Explicit **Diagonal Dominance** row-by-row check ($|a_{ii}| > \sum_{j \neq i} |a_{ij}|$) paired with **Spectral Radius** $\rho(A)$ and iteration matrix spectral radii $\rho(G_{\text{Jacobi}}), \rho(G_{\text{GS}}), \rho(G_{\text{SOR}})$.
  - Simultaneous simulation of **Jacobi**, **Gauss-Seidel**, **SOR (Successive Over-Relaxation)** with adjustable $\omega \in (0.2, 1.95)$, and **Conjugate Gradient (CG / Krylov CGNR)**.
  - Animates the step-by-step trajectories $x^{(0)} \to x^{(1)} \to \dots \to x^{(k)}$ directly on the **2D Canvas** and in **3D WebGL space**, paired with a live $\log_{10} \|Ax^{(k)} - b\|_2$ residual convergence chart.

---

## 🛠️ Tech Stack & Architecture

- **Frontend Framework**: React 18 + TypeScript 5.6 + Vite 5
- **2D Rendering**: High-DPI HTML5 Canvas (`requestAnimationFrame`)
- **3D Rendering**: Three.js WebGL (`OrbitControls`, custom vector arrows, translucent row planes, $L_p$ mesh projection)
- **Styling**: Tailwind CSS
- **Mathematical Engine**: Custom zero-dependency numerical linear algebra engine (`src/lib/mathEngine.ts` & `src/lib/linearSolver.ts`)

```text
matrix-warp/
├── .github/workflows/
│   ├── deploy.yml              # Automatic GitHub Pages deployment on push to main
│   └── opencode.yml            # Autonomous AI development workflow
├── src/
│   ├── components/
│   │   ├── ArgandWidget.tsx        # Complex plane, unit circle, ρ(A) & Gershgorin discs
│   │   ├── Canvas2D.tsx            # Interactive 2D canvas (grid, det, SVD, Lp, rows, iter paths)
│   │   ├── Canvas3D.tsx            # Interactive 3D Three.js scene (parallelepiped, planes, Lp ball)
│   │   ├── ControlsTime.tsx        # Homotopy M(t) & Power Iteration A^k v controls
│   │   ├── LinearSystemPanel.tsx   # Ax=b direct & iterative solvers + convergence chart
│   │   ├── MatrixInput.tsx         # 2x2 / 3x3 matrix editor & quick actions
│   │   ├── MetricsPanel.tsx        # Spectral metrics, properties & SVD/LU/QR decompositions
│   │   ├── NormControlPanel.tsx    # Continuous Lp norm slider (p in [1, inf])
│   │   ├── Sidebar.tsx             # Tabbed navigation sidebar
│   │   └── VectorInput.tsx         # Test vector v editor
│   ├── lib/
│   │   ├── linearSolver.ts         # Cramer, LU, Pseudoinverse, Jacobi, Gauss-Seidel, SOR, CG
│   │   ├── mathEngine.ts           # Determinants, Eigen, SVD, LU, QR, Gershgorin, Lp norms
│   │   └── presets.ts              # Canonical 2D & 3D operator presets
│   ├── types/
│   │   └── math.ts                 # TypeScript interfaces
│   └── App.tsx                     # Root application state & HUD layer toggles
└── README.md
```

---

## 🚀 Local Development

```bash
# Install dependencies
npm ci

# Start local development server with HMR
npm run dev

# Run TypeScript type-checking
npm run typecheck

# Build production bundle (output in dist/)
npm run build

# Preview production build locally
npm run preview
```

---

## 🤝 Contributing & Community Standards

Contributions, bug reports, and feature requests are welcome! Please review our community documents:
- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)

---

## 📄 License

Distributed under the [MIT License](LICENSE).
