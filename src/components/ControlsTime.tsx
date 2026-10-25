import { formatNum } from '../lib/mathEngine'
import { useI18n } from '../lib/i18n'

interface ControlsTimeProps {
  t: number
  setT: (t: number) => void
  morphPlaying: boolean
  setMorphPlaying: (v: boolean) => void
  powerMode: boolean
  setPowerMode: (v: boolean) => void
  powerK: number
  setPowerK: (k: number) => void
  powerPlaying: boolean
  setPowerPlaying: (v: boolean) => void
  powerInterval: number
  setPowerInterval: (ms: number) => void
  normalizePower: boolean
  setNormalizePower: (v: boolean) => void
}

export default function ControlsTime({
  t,
  setT,
  morphPlaying,
  setMorphPlaying,
  powerMode,
  setPowerMode,
  powerK,
  setPowerK,
  powerPlaying,
  setPowerPlaying,
  powerInterval,
  setPowerInterval,
  normalizePower,
  setNormalizePower,
}: ControlsTimeProps) {
  const { tr } = useI18n()

  return (
    <div className="space-y-3 rounded-xl bg-slate-900/90 border border-slate-800 p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {tr('Time Evolution & Dynamics', 'Evoluzione Temporale & Dinamica')}
        </span>
        <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
          <button
            type="button"
            aria-pressed={!powerMode}
            onClick={() => {
              setPowerPlaying(false)
              setPowerMode(false)
            }}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${
              !powerMode
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Morph M(t)
          </button>
          <button
            type="button"
            aria-pressed={powerMode}
            onClick={() => {
              setMorphPlaying(false)
              setT(1)
              setPowerMode(true)
            }}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${
              powerMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tr('Power Aᵏv', 'Potenze Aᵏv')}
          </button>
        </div>
      </div>

      {!powerMode ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-300">M(t) = (1 − t)I + tA</span>
            <span className="font-mono font-bold text-sky-300">t = {formatNum(t, 2)}</span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            aria-label="Interpolation parameter t"
            value={t}
            onChange={(e) => {
              setMorphPlaying(false)
              setT(parseFloat(e.target.value))
            }}
            className="w-full accent-sky-400 cursor-pointer"
          />

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                if (!morphPlaying && t >= 0.99) setT(0)
                setMorphPlaying(!morphPlaying)
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
                morphPlaying
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/40 text-sky-300'
              }`}
            >
              {morphPlaying
                ? tr('⏸ Pause Morph', '⏸ Pausa Morph')
                : tr('▶ Animate I → A', '▶ Anima I → A')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMorphPlaying(false)
                setT(0)
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              t=0
            </button>
            <button
              type="button"
              onClick={() => {
                setMorphPlaying(false)
                setT(1)
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              t=1
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-300">
              {tr('Discrete Orbit v_k = Aᵏ v₀', 'Orbita Discreta v_k = Aᵏ v₀')}
            </span>
            <span className="font-mono font-bold text-amber-300">k = {powerK}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPowerPlaying(!powerPlaying)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition ${
                powerPlaying
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300'
              }`}
            >
              {powerPlaying ? tr('⏸ Pause', '⏸ Pausa') : tr('▶ Play', '▶ Avvia')}
            </button>
            <button
              type="button"
              onClick={() => {
                setPowerPlaying(false)
                setPowerK(Math.min(32, powerK + 1))
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              {tr('Step +1', 'Passo +1')}
            </button>
            <button
              type="button"
              onClick={() => {
                setPowerPlaying(false)
                setPowerK(0)
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Reset
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={normalizePower}
                onChange={(e) => setNormalizePower(e.target.checked)}
                className="rounded accent-amber-400"
              />
              <span>{tr('Normalize ‖v_k‖ = 1', 'Normalizza ‖v_k‖ = 1')}</span>
            </label>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span>{tr('Interval:', 'Intervallo:')}</span>
              <input
                type="range"
                min="120"
                max="900"
                step="60"
                value={powerInterval}
                onChange={(e) => setPowerInterval(parseInt(e.target.value, 10))}
                className="w-20 accent-amber-400"
              />
              <span className="font-mono w-11 text-right">{powerInterval}ms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
