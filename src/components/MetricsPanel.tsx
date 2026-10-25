import { useState } from 'react'
import type { Metrics, Mode } from '../types/math'
import { formatComplex, formatNum, transposeMatrix } from '../lib/mathEngine'
import { useI18n } from '../lib/i18n'
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
  const { tr } = useI18n()
  const dim = mode === '2d' ? 2 : 3
  const maxSigma = Math.max(...metrics.singularValues, 1e-6)
  const [decompTab, setDecompTab] = useState<'svd' | 'lu' | 'cholesky' | 'qr'>('svd')

  const stabilityStyles = {
    optimal: {
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      label: tr('Well-Conditioned', 'Ben Condizionata'),
      dot: 'bg-emerald-400',
    },
    moderate: {
      badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      label: tr('Moderately Conditioned', 'Moderatamente Condizionata'),
      dot: 'bg-sky-400',
    },
    'ill-conditioned': {
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      label: tr('Ill-Conditioned (High κ)', 'Mal Condizionata (κ Alto)'),
      dot: 'bg-amber-400',
    },
    singular: {
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      label: tr('Singular (Rank Deficient)', 'Singolare (Rango Deficiente)'),
      dot: 'bg-rose-400',
    },
  }[metrics.stability]

  const propBadges: { label: string; active: boolean; color: string }[] = [
    {
      label: tr('Symmetric (A=Aᵀ)', 'Simmetrica (A=Aᵀ)'),
      active: metrics.properties.isSymmetric,
      color: 'text-sky-300 border-sky-500/30 bg-sky-500/10',
    },
    {
      label: tr('Positive Definite (SPD)', 'Definita Positiva (SPD)'),
      active: metrics.properties.isPositiveDefinite,
      color: 'text-teal-300 border-teal-500/30 bg-teal-500/10',
    },
    {
      label: tr('Diag Dominant', 'Diag. Dominante'),
      active: metrics.properties.isStrictlyDiagonallyDominant,
      color: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
    },
    {
      label: tr('Tridiagonal', 'Tridiagonale'),
      active: metrics.properties.isTridiagonal,
      color: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
    },
    {
      label: tr('Orthogonal (QᵀQ=I)', 'Ortogonale (QᵀQ=I)'),
      active: metrics.properties.isOrthogonal,
      color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
    },
    {
      label: tr('Normal (AAᵀ=AᵀA)', 'Normale (AAᵀ=AᵀA)'),
      active: metrics.properties.isNormal,
      color: 'text-indigo-300 border-indigo-500/30 bg-indigo-500/10',
    },
    {
      label: tr('Idempotent (A²=A)', 'Idempotente (A²=A)'),
      active: metrics.properties.isIdempotent,
      color: 'text-purple-300 border-purple-500/30 bg-purple-500/10',
    },
    {
      label: tr('Involutory (A²=I)', 'Involutoria (A²=I)'),
      active: metrics.properties.isInvolutory,
      color: 'text-pink-300 border-pink-500/30 bg-pink-500/10',
    },
  ]

  const pd = metrics.posDefinite
  const dd = metrics.diagDominance

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {tr('Matrix Anatomy & Diagnostics', 'Anatomia & Diagnostica Matrice')}
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
              {tr('Orientation Flip', 'Orientamento Invertito')}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {propBadges.map((b) => (
            <span
              key={b.label}
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                b.active
                  ? b.color
                  : 'text-slate-500 border-slate-800/80 bg-slate-950/60'
              }`}
            >
              {b.active ? '✓' : '✗'} {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* Explicit Pairings */}
      <div className="grid grid-cols-1 gap-2.5">
        <div className="rounded-xl bg-slate-900/80 border border-teal-500/30 p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-teal-300">
              {tr(
                'Positive Definiteness (SPD) & Conditioning κ₂(A)',
                'Definitezza Positiva (SPD) & Condizionamento κ₂(A)'
              )}
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
                ? tr('✓ SPD (A=Aᵀ, λ_i > 0)', '✓ SPD (A=Aᵀ, λ_i > 0)')
                : pd.isPositiveDefiniteQuadratic
                  ? tr('xᵀAx > 0 (Non-Sym)', 'xᵀAx > 0 (Non Simm.)')
                  : tr('✗ Not Positive Definite', '✗ Non Definita Positiva')}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
            <span>
              Sylvester:{' '}
              {pd.leadingMinors.map((m, i) => `Δ_${i + 1}=${formatNum(m, 2)}`).join(', ')}
            </span>
            <span
              className={`font-bold ${
                metrics.singular
                  ? 'text-rose-400'
                  : metrics.cond > 50
                    ? 'text-amber-400'
                    : 'text-emerald-300'
              }`}
            >
              κ₂(A) = {formatNum(metrics.cond, 3)}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/80 border border-amber-500/30 p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-300">
              {tr(
                'Diagonal Dominance & Spectral Radius ρ(A)',
                'Dominanza Diagonale & Raggio Spettrale ρ(A)'
              )}
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
                ? tr('✓ Strict (Rows)', '✓ Stretta (Righe)')
                : dd.isStrictCol
                  ? tr('✓ Strict (Cols)', '✓ Stretta (Colonne)')
                  : dd.isWeakRow
                    ? tr('~ Weak (|a_ii| ≥ R_i)', '~ Debole (|a_ii| ≥ R_i)')
                    : tr('✗ Not Dominant', '✗ Non Dominante')}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
            <span>
              {dd.rows
                .map(
                  (r) =>
                    `R${r.row}: ${formatNum(r.diagAbs, 1)}${r.isStrict ? '>' : '≤'}${formatNum(r.offDiagSum, 1)}`
                )
                .join(' | ')}
            </span>
            <span className="text-teal-300 font-bold">
              ρ(A) = {formatNum(metrics.spectralRadius, 3)}
            </span>
          </div>
        </div>
      </div>

      {/* Core Invariants Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{tr('Determinant', 'Determinante')}</span>
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
            <span>{tr('Spectral Radius', 'Raggio Spettrale')}</span>
            <span className="font-mono text-teal-400">ρ(A)</span>
          </div>
          <div className="mt-1 text-base font-mono font-bold text-teal-300">
            {formatNum(metrics.spectralRadius, 4)}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">max |λ_i| ≤ ‖A‖_p</div>
        </div>

        <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{tr('Condition No. (L₂)', 'Condizionamento (L₂)')}</span>
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
            <span>{tr('Trace & Rank', 'Traccia & Rango')}</span>
            <span className="font-mono text-slate-500">tr / rk</span>
          </div>
          <div className="mt-1 text-base font-mono font-bold text-slate-100">
            {formatNum(metrics.trace, 3)}{' '}
            <span className="text-xs font-normal text-slate-400">
              | rk {metrics.rank}/{dim}
            </span>
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">
            {tr('Nullity dim(ker A)', 'Nullità dim(ker A)')} = {metrics.nullity}
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{tr('Norms L₁ / L∞', 'Norme L₁ / L∞')}</span>
            <span className="font-mono text-slate-500">‖A‖₁, ‖A‖∞</span>
          </div>
          <div className="mt-1 text-sm font-mono font-bold text-fuchsia-300">
            {formatNum(metrics.norm1, 3)} / {formatNum(metrics.normInf, 3)}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">
            {tr('Col max / Row max', 'Max col / Max riga')}
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{tr('Norms L₂ / Frob', 'Norme L₂ / Frob')}</span>
            <span className="font-mono text-slate-500">‖A‖₂, ‖A‖_F</span>
          </div>
          <div className="mt-1 text-sm font-mono font-bold text-sky-300">
            {formatNum(metrics.normSpectral, 3)} / {formatNum(metrics.normFrobenius, 3)}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">σ_max / √(∑ σ_i²)</div>
        </div>
      </div>

      <ArgandWidget metrics={metrics} />

      {/* Eigenvalues & Eigenvectors */}
      <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">
            {tr('Eigenvectors & Invariant Subspaces', 'Autovettori & Sottospazi Invarianti')}
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
                    ? tr('Real Axis', 'Asse Reale')
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
                      {tr(`Set v = e_${idx + 1}`, `Imposta v = e_${idx + 1}`)}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic">
                  {pair.isReal
                    ? tr(
                        'Defective eigenvalue (missing independent eigenvector)',
                        'Autovalore difettivo (autovettore indipendente mancante)'
                      )
                    : tr(
                        'Complex conjugate rotation-scaling mode',
                        'Modo complesso coniugato di roto-omosia'
                      )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Decompositions Explorer */}
      <div className="rounded-xl bg-slate-900/75 border border-slate-800/90 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">
            {tr('Matrix Decompositions', 'Decomposizioni Matriciali')}
          </span>
          <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            {(
              [
                ['svd', 'SVD'],
                ['lu', 'PA=LU'],
                ['cholesky', 'LLᵀ'],
                ['qr', 'A=QR'],
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
          <div className="grid grid-cols-3 gap-1.5">
            <MiniMatrixView title="Perm P" mat={metrics.lu.P} />
            <MiniMatrixView title="Lower L" mat={metrics.lu.L} />
            <MiniMatrixView title="Upper U" mat={metrics.lu.U} />
          </div>
        )}

        {decompTab === 'cholesky' && (
          <div className="space-y-2">
            {metrics.cholesky.isSPD && metrics.cholesky.L ? (
              <div className="grid grid-cols-2 gap-2">
                <MiniMatrixView title="Cholesky L" mat={metrics.cholesky.L} />
                <MiniMatrixView
                  title="Transpose Lᵀ"
                  mat={transposeMatrix(metrics.cholesky.L)}
                />
              </div>
            ) : (
              <div className="text-[11px] font-mono text-amber-300 bg-slate-950/70 p-2.5 rounded border border-slate-800">
                {metrics.cholesky.reason}
              </div>
            )}
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
