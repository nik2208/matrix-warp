# Changelog

All notable changes to **Matrix Warp** are documented in this file.
This project adheres to [Semantic Versioning (SemVer 2.0.0)](https://semver.org/).

## [1.1.0] - 2026-10-25

### Added
- **2D & 3D Determinant Visualization**: Reference unit square/cube (`Area/Vol = 1`) compared with transformed parallelogram/parallelepiped (`|det(A)|`) and orientation arc.
- **Continuous Minkowski `L_p` Norm Explorer (`p ∈ [1, ∞]`)**: Real-time vector norms `‖v‖_p`, `‖Av‖_p`, induced matrix norm `‖A‖_p`, condition number `κ_p(A)`, and 2D/3D `L_p` unit ball rendering.
- **Complex Spectrum & Gershgorin Discs**: Interactive Argand plane with unit circle `|λ| = 1`, spectral radius `ρ(A)`, and Gershgorin circles `D(a_ii, R_i)`.
- **Direct Solvers for `Ax = b`**: Step-by-step Gaussian Elimination (`[A^(k) | b^(k)]`) with Naive `LU`, Partial Pivoting (`PA = LU`), and Complete Pivoting (`PAQ = LU`); Cholesky (`A = L L^T` & `LDL^T`) with Sylvester minors; Thomas Algorithm (`TDMA`) for tridiagonal systems; Cramer's Rule; and SVD Moore-Penrose pseudoinverse `A^+ b`.
- **Iterative Solvers for `Ax = b`**: Jacobi, Gauss-Seidel, SOR (with adjustable `ω`), and Conjugate Gradient (`CG / CGNR`) with 2D/3D trajectories, iteration matrix spectral radius `ρ(G)`, and residual convergence plot.
- **Coupled Diagnostics**: Explicit pairing of *Positive Definiteness (SPD) + Conditioning `κ_2(A)`* and *Diagonal Dominance + Spectral Radius `ρ(A), ρ(G)`*.
- **Full Bilingual `EN | IT` Support**: Instant language switcher, URL `?lang=en|it` support, and bilingual documentation.
- **SEO & GEO Suite**: `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, Open Graph preview, and JSON-LD Schema.org (`WebApplication`, `LearningResource`, `FAQPage`).
- **Semantic Versioning & Agentic Context**: Live version badge and GitHub repository links in the UI, `AGENTS.md`, `.opencode/context/PROJECT_GUIDELINES.md`, and automated SemVer bumping/tagging in the OpenCode CI workflow.

## [1.0.0] - 2026-10-25

### Added
- Initial release of the 2D (`2×2`) and 3D (`3×3`) Linear Transformation & SVD Visualizer with GitHub Pages deployment.
