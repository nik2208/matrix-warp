import { useEffect, useRef, useState } from 'react'
import type {
  IterativeMethodId,
  LinearSystemSolution,
  Metrics,
  Mode,
} from '../types/math'
import { formatNum } from '../lib/mathEngine'

interface LinearSystemPanelProps {
  mode: Mode
  matrix: number[][]
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

export default function LinearSystemPanel({
  mode,
  matrix,
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
  const chartRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setBDrafts(b.map((v) => formatNum(v, 3)))
  }, [b])

  const handleBCoord = (idx: number, raw: string) => {
    const next = bDrafts.map((d, i) => (i === idx ? raw : d))
    setBDrafts(next)
    const parsed = parseFloat(raw)
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      onBChange(b.map((val, i) => (i === idx ? parsed : val)))
    } else if (raw.trim() === '') {
      onBChange(b.map((val, i) => (i === idx ? 0 : val)))
    }
  }

  // Draw Log10 Residual Convergence Chart
  useEffect(() => {
    const canvas = chartRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth || 320
    const h = canvas.clientHeight || 135
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#050811'
    ctx.fillRect(0, 0, w, h)

    const padL = 34
    const padR = 12
    const padT = 12
    const padB = 20
    const plotW = w - padL - padR
    const plotH = h - padT - padB

    const maxK = 25
    const minLog = -8
    const maxLog = 2

    const toX = (k: number) => padL + (k / maxK) * plotW
    const toY = (res: number) => {
      const lg = Math.max(minLog, Math.min(maxLog, Math.log10(Math.max(res, 1e-10))))
      return padT + ((maxLog - lg) / (maxLog - minLog)) * plotH
    }

    // Horizontal grid lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)'
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)'
    ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, monospace'
    for (const exp of [2, 0, -2, -4, -6, -8]) {
      const y = padT + ((maxLog - exp) / (maxLog - minLog)) * plotH
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(w - padR, y)
      ctx.stroke()
      ctx.fillText(`1e${exp}`, 3, y + 3)
    }

    // Current step vertical marker
    const curX = toX(iterStep)
    ctx.save()
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)'
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(curX, padT)
    ctx.lineTo(curX, h - padB)
    ctx.stroke()
    ctx.restore()

    // Plot each enabled method's residual curve
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

      // Highlight dot at current step k
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

  return (
    <div className="space-y-4">
      {/* 1. Target Vector b & Exact Solution x* */}
      <div className="rounded-xl bg-slate-900/90 border border-amber-500/30 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              Linear System Solver A x = b
            </span>
            <p className="text-[10px] text-slate-400">
              Direct (LU / Cramer / SVD) & Iterative (Jacobi / GS / SOR / CG)
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

      {/* 2. Row Picture (Hyperplanes) & Direct Methods (Cramer + PA=LU) */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">
            Row Hyperplanes & Direct Solvers
          </span>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            {mode === '2d' ? 'Intersecting Lines' : 'Intersecting 3D Planes'}
          </span>
        </div>

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
              <div key={idx} className="flex items-center justify-between text-[11px] font-mono">
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
