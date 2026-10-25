import type { Metrics } from '../types/math'
import { isRealComplex } from '../lib/numerics'

export default function MetricsPanel({ metrics }: { metrics: Metrics }) {
  const fmt = (x: number | null) => {
    if (x === null || x === undefined) return '—'
    if (!isFinite(x)) return '∞'
    return x.toFixed(6)
  }
  const fmtC = (z: { re: number; im: number }) => {
    if (isRealComplex(z)) return z.re.toFixed(6)
    const re = z.re >= 0 ? z.re.toFixed(6) : z.re.toFixed(6)
    const im = z.im >= 0 ? `+${z.im.toFixed(6)}i` : `${z.im.toFixed(6)}i`
    return `${re}${im}`
  }
  return (
    <div className="space-y-1 text-xs">
      <div className="font-semibold text-sm">Metrics</div>
      <div>det: {fmt(metrics.det)}</div>
      <div>trace: {fmt(metrics.trace)}</div>
      <div>rank: {metrics.rank ?? '—'}</div>
      <div>||A||_F (Frobenius): {fmt(metrics.normFrobenius)}</div>
      <div>||A||_2 (spectral, σ_max): {fmt(metrics.normSpectral)}</div>
      <div>κ(A)=σ_max/σ_min: {metrics.cond === Infinity ? '∞' : fmt(metrics.cond)}</div>
      {metrics.singular && <div className="text-red-400">Singular / dimensional collapse</div>}
      <div className="font-semibold mt-1">Eigenvalues</div>
      {metrics.eigenvalues.length === 0 ? (
        <div>—</div>
      ) : (
        metrics.eigenvalues.map((e, i) => (
          <div key={i}>λ{i + 1}: {fmtC(e)}</div>
        ))
      )}
      <div className="font-semibold mt-1">Singular values</div>
      {metrics.singularValues.length === 0 ? (
        <div>—</div>
      ) : (
        metrics.singularValues.map((s, i) => (
          <div key={i}>σ{i + 1}: {s.toFixed(6)}</div>
        ))
      )}
    </div>
  )
}
