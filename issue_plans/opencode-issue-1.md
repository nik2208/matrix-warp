# Piano

## Obiettivo
Realizzare un'applicazione web single-page (zero-backend, interamente client-side) "Interactive Linear Transformation Visualizer" deployabile su GitHub Pages. L'app permetterà di inserire matrici 2x2 e 3x3, visualizzare il loro comportamento geometrico come operatori lineari e calcolare in tempo reale metriche spettrali e di condizionamento.

## Task

1. **Scaffolding del progetto (Vite + TypeScript + Tailwind)**
   - **File coinvolti:** `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `postcss.config.js`, `tailwind.config.js` (o configurazione integrata), `.gitignore` (aggiornamento se necessario)
   - **Attività:** Inizializzare progetto Vite con TypeScript, configurare Tailwind CSS, impostare `base: './'` in `vite.config.ts` per GitHub Pages, configurare build in `dist/`.

2. **Setup dipendenze math e rendering**
   - **File coinvolti:** `package.json`
   - **Attività:** Aggiungere dipendenze locali (no CDN): `mathjs` (o `numeric`) per operazioni matriciali, eigenvalues/eigenvectors, SVD/norme/numerica; `three` e `@types/three` per 3D; `@types/node` se necessario. Verificare bundling completo.

3. **Tipi e motore matematico**
   - **File coinvolti:** `src/types/math.ts`, `src/lib/matrix.ts`, `src/lib/norms.ts`, `src/lib/eigen.ts`, `src/lib/svd.ts`, `src/lib/metrics.ts`, `src/lib/utils.ts`
   - **Attività:** Definire tipi (Matrix2x2/3x3, Vector2/3, Complex). Implementare operazioni base (mul, transpose, det, inv), norme (Frobenius, spettrale via σ_max), condizionamento κ = σ_max/σ_min con gestione σ_min≈0 (κ=∞), rango/traccia. Calcolo autovalori/autovettori (reali/complessi), SVD per ottenere assi ellisse/ellissoide. Gestire matrici singolari esplicitamente.

4. **Struttura UI e stato applicativo**
   - **File coinvolti:** `src/App.tsx` (o `src/main.ts` + componenti), `src/components/Layout.tsx`, `src/components/Sidebar.tsx`, `src/components/ModeToggle.tsx`, `src/components/MatrixInput.tsx`, `src/components/VectorInput.tsx`, `src/components/MetricsPanel.tsx`, `src/components/ControlsTime.tsx`, `src/styles/index.css`
   - **Attività:** Layout con sidebar + viewport centrale. Toggle 2D/3D. Input matrici con preset (Identity, Rotation, Scaling, Shear, Reflection, Projection, Singular, Ill-conditioned). Input vettore test v e visualizzazione v, Av. Controlli interpolazione M(t)=(1-t)I+tA, t∈[0,1] e modalità power iteration v_k = A^k v (play/pause/reset/step). Stato reattivo che ricalcola metriche ad ogni modifica.

5. **Renderer 2D (Canvas/SVG)**
   - **File coinvolti:** `src/components/Canvas2D.tsx`, `src/render/2d/grid.ts`, `src/render/2d/circleEllipse.ts`, `src/render/2d/eigen.ts`, `src/render/2d/vector.ts`, `src/render/2d/trajectory.ts`, `src/render/2d/utils.ts`
   - **Attività:** Griglia cartesiana originale (grigia) e griglia deformata (basi e1,e2 -> Ae1,Ae2). Cerchio unitario -> ellisse con semiassi = σ1,σ2. Linee autovettoriali (span) evidenziate se invarianti (solo scaling). Vettore v (blu), Av (rosso), traiettoria/orbita A^k v. Pan/zoom responsivi. Rendering vincolato a requestAnimationFrame.

6. **Renderer 3D (Three.js)**
   - **File coinvolti:** `src/components/Canvas3D.tsx`, `src/render/3d/scene.ts`, `src/render/3d/cube.ts`, `src/render/3d/ellipsoid.ts`, `src/render/3d/vector.ts`, `src/render/3d/controls.ts`
   - **Attività:** Scena Three.js con assi X,Y,Z e OrbitControls. Cubo unitario trasformato in parallelepipedo (volume |det|). Sfera unitaria trasformata in ellissoide 3D (assi σi). Vettore test interattivo e traiettoria verso Av. Gestione cleanup su smontaggio.

7. **Integrazione, fallback numerici e robustezza**
   - **File coinvolti:** `src/lib/numerics.ts`, aggiornamenti a `src/lib/eigen.ts`, `src/components/MetricsPanel.tsx`, renderer
   - **Attività:** Gestire autovalori complessi (mostrare parte reale/immaginaria, disabilitare rendering linee direzionali puramente non-reali). Matrice singolare (det≈0): indicare collasso dimensionale, κ(A)=∞, gestire inv/SVD. Evitare NaN/Inf, normalizzazione autovettori. Performance con requestAnimationFrame.

8. **Documentazione deploy GitHub Pages e template workflow (senza toccare .github/workflows/)**
   - **File coinvolti:** `README.md` (aggiornamento completo), `templates/workflows/deploy.yml` (nuovo), eventuali note in `CONTRIBUTING.md` se utile (opzionale)
   - **Attività:** Documentare build (`npm ci && npm run build`), output `dist/`, configurazione `base: './'`, istruzioni deploy GitHub Pages (Actions > Pages, source "GitHub Actions" o "Deploy from branch" su `gh-pages`), e fornire template esempio in `templates/workflows/deploy.yml` (mai in `.github/workflows/`). Aggiornare README con overview, usage, presets, metriche, controlli.

9. **Verifica e polish finale**
   - **File coinvolti:** `package.json` (scripts), test manuale/consigliati
   - **Attività:** Aggiungere script `dev`, `build`, `preview`, `typecheck`. Verificare assenza dipendenze CDN. Testare preset, interpolazione, power iteration, casi singolari/ill-condizionati, 2D/3D.

## Acceptance Criteria

- [ ] Progetto inizializzabile con Vite+TS+Tailwind, build produce `dist/` con `base: './'` configurato.
- [ ] Toggle tra modalità 2x2 (2D) e 3x3 (3D) funzionante.
- [ ] Input matrici con tutti i preset richiesti (Identity, Rotation, Scaling, Shear, Reflection, Projection, Singular, Ill-conditioned).
- [ ] Input vettore v con visualizzazione v e T(v)=Av.
- [ ] Controlli interpolazione M(t)=(1-t)I+tA con slider t∈[0,1] e modalità power iteration v_k=A^k v (play/pause/reset/step).
- [ ] Dashboard metriche mostra: det, norme Frobenius e spettrale (σ_max), autovalori/autovettori (reali/immaginari), κ(A)=σ_max/σ_min (∞ se singolare), traccia, rango.
- [ ] Modalità 2D: griglia originale e deformata, cerchio→ellisse con semiassi σ1,σ2, linee autovettoriali evidenziate, vettore blu/rosso e traiettoria/orbita.
- [ ] Modalità 3D: assi, cubo→parallelepipedo (|det|), sfera→ellissoide con assi σi, vettore test e traiettoria, OrbitControls.
- [ ] Matrici singolari: indicazione collasso dimensionale, κ mostrato come ∞, gestione fallback senza crash.
- [ ] Autovalori complessi: visualizzati con parti reale/immaginaria; rendering linee direzionali puramente non-reali disabilitato.
- [ ] Nessuna dipendenza CDN; tutti asset/stili bundled via npm.
- [ ] Rendering ottimizzato con `requestAnimationFrame`; UI reattivo.
- [ ] `README.md` aggiornato con istruzioni build/deploy GitHub Pages (base `./`, `dist/`).
- [ ] Template workflow esempio presente in `templates/workflows/deploy.yml` (MAI in `.github/workflows/`).
- [ ] Nessun file creato/modificato in `.github/` o `.github/workflows/`.

## Verifica

**Setup e build:**
```bash
npm ci
npm run typecheck
npm run build
ls -la dist/
```
Verificare che `dist/index.html` referenzi asset con path relativo (compatibili con `./`).

**Dev locale:**
```bash
npm run dev
```
Aprire browser su URL dev; testare toggle 2D/3D, inserimento matrici, preset, slider interpolazione, power iteration.

**Casi test numerici:**
- **Identità:** det=1, κ=1, ellisse=cerchio, autovettori tutti.
- **Rotazione 90°:** det=1, autovalori complessi ±i (mostrare reale/immaginaria), cerchio invariato in forma (rotato), no linee reali evidenziate.
- **Scaling (2,0.5):** det=1, assi ellisse = 2,0.5 lungo assi.
- **Shear:** det=1, ellisse con area invariata.
- **Singolare:** det=0, κ=∞, indicazione collasso, parallelepipedo/collasso geometrico.
- **Ill-condizionata:** κ grande, indicatore stabilità visibile.

**GitHub Pages (documentazione):**
- Leggere README.md per confermare presenza sezione "Deploy to GitHub Pages" con istruzioni e riferimento a `templates/workflows/deploy.yml`.
- Verificare che `templates/workflows/deploy.yml` esista e non ci siano modifiche a `.github/workflows/`.

**Robustezza:**
- Modifiche rapide ai valori non causano crash; calcoli con `requestAnimationFrame`.
- Nessun errore console legato a CDN mancanti.
- Cleanup Three.js su cambio modalità/smontaggio.
