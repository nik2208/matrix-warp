export default function ControlsTime({
  t,
  setT,
  powerMode,
  setPowerMode,
  powerK,
  setPowerK,
  playing,
  setPlaying,
}: {
  t: number
  setT: (v: number) => void
  powerMode: boolean
  setPowerMode: (v: boolean) => void
  powerK: number
  setPowerK: (v: number) => void
  playing: boolean
  setPlaying: (v: boolean) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Interpolation / Power</div>
        <label className="flex items-center gap-1 text-xs">
          <input type="checkbox" checked={powerMode} onChange={(e) => setPowerMode(e.target.checked)} />
          Power iteration
        </label>
      </div>
      {!powerMode ? (
        <div className="space-y-1">
          <div className="text-xs">M(t) = (1-t)I + tA, t={t.toFixed(2)}</div>
          <input type="range" min={0} max={1} step={0.01} value={t} onChange={(e) => setT(parseFloat(e.target.value))} className="w-full" />
        </div>
      ) : (
        <div className="space-y-1">
          <div className="text-xs">v_k = A^k v (k={powerK})</div>
          <div className="flex gap-1">
            <button onClick={() => setPlaying(!playing)} className="px-2 py-0.5 bg-white/10 rounded text-xs">
              {playing ? 'Pause' : 'Play'}
            </button>
            <button onClick={() => setPowerK(powerK + 1)} className="px-2 py-0.5 bg-white/10 rounded text-xs">
              Step
            </button>
            <button onClick={() => { setPowerK(0); setPlaying(false); }} className="px-2 py-0.5 bg-white/10 rounded text-xs">
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
