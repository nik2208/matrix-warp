# Contributing Guide / Guida alla Contribuzione

## 🇬🇧 English

Thank you for your interest in contributing to **Matrix Warp**!

### Development Workflow
1. Fork and clone the repository:
   ```bash
   git clone https://github.com/nik2208/matrix-warp.git
   cd matrix-warp
   npm ci
   npm run dev
   ```
2. Verify TypeScript types and production build before opening a Pull Request:
   ```bash
   npm run typecheck
   npm run build
   ```

### Autonomous Development with OpenCode
This repository also supports autonomous AI development via **OpenCode**:
1. Open an Issue describing the bug or feature.
2. Add the `autonomous` label or comment `/oc <instructions>`.
3. OpenCode generates a plan (`issue_plans/`), implements the code, verifies the build, and opens a Pull Request.

### Commit Conventions
We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

---

## 🇮🇹 Italiano

Grazie per il tuo interesse nel contribuire a **Matrix Warp**!

### Flusso di Sviluppo Locale
1. Effettua il fork e clona il repository:
   ```bash
   git clone https://github.com/nik2208/matrix-warp.git
   cd matrix-warp
   npm ci
   npm run dev
   ```
2. Verifica i tipi TypeScript e la build di produzione prima di aprire una Pull Request:
   ```bash
   npm run typecheck
   npm run build
   ```

### Sviluppo Autonomo con OpenCode
Questo repository supporta anche il ciclo di sviluppo autonomo tramite **OpenCode**:
1. Apri una Issue descrivendo il bug o la funzionalità.
2. Assegna la label `autonomous` oppure commenta con `/oc <istruzioni>`.
3. OpenCode genera il piano di lavoro (`issue_plans/`), sviluppa il codice, verifica la build e apre una Pull Request.
