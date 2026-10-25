import { useEffect, useRef } from 'react'
import type { Metrics } from '../types/math'
import { formatComplex, formatNum } from '../lib/mathEngine'
import { useI18n } from '../lib/i18n'

interface ArgandWidgetProps {
  metrics: Metrics
}

export default function ArgandWidget({ metrics }: ArgandWidgetProps) {
  const { tr } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth || 320
    const h = canvas.clientHeight || 200
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#050811'
    ctx.fillRect(0, 0, w, h)

    let maxExtent = Math.max(1.25, metrics.spectralRadius * 1.2)
    for (const g of metrics.gershgorin) {
      maxExtent = Math.max(maxExtent, Math.abs(g.center) + g.radius + 0.3)
    }
    const cx = w / 2
    const cy = h / 2
    const scale = (Math.min(w, h) * 0.41) / maxExtent

    const toPt = (re: number, im: number): [number, number] => [cx + re * scale, cy - im * scale]

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, cy)
    ctx.lineTo(w, cy)
    ctx.moveTo(cx, 0)
    ctx.lineTo(cx, h)
    ctx.stroke()

    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)'
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.fillText('Re(λ)', w - 34, cy - 5)
    ctx.fillText('Im(λ)', cx + 5, 12)

    const discColors = [
      'rgba(56, 189, 248, 0.12)',
      'rgba(168, 85, 247, 0.12)',
      'rgba(245, 158, 11, 0.12)',
    ]
    const discBorders = [
      'rgba(56, 189, 248, 0.45)',
      'rgba(168, 85, 247, 0.45)',
      'rgba(245, 158, 11, 0.45)',
    ]
    metrics.gershgorin.forEach((g, idx) => {
      const [gx, gy] = toPt(g.center, 0)
      const rPx = Math.max(2, g.radius * scale)
      ctx.save()
      ctx.beginPath()
      ctx.arc(gx, gy, rPx, 0, Math.PI * 2)
      ctx.fillStyle = discColors[idx % 3]
      ctx.fill()
      ctx.strokeStyle = discBorders[idx % 3]
      ctx.setLineDash([3, 3])
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.restore()
    })

    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, 1 * scale, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1.2
    ctx.stroke()
    ctx.restore()

    if (metrics.spectralRadius > 1e-4) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, metrics.spectralRadius * scale, 0, Math.PI * 2)
      ctx.strokeStyle = '#2dd4bf'
      ctx.lineWidth = 1.6
      ctx.stroke()
      ctx.restore()
    }

    metrics.eigenPairs.forEach((pair, idx) => {
      const [px, py] = toPt(pair.value.re, pair.value.im)
      ctx.save()
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.5)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(px, py)
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(px, py, 5, 0, Math.PI * 2)
      ctx.fillStyle = pair.isReal ? '#2dd4bf' : '#f43f5e'
      ctx.fill()
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.fillStyle = '#e2e8f0'
      ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace'
      ctx.fillText(`λ${idx + 1}`, px + 7, py - 5)
      ctx.restore()
    })
  }, [metrics])

  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800/90 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-200">
            {tr('Complex Spectrum & Gershgorin Discs', 'Spettro Complesso & Dischi di Gershgorin')}
          </span>
          <p className="text-[10px] text-slate-400">
            {tr(
              'Argand plane: eigenvalues λ_i, unit circle |λ|=1, spectral radius ρ(A)',
              'Piano di Argand: autovalori λ_i, cerchio unitario |λ|=1, raggio spettrale ρ(A)'
            )}
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-teal-300 bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 rounded-lg">
          ρ(A) = {formatNum(metrics.spectralRadius, 3)}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-44 rounded-lg border border-slate-800/80 block"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
        <span>p(λ): {metrics.characteristicPoly}</span>
        <span
          className={
            metrics.spectralRadius < 1
              ? 'text-emerald-400'
              : metrics.spectralRadius > 1
                ? 'text-rose-400'
                : 'text-amber-300'
          }
        >
          {metrics.spectralRadius < 1
            ? tr('Aᵏ → 0 (Contractive)', 'Aᵏ → 0 (Contrattiva)')
            : metrics.spectralRadius > 1
              ? tr('Aᵏ Diverges (Expansive)', 'Aᵏ Diverge (Espansiva)')
              : tr('ρ(A) = 1 (Marginal)', 'ρ(A) = 1 (Marginale)')}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-1 pt-1">
        {metrics.eigenPairs.map((p, i) => (
          <div
            key={i}
            className="flex items-center justify-between text-[11px] font-mono bg-slate-950/60 px-2 py-1 rounded border border-slate-800/60"
          >
            <span className="text-teal-300">
              λ_{i + 1} = {formatComplex(p.value, 3)}
            </span>
            <span className="text-slate-400">
              |λ_{i + 1}| = {formatNum(p.modulus, 3)} • arg = {formatNum(p.angleDeg, 1)}°
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
