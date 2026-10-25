# Matrix Warp — Interactive Linear Operator, Spectral & Ax = b Studio 🧮✨

[![Live Demo - GitHub Pages](https://img.shields.io/badge/Live_Demo-GitHub_Pages-0ea5e9?style=for-the-badge&logo=github)](https://nik2208.github.io/matrix-warp/)
[![SemVer v1.1.0](https://img.shields.io/badge/SemVer-v1.1.0-f59e0b.svg)](CHANGELOG.md)
[![Deploy to GitHub Pages](https://github.com/nik2208/matrix-warp/actions/workflows/deploy.yml/badge.svg)](https://github.com/nik2208/matrix-warp/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React + Three.js](https://img.shields.io/badge/React_18-Three.js_WebGL-61dafb.svg?logo=react)](https://threejs.org/)

> **🌐 Live Application (EN / IT):** **[https://nik2208.github.io/matrix-warp/](https://nik2208.github.io/matrix-warp/)**
> - 🇬🇧 [Open in English (`?lang=en`)](https://nik2208.github.io/matrix-warp/?lang=en)
> - 🇮🇹 [Apri in Italiano (`?lang=it`)](https://nik2208.github.io/matrix-warp/?lang=it)

---

## 🇬🇧 English Overview

**Matrix Warp** is an interactive, zero-backend **2D (`2×2`) and 3D (`3×3`) Linear Algebra, Spectral Analysis, Minkowski Lₚ Norm, and `Ax = b` Numerical Solver Studio** built with **React**, **TypeScript**, **Three.js**, and **Tailwind CSS**.

### 🎯 Core Features

#### 1. Geometric Operator & Determinant (2D & 3D)
- **2D Canvas & 3D WebGL Scene**: Switch seamlessly between `2×2` planar transformations and `3×3` spatial transformations with interactive camera presets (`Iso 3D`, `XY`, `XZ`, `YZ`, and `Auto-Orbit`).
- **Explicit Determinant Visualization**:
  - **2D**: Reference unit square `[0,1]²` (`Area = 1`) overlaid with the transformed parallelogram (`Area = |det(A)|`) and an orientation arc from `Ae₁ → Ae₂` highlighting orientation preservation (`det(A) > 0`), reflection (`det(A) < 0`), or singular collapse (`det(A) = 0`).
  - **3D**: Reference unit cube `[0,1]³` (`Vol = 1`) vs transformed 3D parallelepiped (`Vol = |det(A)|`) spanned by columns `Ae₁, Ae₂, Ae₃`.
- **Direct Manipulation**: Drag the test vector `v`, target vector `b`, or matrix column handles `Ae₁, Ae₂` directly on the 2D canvas.
- **Continuous Homotopy & Power Iteration**:
  - **Continuous Morph**: Animate `M(t) = (1 − t)I + tA` for `t ∈ [0, 1]` to watch space deform continuously from the identity to `A`.
  - **Discrete Power Orbit**: Step through `vₖ = Aᵏv` (with optional unit normalization `‖vₖ‖ = 1`) to observe convergence toward the dominant eigenvector.

#### 2. Continuous Minkowski Lₚ Norm Explorer (`p ∈ [1, ∞]`)
- **Interactive `p`-Slider**: Sweep continuously from `L₁` (Manhattan diamond/octahedron) through `L₂` (Euclidean circle/sphere) up to `L∞` (Chebyshev square/cube).
- **Vector & Induced Matrix Norms**:
  - Real-time computation of `‖v‖ₚ`, `‖Av‖ₚ`, magnification ratio `‖Av‖ₚ / ‖v‖ₚ`, and right-hand side norm `‖b‖ₚ`.
  - **Induced Matrix Norm** `‖A‖ₚ = max_{‖x‖ₚ = 1} ‖Ax‖ₚ`, inverse norm `‖A⁻¹‖ₚ`, and **Generalized Condition Number** `κₚ(A) = ‖A‖ₚ · ‖A⁻¹‖ₚ`.
- **2D & 3D Lₚ Ball Rendering**: Renders both the unit Lₚ-ball `{x : ‖x‖ₚ = 1}` and its transformed image `{Ax : ‖x‖ₚ = 1}`, highlighting the maximizer vector `x_max` where `‖A x_max‖ₚ = ‖A‖ₚ`.

#### 3. Spectral Analysis, Argand Plane & Matrix Decompositions
- **Eigenvalues & Eigenvectors**:
  - Exact analytical formulas in 2D and cubic/SVD solver in 3D.
  - Draws invariant eigenspace lines/axes, unit eigenvectors `eᵢ`, scaled vectors `λᵢ eᵢ`, and the **Spectral Radius circle** `|λ| = ρ(A) = maxᵢ |λᵢ|`.
- **Complex Argand Plane & Gershgorin Discs**:
  - Plots `λᵢ ∈ ℂ` against the unit stability circle `|λ| = 1`, spectral radius `|λ| = ρ(A)`, and **Gershgorin circles** `D(aᵢᵢ, Rᵢ)` where `Rᵢ = ∑_{j ≠ i} |aᵢⱼ|`.
- **Characteristic Polynomial & Structural Diagnostics**:
  - Displays `p(λ) = det(λI − A)`, rank, nullity, trace, and structural badges (*Symmetric*, *Positive Definite SPD*, *Diagonally Dominant*, *Tridiagonal*, *Orthogonal*, *Normal*, *Idempotent*, *Involutory*).
- **Full Matrix Decompositions**:
  - **SVD (`A = U Σ Vᵀ`)**: Singular values `σᵢ`, principal stretching axes `σᵢ uᵢ`, and condition number `κ₂(A) = σ_max / σ_min`.
  - **`PA = LU`**: Partial-pivoting LU factorization with permutation matrix `P`, unit lower-triangular `L`, and upper-triangular `U`.
  - **Cholesky (`A = L Lᵀ` & `A = L_D D L_Dᵀ`)**: Lower-triangular Cholesky factor and root-free diagonal factorization.
  - **`A = QR`**: Gram-Schmidt orthogonal-triangular factorization.

#### 4. Linear System `Ax = b` Studio (Direct & Iterative Solvers)
- **Coupled Structural Diagnostics**:
  - **Positive Definiteness (SPD) + Conditioning `κ₂(A)`**: Pairs Sylvester's leading principal minors (`Δ₁, Δ₂, Δ₃ > 0`) and `A = Aᵀ` check with `κ₂(A)`, indicating Cholesky applicability and Conjugate Gradient convergence.
  - **Diagonal Dominance + Spectral Radius `ρ(A), ρ(G)`**: Pairs row-by-row diagonal dominance margins (`|aᵢᵢ| > ∑_{j ≠ i} |aᵢⱼ|`) with `ρ(A)` and the iteration matrix spectral radii `ρ(G_Jacobi)` and `ρ(G_GS)`.
- **Row Picture & Column Picture**:
  - **Row Picture**: 2D intersecting lines and **3D translucent intersecting planes** (`aᵢ₁x + aᵢ₂y + aᵢ₃z = bᵢ`) meeting at `x*`.
  - **Column Picture**: Tip-to-tail linear combination of columns `x₁(Ae₁) + x₂(Ae₂) (+ x₃ Ae₃) = b`.
- **Direct Solvers (Gauss & Evolutions)**:
  - **Gaussian Elimination & Pivoting**: Step-by-step augmented reduction `[A⁽ᵏ⁾ | b⁽ᵏ⁾]` comparing **Naive Gauss (`A = LU`)**, **Partial Pivoting (`PA = LU`)**, and **Complete Pivoting (`P_c A Q_c = L_c U_c`)** with forward (`Ly = Pb`) and backward (`Ux = y`) substitutions.
  - **Cholesky Factorization (`A = L Lᵀ`)**: Forward `Ly = b` and backward `Lᵀx = y` solver for SPD matrices.
  - **Thomas Algorithm (TDMA)**: Exact `O(n)` Tridiagonal Matrix Algorithm showing bands `(aᵢ, dᵢ, cᵢ)` and forward sweep `(c'ᵢ, d'ᵢ)`.
  - **Cramer's Rule & Pseudoinverse**: Explicit determinants `det(Aᵢ) / det(A)` and Moore-Penrose pseudoinverse `x⁺ = A⁺b` fallback for singular systems.
- **Iterative Solvers & Trajectories**:
  - Simultaneous simulation of **Jacobi**, **Gauss-Seidel**, **SOR (Successive Over-Relaxation)** with adjustable `ω ∈ (0.2, 1.95)`, and **Conjugate Gradient (CG / Krylov CGNR)**, with 2D/3D trajectories `x⁽⁰⁾ → x⁽¹⁾ → … → x⁽ᵏ⁾` and live `log₁₀ ‖Ax⁽ᵏ⁾ − b‖₂` convergence chart.

---

## 🇮🇹 Panoramica in Italiano

**Matrix Warp** è uno studio interattivo client-side in **2D (`2×2`) e 3D (`3×3`) per Algebra Lineare, Analisi Spettrale, Norme Lₚ di Minkowski e Risoluzione Numerica di Sistemi `Ax = b`**, sviluppato con **React**, **TypeScript**, **Three.js** e **Tailwind CSS**.

### 🎯 Funzionalità Principali

1. **Operatore Geometrico e Determinante (2D e 3D)**:
   - Confronto diretto tra quadrato/cubo unitario di riferimento (`Area/Vol = 1`) e parallelogramma/parallelepipedo trasformato (`Area/Vol = |det(A)|`), con arco di orientamento `Ae₁ → Ae₂`, omotopia continua `M(t) = (1 − t)I + tA` e metodo delle potenze `vₖ = Aᵏv`.
2. **Esploratore Continuo della Norma Lₚ di Minkowski (`p ∈ [1, ∞]`)**:
   - Slider continuo da `L₁` (diamante/ottaedro Manhattan) a `L₂` (cerchio/sfera euclidea) fino a `L∞` (quadrato/cubo del massimo), con calcolo di `‖v‖ₚ`, `‖Av‖ₚ`, norma matriciale indotta `‖A‖ₚ`, condizionamento `κₚ(A)` e disegno 2D/3D della palla unitaria Lₚ e della sua immagine deformata.
3. **Analisi Spettrale, Piano di Argand e Decomposizioni**:
   - Autovalori e autovettori reali/complessi, vettori scalati `λᵢ eᵢ`, raggio spettrale `ρ(A)`, dischi di Gershgorin `D(aᵢᵢ, Rᵢ)` sul piano complesso e decomposizioni **`SVD`**, **`PA = LU`**, **`Cholesky LLᵀ`** e **`A = QR`**.
4. **Sistema Lineare `Ax = b`: Metodi Diretti e Iterativi**:
   - **Diagnostica Accoppiata**: *Definitezza Positiva (SPD + minori di Sylvester `Δₖ`) con Condizionamento `κ₂(A)`* e *Dominanza Diagonale per righe/colonne con Raggio Spettrale `ρ(A), ρ(G)`*.
   - **Metodi Diretti**: Eliminazione di Gauss passo-passo `[A⁽ᵏ⁾ | b⁽ᵏ⁾]` (*Naive `LU`*, *Pivoting Parziale `PA = LU`*, *Pivoting Totale `PAQ = LU`*), **Fattorizzazione di Cholesky (`LLᵀ` e `LDLᵀ`)**, **Algoritmo di Thomas (TDMA)** per matrici tridiagonali, **Regola di Cramer** e pseudoinversa SVD `A⁺b`.
   - **Metodi Iterativi**: **Jacobi**, **Gauss-Seidel**, **SOR** (con fattore di rilassamento `ω`) e **Gradiente Coniugato (CG)** con traiettorie 2D/3D e grafico di convergenza del residuo.

---

## 🛠️ Tech Stack & Architecture

```text
matrix-warp/
├── .github/workflows/
│   ├── deploy.yml              # Automatic GitHub Pages deployment on push to main
│   └── opencode.yml            # Autonomous AI development workflow
├── public/
│   ├── favicon.svg             # Vector app icon
│   ├── og-preview.svg          # Open Graph 1200x630 social preview card
│   ├── robots.txt              # SEO & GEO AI crawler rules
│   ├── sitemap.xml             # XML sitemap for search engines
│   ├── llms.txt                # GEO concise summary for LLMs
│   └── llms-full.txt           # GEO complete mathematical specification
├── src/
│   ├── components/
│   │   ├── ArgandWidget.tsx        # Complex plane, unit circle, ρ(A) & Gershgorin discs
│   │   ├── Canvas2D.tsx            # Interactive 2D canvas (grid, det, SVD, Lp, rows, iter paths)
│   │   ├── Canvas3D.tsx            # Interactive 3D Three.js scene (parallelepiped, planes, Lp ball)
│   │   ├── ControlsTime.tsx        # Homotopy M(t) & Power Iteration A^k v controls
│   │   ├── LinearSystemPanel.tsx   # Ax=b direct (Gauss/Cholesky/Thomas/Cramer) & iterative solvers
│   │   ├── MatrixInput.tsx         # 2x2 / 3x3 matrix editor & quick actions
│   │   ├── MetricsPanel.tsx        # Spectral metrics, diagnostics & SVD/LU/Cholesky/QR tabs
│   │   ├── NormControlPanel.tsx    # Continuous Lp norm slider (p in [1, inf])
│   │   ├── Sidebar.tsx             # Tabbed navigation & EN/IT language switcher
│   │   └── VectorInput.tsx         # Test vector v editor
│   ├── lib/
│   │   ├── i18n.tsx                # English / Italian localization context & URL/storage sync
│   │   ├── linearSolver.ts         # Gauss, Pivoting, Cholesky, Thomas, Cramer, Jacobi, GS, SOR, CG
│   │   ├── mathEngine.ts           # Determinants, Eigen, SVD, LU, Cholesky, QR, Gershgorin, Lp
│   │   └── presets.ts              # Canonical 2D & 3D operator presets (EN & IT)
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

Contributions, bug reports, and feature requests are welcome! Please review our community & agentic governance documents:
- [Changelog & Semantic Versioning (`CHANGELOG.md`)](CHANGELOG.md)
- [Autonomous Agentic Context (`AGENTS.md`)](AGENTS.md)
- [Contributing Guide / Guida alla Contribuzione (`CONTRIBUTING.md`)](CONTRIBUTING.md)
- [Code of Conduct (`CODE_OF_CONDUCT.md`)](CODE_OF_CONDUCT.md)
- [Security Policy / Politica di Sicurezza (`SECURITY.md`)](SECURITY.md)

---

## 📄 License

Distributed under the [MIT License](LICENSE).
