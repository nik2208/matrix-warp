# Matrix Warp — Project Guidelines for OpenCode Agents

1. **Stack & Build**:
   - Vite + React 18 + TypeScript 5.6 + Three.js + Tailwind CSS.
   - Always verify changes with `npm run build` (`tsc && vite build`). Fix all unused variables/imports (`noUnusedLocals: true`, `noUnusedParameters: true`).
2. **Bilingual UI (`EN | IT`)**:
   - Use `const { tr } = useI18n()` from `src/lib/i18n.tsx` in every UI component: `tr('English string', 'Stringa italiana')`. Never mix English and Italian in the same language mode.
3. **2D & 3D Parity**:
   - Maintain visual and mathematical parity between `src/components/Canvas2D.tsx` (2×2) and `src/components/Canvas3D.tsx` (3×3), wired through `src/App.tsx` and `src/components/Sidebar.tsx`.
4. **Mathematical Engine**:
   - Core invariants, decompositions (`SVD`, `LU` Naive/Partial/Complete, `Cholesky`, `QR`), Sylvester SPD, Diagonal Dominance, Gershgorin discs, and `L_p` norms live in `src/lib/mathEngine.ts`.
   - Direct (`Gauss`, `Cholesky`, `Thomas TDMA`, `Cramer`, `Pseudoinverse`) and Iterative (`Jacobi`, `Gauss-Seidel`, `SOR`, `Conjugate Gradient`) solvers live in `src/lib/linearSolver.ts`.
5. **Semantic Versioning (SemVer 2.0.0)**:
   - Bump the version before completing the task using:
     `bash scripts/bump-version.sh [patch|minor|major] "Concise description of change"`
   - This updates `package.json`, `VERSION`, `index.html`, and `CHANGELOG.md`, and updates the live `vX.Y.Z` badge shown in the web app.
6. **Workflow Security**:
   - Never modify files in `.github/` or `.github/workflows/`.
