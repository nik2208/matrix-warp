# AGENTS.md — Matrix Warp Agentic Context & Engineering Standards

> This file provides authoritative architectural, mathematical, UI/UX, localization, and CI/CD instructions for **OpenCode** and all autonomous coding agents working on **Matrix Warp** (`https://github.com/nik2208/matrix-warp`).

---

## 1. Project Identity & Vision

- **Name**: Matrix Warp (`matrix-warp`)
- **Live URL**: `https://nik2208.github.io/matrix-warp/`
- **Purpose**: An interactive, high-precision, zero-backend 2D (`2×2`) and 3D (`3×3`) Linear Algebra, Spectral Analysis, Minkowski `L_p` Norm, and `Ax = b` Direct/Iterative Numerical Solver Studio.
- **Tech Stack**:
  - **React 18 + TypeScript 5.6 + Vite 5** (`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`)
  - **2D Engine**: High-DPI HTML5 Canvas (`src/components/Canvas2D.tsx`, `src/components/ArgandWidget.tsx`)
  - **3D Engine**: Three.js WebGL (`src/components/Canvas3D.tsx` with `OrbitControls`, custom 3D vector arrows, translucent planes, and `L_p` sphere projection)
  - **Styling**: Tailwind CSS dark-mode scientific studio palette (`bg-slate-950`, `bg-slate-900/90`, `backdrop-blur-md`, high-contrast semantic accents)

---

## 2. Architecture & Key Files

```text
src/
├── version.ts                     # Exports APP_VERSION (injected from package.json) & GitHub URLs
├── App.tsx                        # Root state, animation loops (Morph, Power, Iterative), top HUD
├── main.tsx                       # Entry point wrapped in <I18nProvider>
├── types/
│   └── math.ts                    # All mathematical, solver, decomposition, and layer interfaces
├── lib/
│   ├── i18n.tsx                   # Bilingual EN | IT context (useI18n -> { lang, setLang, tr })
│   ├── mathEngine.ts              # Pure numerical engine: det, SVD, Eigen, LU (Naive/Partial/Complete),
│   │                              # Cholesky (LL^T & LDL^T), QR, Gershgorin, Sylvester SPD, Diag Dominance, Lp norms
│   ├── linearSolver.ts            # Direct (Gauss steps, LU, Cholesky, Thomas TDMA, Cramer, A^+b)
│   │                              # & Iterative (Jacobi, Gauss-Seidel, SOR, Conjugate Gradient) solvers
│   └── presets.ts                 # Canonical 2D & 3D operator presets (with English & Italian descriptions)
└── components/
    ├── Sidebar.tsx                # Header (vX.Y.Z badge, EN|IT toggle, 2D|3D switch), 3 tabs, footer
    ├── MatrixInput.tsx            # 2x2 / 3x3 bracketed matrix editor + A^T, A^-1, Reset I
    ├── VectorInput.tsx            # Test vector v & image Av editor
    ├── NormControlPanel.tsx       # Continuous Minkowski L_p norm slider (p in [1, infinity])
    ├── ControlsTime.tsx           # Homotopy M(t) = (1-t)I + tA & Power Iteration v_k = A^k v
    ├── LinearSystemPanel.tsx      # Coupled diagnostics (SPD+cond, DiagDom+rho), Direct & Iterative studios
    ├── MetricsPanel.tsx           # Anatomy badges, invariants, ArgandWidget, SVD/LU/Cholesky/QR tabs
    ├── ArgandWidget.tsx           # Complex plane canvas: eigenvalues, |λ|=1, ρ(A), Gershgorin discs
    ├── Canvas2D.tsx               # Interactive 2D viewport (drag v, b, Ae_1, Ae_2; pan & zoom)
    └── Canvas3D.tsx               # Interactive 3D Three.js viewport (unit cube/parallelepiped, planes, Lp ball)
```

---

## 3. Mandatory Engineering & Design Rules for Every Task

### A. 2D & 3D Feature Parity
- Whenever a mathematical concept or visual layer is added or modified, it **must** work seamlessly in both **`2d` (`2×2`)** and **`3d` (`3×3`)** modes (`Canvas2D.tsx` and `Canvas3D.tsx`).
- In `Canvas3D.tsx`, always dispose of old Three.js geometries and materials when rebuilding `dynamicGroup` to prevent WebGL memory leaks.

### B. Strict Bilingual `EN | IT` Localization (Never Mix Languages)
- **Never hardcode monolingual strings** or mix English and Italian in the same view.
- Every component must use `const { tr } = useI18n()` from `src/lib/i18n.tsx` and wrap all user-facing strings as `tr('English text', 'Testo in italiano')`.
- Any new preset in `src/lib/presets.ts` must include `name`, `nameIt`, `description`, and `descriptionIt`.

### C. Mathematical Rigor & Numerical Stability
- Handle singular (`det(A) ≈ 0`), rank-deficient, ill-conditioned, non-symmetric, and complex-eigenvalue matrices gracefully without `NaN` or `Infinity` crashes.
- Use `formatNum(val, digits)` and `formatComplex(c, digits)` from `src/lib/mathEngine.ts` for all numerical displays.
- Keep all mathematical computations pure, deterministic, and memoized via `useMemo` in `App.tsx`.

### D. Semantic Versioning (SemVer 2.0.0)
- Every completed task or issue implementation **must** increment the project version following SemVer 2.0.0 using the helper script:
  - **Patch (`X.Y.Z+1`)** for bug fixes, UI polish, refactoring, or documentation:
    `bash scripts/bump-version.sh patch "Short summary of fix"`
  - **Minor (`X.Y+1.0`)** for new features, visualizers, or mathematical tools:
    `bash scripts/bump-version.sh minor "Short summary of new feature"`
  - **Major (`X+1.0.0`)** for breaking architectural changes:
    `bash scripts/bump-version.sh major "Short summary of breaking change"`
- Running `scripts/bump-version.sh` automatically updates `package.json`, `VERSION`, `index.html` (`softwareVersion`), and `CHANGELOG.md`, and the UI (`v{APP_VERSION}`) reflects the new version automatically via `vite.config.ts`.

### E. SEO, GEO & Documentation Synchronization
- When adding major features, update:
  - `README.md` (both `🇬🇧 English Overview` and `🇮🇹 Panoramica in Italiano` — avoid raw `&` inside `$...$` math blocks so GitHub MathJax renders cleanly).
  - `public/llms.txt` and `public/llms-full.txt` so AI/Generative search engines index the new capabilities.

### F. Build & Verification Gate
- Before finishing any iteration, always run:
  ```bash
  npm run build
  ```
- Both `tsc` (`noUnusedLocals`, `noUnusedParameters`, strict types) and `vite build` **must** exit with code `0`.

### G. GitHub Actions Workflow Protection
- **NEVER** create or modify files inside `.github/` or `.github/workflows/` during autonomous runs (GitHub rejects pushes to `.github/workflows/` from `GITHUB_TOKEN`). If CI/CD templates are requested, place them in `templates/workflows/`.
