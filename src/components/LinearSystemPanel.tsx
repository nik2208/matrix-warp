import { useEffect, useRef, useState } from 'react'
import type {
  IterativeMethodId,
  LinearSystemSolution,
  Metrics,
  Mode,
} from '../types/math'
import { cloneMatrix, formatNum, multiplyMatrices, transposeMatrix } from '../lib/mathEngine'

interface LinearSystemPanelProps {
  mode: Mode
  matrix: number[][]
  onMatrixChange?: (m: number[][]) => void
  b: number[]
  onBChange: (b: number[]) => void
  solution: LinearSystemSolution
  metrics: Metrics
  iterStep: number
  onIterStepChange: (k: number) => void
  iterPlaying: boolean
  onIterPlayingChange: (playing: boolean) => void
  sorOmega: number
  onSorOmegaChange: (w: number) => void
  enabledMethods: Record<IterativeMethodId, boolean>
  onToggleMethod: (id: IterativeMethodId) => void
  showRowPlanes: boolean
  onToggleRowPlanes: () => void
  showColPicture: boolean
  onToggleColPicture: () => void
  showIterativePaths: boolean
  onToggleIterativePaths: () => void
  onSetTestVector: (v: number[]) => void
}

const AXES = ['x', 'y', 'z']
const PLANE_COLORS = ['text-cyan-300', 'text-amber-300', 'text-fuchsia-300']

