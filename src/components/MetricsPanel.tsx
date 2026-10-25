import type { Metrics, Mode } from '../types/math'
import { formatComplex, formatNum } from '../lib/mathEngine'

interface MetricsPanelProps {
  metrics: Metrics
  mode: Mode
  onSelectVector?: (vec: number[]) => void
}

export default function MetricsPanel({ metrics, mode, onSelectVector }: MetricsPanelProps) {
  const dim = mode === '2d' ? 2 : 3
  const maxSigma = Math.max(...metrics.singularValues, 1e-6)

  const stabilityStyles = {
    optimal: {
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      label: 'Well-Conditioned',
      dot: 'bg-emerald-400',
    },
    moderate: {
      badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      label: 'Moderately Conditioned',
      dot: 'bg-sky-400',
    },
    'ill-conditioned': {
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      label: 'Ill-Conditioned (High κ)',
      dot: 'bg-amber-400',
    },
    singular: {
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      label: 'Singular (Rank Deficient)',
      dot: 'bg-rose-400',
    },
  }[metrics.stability]

  return (
    <div className="space-y-4">
      {/* Geometric Status & Stability Banner */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Operator Diagnostics
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${stabilityStyles.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${stabilityStyles.dot}`} />
            {stabilityStyles.label}
          </span>
        </div>
        <div className="text-xs font-medium text-slate-200 flex items-center justify-between">
          <span>{metrics.collapseDescription}</span>
          {metrics.orientationFlipped && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Orientation Flip
            </span>
          )}
        </div>
      </div>

      {/* 6 Core Scalar Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Determinant</span>
            <span className="font-mono text-slate-500">det(A)</span>
          </div>
          <div className="mt-1 text-base font-mono font-bold text-slate-100">
            {formatNum(metrics.det, 4)}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">
            {mode === '2d' ? 'Area' : 'Volume'} ×{formatNum(Math.abs(metrics.det), 3)}
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Condition No.</span>
            <span className="font-mono text-slate-500">κ₂(A)</span>
          </div>
          <div
            className={`mt-1 text-base font-mono font-bold ${
              metrics.singular
                ? 'text-rose-400'
                : metrics.cond > 50
                  ? 'text-amber-400'
                  : 'text-emerald-400'
            }`}
          >
            {formatNum(metrics.cond, 3)}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">σ_max / σ_min</div>
        </div>

        <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Trace</span>
            <span className="font-mono text-slate-500">tr(A)</span>
          </div>
          <div className="mt-1 text-base font-mono font-bold text-slate-100">
            {formatNum(metrics.trace, 4)}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">∑ a_ii = ∑ λ_i</div>
        </div>

        <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Rank & Nullity</span>
            <span className="font-mono text-slate-500">rk(A)</span>
          </div>
          <div className="mt-1 text-base font-mono font-bold text-slate-100">
            {metrics.rank} <span className="text-xs font-normal text-slate-400">/ {dim}</span>
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">
            Nullity dim(ker A) = {metrics.nullity}
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Spectral Norm</span>
            <span className="font-mono text-slate-500">‖A‖₂</span>
          </div>
          <div className="mt-1 text-base font-mono font-bold text-purple-300">
            {formatNum(metrics.normSpectral, 4)}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">Max stretch σ₁</div>
        </div>

        <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Frobenius Norm</span>
            <span className="font-mono text-slate-500">‖A‖_F</span>
          </div>
          <div className="mt-1 text-base font-mono font-bold text-sky-300">
            {formatNum(metrics.normFrobenius, 4)}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">√(∑ σ_i²)</div>
        </div>
      </div>

      {/* SVD Decomposition Breakdown */}
      <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">
            Singular Value Decomposition (SVD)
          </span>
          <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
            A v_i = σ_i u_i
          </span>
        </div>

        <div className="space-y-2">
          {metrics.singularValues.map((sigma, idx) => {
            const pct = Math.min(100, Math.max(2, (sigma / maxSigma) * 100))
            const u = metrics.svd.uVectors[idx]
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-purple-300 font-semibold">
                    σ_{idx + 1} = {formatNum(sigma, 4)}
                  </span>
                  {u && (
                    <span className="text-[11px] text-slate-400">
                      u_{idx + 1} = ({u.map((c) => formatNum(c, 2)).join(', ')})
                    </span>
                  )}
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-400 rounded-full transition-all duration-150"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Eigenvalues & Eigenvectors Breakdown */}
      <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">
            Eigenvalues & Eigenvectors
          </span>
          <span className="text-[10px] font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
            A e_i = λ_i e_i
          </span>
        </div>

        <div className="space-y-2">
          {metrics.eigenPairs.map((pair, idx) => (
            <div
              key={idx}
              className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-2.5 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-teal-300">
                  λ_{idx + 1} = {formatComplex(pair.value, 4)}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    pair.isReal
                      ? 'bg-teal-500/15 text-teal-300'
                      : 'bg-indigo-500/20 text-indigo-300'
                  }`}
                >
                  {pair.isReal
                    ? 'Real Invariant Axis'
                    : `Complex (|λ|=${formatNum(pair.modulus, 2)}, θ=${formatNum(pair.angleDeg, 1)}°)`}
                </span>
              </div>

              {pair.isReal && pair.vector ? (
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="text-[11px] font-mono text-slate-300">
                    e_{idx + 1} = ({pair.vector.map((x) => formatNum(x, 3)).join(', ')})
                  </span>
                  {onSelectVector && (
                    <button
                      type="button"
                      onClick={() => onSelectVector(pair.vector!)}
                      className="text-[10px] font-medium px-2 py-0.5 rounded bg-teal-500/15 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 transition shrink-0"
                      title="Set test vector v to this eigenvector"
                    >
                      Set v = e_{idx + 1}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic">
                  {pair.isReal
                    ? 'Defective eigenvalue (geometric multiplicity < algebraic multiplicity)'
                    : 'No real spatial eigenvector line (rotational/spiral mode)'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
