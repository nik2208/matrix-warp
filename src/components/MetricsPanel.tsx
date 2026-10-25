import { useState } from 'react'
import type { Metrics, Mode } from '../types/math'
import { formatComplex, formatNum } from '../lib/mathEngine'
import ArgandWidget from './ArgandWidget'

interface MetricsPanelProps {
  metrics: Metrics
  mode: Mode
  onSelectVector?: (vec: number[]) => void
}

function MiniMatrixView({ title, mat }: { title: string; mat: number[][] }) {
  return (
    <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-2 space-y-1">
      <div className="text-[10px] font-mono font-semibold text-slate-400 text-center">
        {title}
      </div>
      <div className="space-y-0.5 font-mono text-[10px] text-slate-200">
        {mat.map((row, r) => (
          <div key={r} className="flex justify-center gap-2">
            {row.map((v, c) => (
              <span key={c} className="w-11 text-right">
                {formatNum(v, 2)}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MetricsPanel({ metrics, mode, onSelectVector }: MetricsPanelProps) {
  const dim = mode === '2d' ? 2 : 3
  const maxSigma = Math.max(...metrics.singularValues, 1e-6)
  const [decompTab, setDecompTab] = useState<'svd' | 'lu' | 'qr'>('svd')

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

  const propBadges: { label: string; active: boolean; color: string }[] = [
    { label: 'Symmetric (A=Aᵀ)', active: metrics.properties.isSymmetric, color: 'text-sky-300 border-sky-500/30 bg-sky-500/10' },
    { label: 'Orthogonal (QᵀQ=I)', active: metrics.properties.isOrthogonal, color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' },
    { label: 'Positive Definite (SPD)', active: metrics.properties.isPositiveDefinite, color: 'text-teal-300 border-teal-500/30 bg-teal-500/10' },
    { label: 'Normal (AAᵀ=AᵀA)', active: metrics.properties.isNormal, color: 'text-indigo-300 border-indigo-500/30 bg-indigo-500/10' },
    { label: 'Diag Dominant', active: metrics.properties.isStrictlyDiagonallyDominant, color: 'text-amber-300 border-amber-500/30 bg-amber-500/10' },
    { label: 'Idempotent (A²=A)', active: metrics.properties.isIdempotent, color: 'text-purple-300 border-purple-500/30 bg-purple-500/10' },
    { label: 'Involutory (A²=I)', active: metrics.properties.isInvolutory, color: 'text-pink-300 border-pink-500/30 bg-pink-500/10' },
  ]

  return (
    <div className="space-y-4">
      {/* Geometric Status & Structural Classification Badges */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Matrix Anatomy & Diagnostics
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
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {propBadges
            .filter((b) => b.active)
            .map((b) => (
              <span
                key={b.label}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${b.color}`}
              >
                ✓ {b.label}
              </span>
            ))}
        </div>
      </div>

      {/* Core Invariants Grid (det, spectral radius, cond, trace, rank, norms) */}
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
            {mode === '2d' ? 'Area' : 'Volume'} ×{formatNum(Math.abs(metrics.det), 3)} (∏ λ_i)
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Spectral Radius</span>
            <span className="font-mono text-teal-400">ρ(A)</span>
          </div>
          <div className="mt-1 text-base font-mono font-bold text-teal-300">
            {formatNum(metrics.spectralRadius, 4)}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">max |λ_i| ≤ ‖A‖_p</div>
        </div>

        <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Condition No. (L₂)</span>
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
            <span>Trace & Rank</span>
            <span className="font-mono text-slate-500">tr / rk</span>
          </div>
          <div className="mt-1 text-base font-mono font-bold text-slate-100">
            {formatNum(metrics.trace, 3)}{' '}
            <span className="text-xs font-normal text-slate-400">
              | rk {metrics.rank}/{dim}
            </span>
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">
            Nullity dim(ker A) = {metrics.nullity}
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Norms L₁ / L∞</span>
            <span className="font-mono text-slate-500">‖A‖₁, ‖A‖∞</span>
          </div>
          <div className="mt-1 text-sm font-mono font-bold text-fuchsia-300">
            {formatNum(metrics.norm1, 3)} / {formatNum(metrics.normInf, 3)}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">Col max / Row max</div>
        </div>

        <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Norms L₂ / Frob</span>
            <span className="font-mono text-slate-500">‖A‖₂, ‖A‖_F</span>
          </div>
          <div className="mt-1 text-sm font-mono font-bold text-sky-300">
            {formatNum(metrics.normSpectral, 3)} / {formatNum(metrics.normFrobenius, 3)}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">σ_max / √(∑ σ_i²)</div>
        </div>
      </div>

      {/* Argand Plane & Gershgorin Discs */}
      <ArgandWidget metrics={metrics} />

      {/* Eigenvalues & Eigenvectors with Set v = e_i */}
      <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">
            Eigenvectors & Invariant Subspaces
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
                    ? 'Real Axis'
                    : `|λ|=${formatNum(pair.modulus, 2)}, θ=${formatNum(pair.angleDeg, 1)}°`}
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
                    >
                      Set v = e_{idx + 1}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic">
                  {pair.isReal
                    ? 'Defective eigenvalue (missing independent eigenvector)'
                    : 'Complex conjugate rotation-scaling mode'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Decompositions Explorer: SVD, PA=LU, A=QR */}
      <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">Matrix Decompositions</span>
          <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            {(
              [
                ['svd', 'SVD (UΣVᵀ)'],
                ['lu', 'PA = LU'],
                ['qr', 'A = QR'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setDecompTab(id)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                  decompTab === id
                    ? 'bg-purple-500/25 text-purple-200 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {decompTab === 'svd' && (
          <div className="space-y-2">
            {metrics.singularValues.map((sigma, idx) => {
              const pct = Math.min(100, Math.max(2, (sigma / maxSigma) * 100))
              const u = metrics.svd.uVectors[idx]
              const v = metrics.svd.vVectors[idx]
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-purple-300 font-semibold">
                      σ_{idx + 1} = {formatNum(sigma, 4)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      u_{idx + 1}=({u?.map((c) => formatNum(c, 2)).join(',')}) • v_{idx + 1}=(
                      {v?.map((c) => formatNum(c, 2)).join(',')})
                    </span>
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
        )}

        {decompTab === 'lu' && (
          <div className="grid grid-cols-2 gap-2">
            <MiniMatrixView title="Lower L" mat={metrics.lu.L} />
            <MiniMatrixView title="Upper U" mat={metrics.lu.U} />
          </div>
        )}

        {decompTab === 'qr' && (
          <div className="grid grid-cols-2 gap-2">
            <MiniMatrixView title="Orthogonal Q" mat={metrics.qr.Q} />
            <MiniMatrixView title="Upper Triangular R" mat={metrics.qr.R} />
          </div>
        )}
      </div>
    </div>
  )
}