function MiniMatrixBox({ title, mat }: { title: string; mat: number[][] }) {
  return (
    <div className="rounded bg-slate-950/90 border border-slate-800/80 p-1.5 space-y-1">
      <div className="text-[10px] font-mono font-semibold text-slate-400 text-center">
        {title}
      </div>
      <div className="space-y-0.5 font-mono text-[10px] text-slate-200">
        {mat.map((row, r) => (
          <div key={r} className="flex justify-center gap-1.5">
            {row.map((v, c) => (
              <span key={c} className="w-10 text-right">
                {formatNum(v, 2)}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LinearSystemPanel({
  mode,
  matrix,
  onMatrixChange,
  b,
  onBChange,
  solution,
  metrics,
  iterStep,
  onIterStepChange,
  iterPlaying,
  onIterPlayingChange,
  sorOmega,
  onSorOmegaChange,
  enabledMethods,
  onToggleMethod,
  showRowPlanes,
  onToggleRowPlanes,
  showColPicture,
  onToggleColPicture,
  showIterativePaths,
  onToggleIterativePaths,
  onSetTestVector,
}: LinearSystemPanelProps) {
  const n = mode === '2d' ? 2 : 3
  const [bDrafts, setBDrafts] = useState<string[]>(() => b.map((v) => formatNum(v, 3)))
  const [directTab, setDirectTab] = useState<'gauss' | 'cholesky' | 'thomas' | 'cramer'>('gauss')
  const [pivotingMode, setPivotingMode] = useState<'partial' | 'naive' | 'complete'>('partial')
  const chartRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setBDrafts(b.map((v) => formatNum(v, 3)))
  }, [b])

  const handleBCoord = (idx: number, raw: string) => {
    const nextDrafts = [...bDrafts]
    nextDrafts[idx] = raw
    setBDrafts(nextDrafts)
    const parsed = parseFloat(raw)
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      const next = [...b]
      next[idx] = parsed
      onBChange(next)
    }
  }

  const handleMakeSPD = () => {
    if (!onMatrixChange) return
    const at = transposeMatrix(matrix)
    const ata = multiplyMatrices(at, matrix)
    // Add small regularization if singular so it is strictly SPD
    for (let i = 0; i < ata.length; i++) {
      if (ata[i][i] < 0.2) ata[i][i] += 1
    }
    onMatrixChange(ata)
  }

  const handleMakeTridiagonal = () => {
    if (!onMatrixChange || matrix.length !== 3) return
    const next = cloneMatrix(matrix)
    next[0][2] = 0
    next[2][0] = 0
    onMatrixChange(next)
  }

  // Draw Residual Convergence Chart
  useEffect(() => {
    const canvas = chartRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = 280
    const h = 130
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.fillStyle = '#070b14'
    ctx.fillRect(0, 0, w, h)

    const padL = 34
    const padR = 10
    const padT = 12
    const padB = 20
    const plotW = w - padL - padR
    const plotH = h - padT - padB

    const minLog = -8
    const maxLog = 2
    const maxK = 25

    const toX = (k: number) => padL + (k / maxK) * plotW
    const toY = (res: number) => {
      const logVal = Math.log10(Math.max(1e-10, res))
      const clamped = Math.max(minLog, Math.min(maxLog, logVal))
      return padT + ((maxLog - clamped) / (maxLog - minLog)) * plotH
    }

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)'
    ctx.lineWidth = 1
    ctx.font = '9px JetBrains Mono, monospace'
    ctx.fillStyle = 'rgba(148, 163, 184, 0.65)'

    for (const lg of [2, 0, -2, -4, -6, -8]) {
      const y = padT + ((maxLog - lg) / (maxLog - minLog)) * plotH
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(w - padR, y)
      ctx.stroke()
      ctx.fillText(`10^${lg}`, 2, y + 3)
    }

    const curX = toX(iterStep)
    ctx.save()
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.35)'
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(curX, padT)
    ctx.lineTo(curX, h - padB)
    ctx.stroke()
    ctx.restore()

    const methods = Object.values(solution.iterative)
    for (const m of methods) {
      if (!enabledMethods[m.id]) continue
      ctx.save()
      ctx.strokeStyle = m.color
      ctx.lineWidth = 1.8
      ctx.beginPath()
      m.residuals.forEach((res, k) => {
        const x = toX(k)
        const y = toY(res)
        if (k === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      const curRes = m.residuals[Math.min(iterStep, m.residuals.length - 1)] ?? 0
      const cx = toX(Math.min(iterStep, m.residuals.length - 1))
      const cy = toY(curRes)
      ctx.beginPath()
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2)
      ctx.fillStyle = m.color
      ctx.fill()
      ctx.restore()
    }

    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)'
    ctx.fillText('k=0', padL, h - 5)
    ctx.fillText(`k=${iterStep}`, Math.min(w - 40, Math.max(padL + 24, curX - 10)), h - 5)
    ctx.fillText(`k=${maxK}`, w - 30, h - 5)
  }, [solution, enabledMethods, iterStep])

  const formatRowEquation = (row: number[], rhs: number) => {
    const parts: string[] = []
    row.forEach((coeff, idx) => {
      if (Math.abs(coeff) < 1e-9) return
      const sign = coeff >= 0 ? (parts.length === 0 ? '' : ' + ') : parts.length === 0 ? '−' : ' − '
      const absC = Math.abs(coeff)
      const cStr = Math.abs(absC - 1) < 1e-9 ? '' : formatNum(absC, 2)
      parts.push(`${sign}${cStr}${AXES[idx]}`)
    })
    const lhs = parts.length > 0 ? parts.join('') : '0'
    return `${lhs} = ${formatNum(rhs, 2)}`
  }

  const pd = metrics.posDefinite
  const dd = metrics.diagDominance

  return (
    <div className="space-y-4">
      {/* 0. DIAGNOSTICS: POSITIVE DEFINITENESS + CONDITIONING & DIAGONAL DOMINANCE + SPECTRAL RADIUS */}
      <div className="rounded-xl bg-slate-900/95 border border-teal-500/30 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-300">
            Solver Conditions: SPD, κ(A), Diag Dominance & ρ
          </span>
        </div>

        {/* Box A: Positive Definiteness + Condition Number */}
        <div className="rounded-lg bg-slate-950/85 border border-slate-800 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-200">
              1. Definita Positiva (SPD) & Condizionamento
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                pd.isSPD
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : pd.isPositiveDefiniteQuadratic
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
              }`}
            >
              {pd.isSPD
                ? '✓ SPD (A=Aᵀ, xᵀAx > 0)'
                : pd.isPositiveDefiniteQuadratic
                  ? 'xᵀAx > 0 (Non-Sym)'
                  : '✗ Non Definita Positiva'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-0.5">
            <div className="bg-slate-900/80 rounded px-2 py-1 border border-slate-800/80">
              <div className="text-[10px] text-slate-400">Sylvester Minors Δ_k</div>
              <div className="text-slate-200">
                {pd.leadingMinors.map((m, i) => `Δ_${i + 1}=${formatNum(m, 2)}`).join(', ')}
              </div>
            </div>
            <div className="bg-slate-900/80 rounded px-2 py-1 border border-slate-800/80">
              <div className="text-[10px] text-slate-400">Condition No. κ₂(A)</div>
              <div
                className={`font-bold ${
                  metrics.singular
                    ? 'text-rose-400'
                    : metrics.cond > 50
                      ? 'text-amber-400'
                      : 'text-emerald-300'
                }`}
              >
                κ₂ = {formatNum(metrics.cond, 3)} ({metrics.stability})
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
            <span>
              {pd.isSPD
                ? '→ Cholesky LLᵀ applicabile; CG converge in ≤ n passi.'
                : `→ Cholesky LLᵀ non applicabile (${pd.isSymmetric ? 'minori Δ_k ≤ 0' : 'A ≠ Aᵀ'}).`}
            </span>
          </div>
        </div>

        {/* Box B: Diagonal Dominance + Spectral Radius rho(A) & rho(G) */}
        <div className="rounded-lg bg-slate-950/85 border border-slate-800 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-200">
              2. Dominanza Diagonale & Raggio Spettrale
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                dd.isStrictRow || dd.isStrictCol
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : dd.isWeakRow
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
              }`}
            >
              {dd.isStrictRow
                ? '✓ Stretta (Righe)'
                : dd.isStrictCol
                  ? '✓ Stretta (Colonne)'
                  : dd.isWeakRow
                    ? '~ Debole (|a_ii| ≥ R_i)'
                    : '✗ Non Diag. Dominante'}
            </span>
          </div>

          {/* Row-by-row |a_ii| vs sum |a_ij| */}
          <div className="space-y-1 text-[10px] font-mono">
            {dd.rows.map((r) => (
              <div
                key={r.row}
                className="flex items-center justify-between bg-slate-900/70 px-2 py-0.5 rounded border border-slate-800/70"
              >
                <span className="text-slate-400">
                  Riga {r.row}: |a_{r.row}{r.row}| = {formatNum(r.diagAbs, 2)} vs ∑|a_{r.row}j| ={' '}
                  {formatNum(r.offDiagSum, 2)}
                </span>
                <span className={r.isStrict ? 'text-emerald-300' : 'text-rose-300'}>
                  {r.isStrict ? '✓ >' : '✗ ≤'} (Δ={formatNum(r.margin, 2)})
                </span>
              </div>
            ))}
          </div>

          {/* Spectral Radius rho(A) + Iteration Spectral Radii rho(G) */}
          <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono pt-0.5">
            <div className="bg-slate-900/80 rounded px-2 py-1 border border-slate-800/80">
              <div className="text-slate-400">ρ(A) = max|λ|</div>
              <div className="text-teal-300 font-bold">
                {formatNum(metrics.spectralRadius, 3)}
              </div>
            </div>
            <div className="bg-slate-900/80 rounded px-2 py-1 border border-slate-800/80">
              <div className="text-slate-400">ρ(G_Jacobi)</div>
              <div
                className={`font-bold ${
                  solution.iterative.jacobi.converges ? 'text-emerald-300' : 'text-rose-400'
                }`}
              >
                {formatNum(solution.iterative.jacobi.spectralRadiusG, 3)}
              </div>
            </div>
            <div className="bg-slate-900/80 rounded px-2 py-1 border border-slate-800/80">
              <div className="text-slate-400">ρ(G_GaussSeidel)</div>
              <div
                className={`font-bold ${
                  solution.iterative['gauss-seidel'].converges
                    ? 'text-emerald-300'
                    : 'text-rose-400'
                }`}
              >
                {formatNum(solution.iterative['gauss-seidel'].spectralRadiusG, 3)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Target Vector b & Exact Solution x* */}
      <div className="rounded-xl bg-slate-900/90 border border-amber-500/30 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              Linear System A x = b
            </span>
            <p className="text-[10px] text-slate-400">
              Set RHS vector b and inspect Direct & Iterative solutions
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSetTestVector(solution.xExact)}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold transition"
            title="Set test vector v to the solution x* so Av = b"
          >
            Set v = x*
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Editable RHS Vector b */}
          <div className="rounded-lg bg-slate-950/80 border border-amber-500/30 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-amber-300">Target Vector b</span>
              <span className="font-mono text-[10px] text-slate-500">RHS</span>
            </div>
            {b.map((_, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-slate-400 w-4">b_{idx + 1}</span>
                <input
                  type="number"
                  step="0.2"
                  value={bDrafts[idx] ?? '0'}
                  onChange={(e) => handleBCoord(idx, e.target.value)}
                  onBlur={() => setBDrafts(b.map((v) => formatNum(v, 3)))}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded px-2 py-1 text-xs font-mono text-slate-100 outline-none"
                />
              </div>
            ))}
          </div>

          {/* Computed Solution x* */}
          <div className="rounded-lg bg-slate-950/80 border border-emerald-500/30 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-emerald-300">
                {solution.isExact ? 'Exact Solution x*' : 'Least-Squares x⁺'}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {metrics.singular ? 'A⁺b' : 'A⁻¹b'}
              </span>
            </div>
            {solution.xExact.map((val, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-slate-400 w-4">{AXES[idx]}*</span>
                <div className="w-full bg-slate-900/70 border border-slate-800 rounded px-2 py-1 text-xs font-mono font-semibold text-emerald-300">
                  {formatNum(val, 4)}
                </div>
              </div>
            ))}
            <div className="text-[10px] font-mono text-slate-400 pt-0.5">
              ‖Ax* − b‖₂ = {formatNum(solution.residualNorm, 4)}
            </div>
          </div>
        </div>

        {/* Visual Toggles for Row Picture (Planes/Lines) and Column Picture */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            type="button"
            aria-pressed={showRowPlanes}
            onClick={onToggleRowPlanes}
            className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition ${
              showRowPlanes
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            {mode === '2d' ? '◉ Row Lines' : '◉ Row Planes'}
          </button>
          <button
            type="button"
            aria-pressed={showColPicture}
            onClick={onToggleColPicture}
            className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition ${
              showColPicture
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            ◉ Col Picture
          </button>
          <button
            type="button"
            aria-pressed={showIterativePaths}
            onClick={onToggleIterativePaths}
            className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition ${
              showIterativePaths
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            ◉ Iter Paths
          </button>
        </div>
      </div>

      {/* 2. DIRECT SOLVERS STUDIO: GAUSS & EVOLUTIONS (LU, PIVOTING, CHOLESKY, THOMAS, CRAMER) */}
      <div className="rounded-xl bg-slate-900/85 border border-slate-800 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-100">
              Direct Methods: Gauss & Factorizations
            </span>
            <p className="text-[10px] text-slate-400">
              Gauss Elimination, Partial/Complete Pivoting, Cholesky LLᵀ, Thomas TDMA & Cramer
            </p>
          </div>
        </div>

        {/* Direct Method Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-semibold">
          {(
            [
              ['gauss', 'Gauss / LU'],
              ['cholesky', 'Cholesky'],
              ['thomas', 'Thomas'],
              ['cramer', 'Cramer/Rows'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setDirectTab(id)}
              className={`py-1.5 rounded transition ${
                directTab === id
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* TAB 1: GAUSSIAN ELIMINATION & PIVOTING (NAIVE LU vs PARTIAL PA=LU vs COMPLETE PAQ=LU) */}
        {directTab === 'gauss' && (
          <div className="space-y-2.5">
            {/* Pivoting Strategy Sub-Selector */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800/80 text-[10px]">
              <button
                type="button"
                onClick={() => setPivotingMode('partial')}
                className={`py-1 rounded font-mono transition ${
                  pivotingMode === 'partial'
                    ? 'bg-slate-800 text-sky-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Partial (PA=LU)
              </button>
              <button
                type="button"
                onClick={() => setPivotingMode('naive')}
                className={`py-1 rounded font-mono transition ${
                  pivotingMode === 'naive'
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Naive (A=LU)
              </button>
              <button
                type="button"
                onClick={() => setPivotingMode('complete')}
                className={`py-1 rounded font-mono transition ${
                  pivotingMode === 'complete'
                    ? 'bg-slate-800 text-purple-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Complete (PAQ=LU)
              </button>
            </div>

            {pivotingMode === 'partial' && (
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-slate-400 flex justify-between">
                  <span>Gaussian Elimination with Partial Pivoting</span>
                  <span className="text-sky-300">{metrics.lu.swaps} row swap(s)</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <MiniMatrixBox title="P (Row Perm)" mat={metrics.lu.P} />
                  <MiniMatrixBox title="L (Multipliers)" mat={metrics.lu.L} />
                  <MiniMatrixBox title="U (Echelon)" mat={metrics.lu.U} />
                </div>

                {/* Forward & Back substitution vectors */}
                <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-2 space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">1. Forward (Ly = Pb):</span>
                    <span className="text-amber-300">
                      y = ({solution.gauss.forwardY.map((v) => formatNum(v, 3)).join(', ')})
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">2. Backward (Ux = y):</span>
                    <span className="text-emerald-300 font-semibold">
                      x = ({solution.gauss.backwardX.map((v) => formatNum(v, 4)).join(', ')})
                    </span>
                  </div>
                </div>

                {/* Step-by-step Augmented Matrix [A^(k) | b^(k)] */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-mono text-slate-400">
                    Step-by-step Augmented Reduction [A⁽ᵏ⁾ | b⁽ᵏ⁾]:
                  </div>
                  {solution.gauss.steps.map((st) => (
                    <div
                      key={st.stepIndex}
                      className="rounded bg-slate-950/75 border border-slate-800/80 p-2 space-y-1"
                    >
                      <div className="text-[10px] font-mono text-sky-300">{st.description}</div>
                      <div className="space-y-0.5 font-mono text-[10px] text-slate-200">
                        {st.matrixA.map((row, r) => (
                          <div key={r} className="flex items-center justify-center gap-2">
                            {row.map((val, c) => (
                              <span key={c} className="w-11 text-right">
                                {formatNum(val, 2)}
                              </span>
                            ))}
                            <span className="text-slate-600">|</span>
                            <span className="w-12 text-right text-amber-300">
                              {formatNum(st.vectorB[r] ?? 0, 2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pivotingMode === 'naive' && (
              <div className="space-y-2">
                {metrics.lu.naiveBreakdown || !metrics.lu.naiveL || !metrics.lu.naiveU ? (
                  <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-2.5 text-xs text-rose-200 space-y-1">
                    <div className="font-semibold">
                      ✗ Breakdown: Pivot nullo (a_kk⁽ᵏ⁾ = 0)
                    </div>
                    <p className="text-[11px] text-rose-300/90">
                      L'eliminazione di Gauss naive senza pivoting fallisce perché incontra uno zero
                      sulla diagonale. È necessario il Pivoting Parziale (PA = LU).
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-[10px] font-mono text-slate-400">
                      Naive Factorization A = L U (nessuno scambio di righe):
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <MiniMatrixBox title="L_naive (Unit Lower)" mat={metrics.lu.naiveL} />
                      <MiniMatrixBox title="U_naive (Upper)" mat={metrics.lu.naiveU} />
                    </div>
                    {solution.gauss.naiveY && solution.gauss.naiveX && (
                      <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-2 space-y-1 text-[11px] font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">1. Forward (Ly = b):</span>
                          <span className="text-amber-300">
                            y = ({solution.gauss.naiveY.map((v) => formatNum(v, 3)).join(', ')})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">2. Backward (Ux = y):</span>
                          <span className="text-emerald-300 font-semibold">
                            x = ({solution.gauss.naiveX.map((v) => formatNum(v, 4)).join(', ')})
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {pivotingMode === 'complete' && (
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-slate-400">
                  Complete Pivoting P_c A Q_c = L_c U_c (scambio righe e colonne):
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <MiniMatrixBox title="P_c (Row Perm)" mat={metrics.lu.Pc} />
                  <MiniMatrixBox title="Q_c (Col Perm)" mat={metrics.lu.Qc} />
                  <MiniMatrixBox title="L_c (Lower)" mat={metrics.lu.Lc} />
                  <MiniMatrixBox title="U_c (Upper)" mat={metrics.lu.Uc} />
                </div>
                <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-2 text-[11px] font-mono flex justify-between">
                  <span className="text-slate-400">Solution x = Q_c z_c:</span>
                  <span className="text-emerald-300 font-semibold">
                    x = ({solution.gauss.completeX.map((v) => formatNum(v, 4)).join(', ')})
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CHOLESKY FACTORIZATION (A = L L^T & LDL^T) */}
        {directTab === 'cholesky' && (
          <div className="space-y-2.5">
            {metrics.cholesky.isSPD && metrics.cholesky.L ? (
              <>
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-emerald-300 font-semibold">
                    ✓ Matrice SPD: A = L Lᵀ attiva (costo ~ n³/6)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MiniMatrixBox title="L (Cholesky Factor)" mat={metrics.cholesky.L} />
                  <MiniMatrixBox
                    title="Lᵀ (Transpose)"
                    mat={transposeMatrix(metrics.cholesky.L)}
                  />
                </div>
                {metrics.cholesky.LD && metrics.cholesky.D && (
                  <div className="rounded bg-slate-950/70 border border-slate-800/80 p-2 text-[10px] font-mono text-slate-300">
                    Root-Free LDLᵀ Diagonal D = diag(
                    {metrics.cholesky.D.map((d) => formatNum(d, 3)).join(', ')})
                  </div>
                )}
                {solution.choleskySolve.forwardY && solution.choleskySolve.backwardX && (
                  <div className="rounded-lg bg-slate-950/80 border border-emerald-500/30 p-2 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">1. Forward (Ly = b):</span>
                      <span className="text-amber-300">
                        y = ({solution.choleskySolve.forwardY.map((v) => formatNum(v, 3)).join(', ')})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">2. Backward (Lᵀx = y):</span>
                      <span className="text-emerald-300 font-semibold">
                        x = ({solution.choleskySolve.backwardX.map((v) => formatNum(v, 4)).join(', ')})
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg bg-amber-950/30 border border-amber-500/30 p-3 space-y-2">
                <div className="text-xs font-semibold text-amber-300">
                  Cholesky A = L Lᵀ richiede una matrice Simmetrica Definita Positiva (SPD)
                </div>
                <p className="text-[11px] text-slate-300">{metrics.cholesky.reason}</p>
                {metrics.cholesky.LD && metrics.cholesky.D && (
                  <div className="text-[10px] font-mono text-sky-300 bg-slate-950/70 p-2 rounded border border-slate-800">
                    Variante simmetrica indefinita A = L_D D L_Dᵀ disponibile: D = diag(
                    {metrics.cholesky.D.map((d) => formatNum(d, 2)).join(', ')})
                  </div>
                )}
                {onMatrixChange && (
                  <button
                    type="button"
                    onClick={handleMakeSPD}
                    className="w-full py-1.5 px-3 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/40 text-xs font-semibold transition"
                  >
                    ⚡ Trasforma in SPD (A ← AᵀA) per testare Cholesky
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: THOMAS ALGORITHM (TDMA FOR TRIDIAGONAL SYSTEMS) */}
        {directTab === 'thomas' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span
                className={
                  solution.thomas.isTridiagonal ? 'text-emerald-300 font-semibold' : 'text-amber-300'
                }
              >
                {solution.thomas.isTridiagonal
                  ? '✓ Matrice Tridiagonale: Algoritmo di Thomas O(n) esatto'
                  : '⚠ Elementi fuori-tridiagonale non nulli (a₁₃ o a₃₁ ≠ 0)'}
              </span>
            </div>

            {!solution.thomas.isTridiagonal && mode === '3d' && onMatrixChange && (
              <button
                type="button"
                onClick={handleMakeTridiagonal}
                className="w-full py-1.5 px-3 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/40 text-xs font-semibold transition"
              >
                ⚡ Azzera a₁₃ = a₃₁ = 0 (Rendi Tridiagonale 3×3)
              </button>
            )}

            {/* 3 Diagonals (a_i, d_i, c_i) & Modified Sweep Coefficients (c'_i, d'_i) */}
            <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-2.5 space-y-1.5 text-[10px] font-mono">
              <div className="text-slate-400 font-semibold">
                1. Bande Tridiagonali (a_i x_&#123;i-1&#125; + d_i x_i + c_i x_&#123;i+1&#125; = b_i):
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-slate-200">
                <div className="bg-slate-900 px-2 py-1 rounded">
                  <div className="text-slate-500">Sub a_i</div>
                  <div>({solution.thomas.subDiagA.map((v) => formatNum(v, 2)).join(', ')})</div>
                </div>
                <div className="bg-slate-900 px-2 py-1 rounded">
                  <div className="text-slate-500">Diag d_i</div>
                  <div>({solution.thomas.mainDiagD.map((v) => formatNum(v, 2)).join(', ')})</div>
                </div>
                <div className="bg-slate-900 px-2 py-1 rounded">
                  <div className="text-slate-500">Super c_i</div>
                  <div>({solution.thomas.superDiagC.map((v) => formatNum(v, 2)).join(', ')})</div>
                </div>
              </div>

              <div className="text-slate-400 font-semibold pt-1">
                2. Forward Sweep di Thomas (c'_i, d'_i) & Back-Substitution:
              </div>
              <div className="flex justify-between text-amber-300">
                <span>c' = ({solution.thomas.cPrime.map((v) => formatNum(v, 3)).join(', ')})</span>
                <span>d' = ({solution.thomas.dPrime.map((v) => formatNum(v, 3)).join(', ')})</span>
              </div>
              <div className="flex justify-between text-emerald-300 font-semibold pt-0.5 text-[11px]">
                <span>Thomas Solution x_TDMA:</span>
                <span>({solution.thomas.xThomas.map((v) => formatNum(v, 4)).join(', ')})</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CRAMER'S RULE & ROW HYPERPLANES */}
        {directTab === 'cramer' && (
          <div className="space-y-2.5">
            {/* Row Equations */}
            <div className="space-y-1">
              {matrix.map((row, r) => (
                <div
                  key={r}
                  className="flex items-center justify-between text-xs font-mono bg-slate-950/70 px-2.5 py-1.5 rounded border border-slate-800/80"
                >
                  <span className={PLANE_COLORS[r]}>
                    {mode === '2d' ? `Line L${r + 1}:` : `Plane Π${r + 1}:`}
                  </span>
                  <span className="text-slate-200">{formatRowEquation(row, b[r] ?? 0)}</span>
                </div>
              ))}
            </div>

            {/* Cramer's Rule Determinants */}
            <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300">Cramer's Rule (Area/Vol Ratios)</span>
                <span className="font-mono text-slate-400">x_i = det(A_i) / det(A)</span>
              </div>
              <div className="grid grid-cols-1 gap-1 pt-1">
                {solution.cramerDets.map((dAi, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-[11px] font-mono"
                  >
                    <span className="text-slate-400">
                      det(A_{idx + 1}) = {formatNum(dAi, 3)}
                    </span>
                    <span className="text-emerald-300">
                      {AXES[idx]}* = {formatNum(dAi, 2)} / {formatNum(metrics.det, 2)} ={' '}
                      {metrics.singular ? 'Singular' : formatNum(dAi / metrics.det, 4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Iterative Methods Studio (Jacobi, Gauss-Seidel, SOR, CG) */}
      <div className="rounded-xl bg-slate-900/85 border border-slate-800 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-200">
              Iterative Solvers Convergence Studio
            </span>
            <p className="text-[10px] text-slate-400">
              Step k = {iterStep} / 25 from initial guess x⁽⁰⁾ = (0, 0{n === 3 ? ', 0' : ''})
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (!iterPlaying && iterStep >= 25) onIterStepChange(0)
                onIterPlayingChange(!iterPlaying)
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition"
            >
              {iterPlaying ? '⏸ Pause' : '▶ Animate'}
            </button>
            <button
              type="button"
              onClick={() => {
                onIterPlayingChange(false)
                onIterStepChange(0)
              }}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
            >
              k=0
            </button>
          </div>
        </div>

        {/* Iteration Step k Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-300">
            <span>Iteration Step k</span>
            <span className="text-amber-300 font-bold">k = {iterStep}</span>
          </div>
          <input
            type="range"
            min="0"
            max="25"
            step="1"
            value={iterStep}
            onChange={(e) => {
              onIterPlayingChange(false)
              onIterStepChange(parseInt(e.target.value, 10))
            }}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* SOR Relaxation Parameter omega */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-300">
            <span>SOR Relaxation Factor ω ∈ (0, 2)</span>
            <span className="text-amber-300">ω = {formatNum(sorOmega, 2)}</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.95"
            step="0.05"
            value={sorOmega}
            onChange={(e) => onSorOmegaChange(parseFloat(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Method Cards with Toggle, Spectral Radius rho(G), and Current Iterate x^(k) */}
        <div className="space-y-1.5">
          {Object.values(solution.iterative).map((trace) => {
            const active = enabledMethods[trace.id]
            const idx = Math.min(iterStep, trace.points.length - 1)
            const xk = trace.points[idx] ?? []
            const rk = trace.residuals[idx] ?? 0
            return (
              <div
                key={trace.id}
                className={`rounded-lg border p-2 transition ${
                  active
                    ? 'bg-slate-950/80 border-slate-700/90'
                    : 'bg-slate-950/30 border-slate-800/50 opacity-55'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => onToggleMethod(trace.id)}
                      className="rounded"
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: trace.color }}
                    />
                    <span className="text-slate-100">{trace.name}</span>
                  </label>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      trace.converges
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-rose-500/15 text-rose-300'
                    }`}
                  >
                    {trace.id === 'cg'
                      ? 'Krylov Optimal'
                      : `ρ(G)=${formatNum(trace.spectralRadiusG, 2)}`}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-300">
                  <span>
                    x^({idx}) = ({xk.map((c) => formatNum(c, 2)).join(', ')})
                  </span>
                  <span className="text-slate-400">‖r‖₂ = {formatNum(rk, 3)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Residual Convergence Chart */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] font-mono text-slate-400 flex justify-between">
            <span>Residual Convergence log₁₀ ‖Ax⁽ᵏ⁾ − b‖₂</span>
            <span>Step k ∈ [0, 25]</span>
          </div>
          <canvas
            ref={chartRef}
            className="w-full h-32 rounded-lg border border-slate-800/90 block"
          />
        </div>
      </div>
    </div>
  )
}
