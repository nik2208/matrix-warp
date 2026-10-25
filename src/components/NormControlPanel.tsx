import type { LpMetrics } from '../types/math'
import { formatNum } from '../lib/mathEngine'
import { useI18n } from '../lib/i18n'

interface NormControlPanelProps {
  /** Slider value in [1, 10.5], where > 10 means Infinity */
  pSlider: number
  onPSliderChange: (val: number) => void
  lpMetrics: LpMetrics
  showLpBall: boolean
  onToggleLpBall: () => void
  onSelectMaximizer: (vec: number[]) => void
}

const PRESET_P = [
  { labelEn: 'L₁ (Manhattan)', labelIt: 'L₁ (Manhattan)', val: 1 },
  { labelEn: 'L₁.₅', labelIt: 'L₁.₅', val: 1.5 },
  { labelEn: 'L₂ (Euclidean)', labelIt: 'L₂ (Euclidea)', val: 2 },
  { labelEn: 'L₃', labelIt: 'L₃', val: 3 },
  { labelEn: 'L₄', labelIt: 'L₄', val: 4 },
  { labelEn: 'L∞ (Max)', labelIt: 'L∞ (Max)', val: 10.5 },
]

export default function NormControlPanel({
  pSlider,
  onPSliderChange,
  lpMetrics,
  showLpBall,
  onToggleLpBall,
  onSelectMaximizer,
}: NormControlPanelProps) {
  const { tr } = useI18n()
  const stretchRatio =
    lpMetrics.vecNormV > 1e-12 ? lpMetrics.vecNormAv / lpMetrics.vecNormV : 0

  return (
    <div className="rounded-xl bg-slate-900/90 border border-fuchsia-500/30 p-3.5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-fuchsia-300">
            {tr(
              `Minkowski L_p Norm Explorer (p = ${lpMetrics.pLabel})`,
              `Esploratore Norma L_p di Minkowski (p = ${lpMetrics.pLabel})`
            )}
          </span>
          <p className="text-[10px] text-slate-400">
            {tr(
              'Continuous p-norm from L₁ diamond to L₂ circle to L∞ cube',
              'Norma-p continua dal diamante L₁ al cerchio L₂ fino al cubo L∞'
            )}
          </p>
        </div>
        <button
          type="button"
          aria-pressed={showLpBall}
          onClick={onToggleLpBall}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
            showLpBall
              ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-200'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          {showLpBall
            ? tr('◉ L_p Ball On', '◉ Palla L_p Attiva')
            : tr('○ L_p Ball Off', '○ Palla L_p Off')}
        </button>
      </div>

      {/* Slider for p from 1 to Infinity */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300">‖x‖_p = (∑ |x_i|^p)^(1/p)</span>
          <span className="font-bold text-fuchsia-300">p = {lpMetrics.pLabel}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10.5"
          step="0.1"
          aria-label="Norm p parameter"
          value={pSlider}
          onChange={(e) => onPSliderChange(parseFloat(e.target.value))}
          className="w-full accent-fuchsia-400 cursor-pointer"
        />
        <div className="grid grid-cols-3 gap-1 pt-0.5">
          {PRESET_P.map((item) => {
            const active =
              (item.val > 10 && pSlider > 10) || Math.abs(pSlider - item.val) < 0.06
            return (
              <button
                key={item.labelEn}
                type="button"
                onClick={() => onPSliderChange(item.val)}
                className={`px-2 py-1 rounded text-[10px] font-mono border transition ${
                  active
                    ? 'bg-fuchsia-500/25 border-fuchsia-400/60 text-fuchsia-200 font-semibold'
                    : 'bg-slate-950/70 hover:bg-slate-800 border-slate-800 text-slate-400'
                }`}
              >
                {tr(item.labelEn, item.labelIt)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Vector & Matrix L_p Norm Readouts */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-2.5">
          <div className="text-[10px] text-slate-400 flex justify-between">
            <span>{tr('Vector Norm', 'Norma Vettore')}</span>
            <span className="font-mono text-sky-300">‖v‖_{lpMetrics.pLabel}</span>
          </div>
          <div className="text-sm font-mono font-bold text-sky-300 mt-0.5">
            {formatNum(lpMetrics.vecNormV, 4)}
          </div>
          <div className="text-[10px] font-mono text-rose-300 mt-0.5">
            ‖Av‖_{lpMetrics.pLabel} = {formatNum(lpMetrics.vecNormAv, 4)} (×
            {formatNum(stretchRatio, 2)})
          </div>
        </div>

        <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-2.5">
          <div className="text-[10px] text-slate-400 flex justify-between">
            <span>{tr('Induced Matrix Norm', 'Norma Matriciale Indotta')}</span>
            <span className="font-mono text-fuchsia-300">‖A‖_{lpMetrics.pLabel}</span>
          </div>
          <div className="text-sm font-mono font-bold text-fuchsia-300 mt-0.5">
            {formatNum(lpMetrics.matrixNormP, 4)}
          </div>
          <div className="text-[10px] font-mono text-amber-300 mt-0.5">
            κ_{lpMetrics.pLabel}(A) = {formatNum(lpMetrics.condP, 3)}
          </div>
        </div>
      </div>

      {/* Maximizer Vector on L_p Unit Ball */}
      <div className="flex items-center justify-between gap-2 bg-slate-950/60 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-[11px]">
        <div className="font-mono text-slate-300 truncate">
          x_max = ({lpMetrics.maximizerX.map((c) => formatNum(c, 2)).join(', ')})
        </div>
        <button
          type="button"
          onClick={() => onSelectMaximizer(lpMetrics.maximizerX)}
          className="px-2 py-0.5 rounded bg-fuchsia-500/20 hover:bg-fuchsia-500/35 text-fuchsia-200 border border-fuchsia-500/40 text-[10px] font-medium shrink-0 transition"
        >
          {tr('Set v = x_max', 'Imposta v = x_max')}
        </button>
      </div>
    </div>
  )
}
