import { useEffect, useState } from 'react'
import { applyMatrix, formatNum, normalizeVec, vecNorm } from '../lib/mathEngine'

interface VectorInputProps {
  vector: number[]
  matrix: number[][]
  onChange: (v: number[]) => void
}

const AXES = ['x', 'y', 'z']

export default function VectorInput({ vector, matrix, onChange }: VectorInputProps) {
  const n = vector.length
  const [drafts, setDrafts] = useState<string[]>(() => vector.map((v) => formatNum(v, 3)))

  useEffect(() => {
    setDrafts(vector.map((v) => formatNum(v, 3)))
  }, [vector])

  const handleCoordChange = (idx: number, raw: string) => {
    const nextDrafts = drafts.map((d, i) => (i === idx ? raw : d))
    setDrafts(nextDrafts)
    const parsed = parseFloat(raw)
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      onChange(vector.map((v, i) => (i === idx ? parsed : v)))
    } else if (raw.trim() === '') {
      onChange(vector.map((v, i) => (i === idx ? 0 : v)))
    }
  }

  const transformed = applyMatrix(matrix, vector)
  const normV = vecNorm(vector)
  const normAv = vecNorm(transformed)

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Test Vector v & Image T(v) = Av
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(n === 2 ? [1, 0] : [1, 0, 0])}
            className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            e₁
          </button>
          <button
            type="button"
            onClick={() => onChange(n === 2 ? [1, 1] : [1, 1, 1])}
            className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            (1,1{n === 3 ? ',1' : ''})
          </button>
          <button
            type="button"
            onClick={() => {
              if (normV > 1e-9) onChange(normalizeVec(vector))
            }}
            title="Normalize v to unit length (‖v‖ = 1)"
            className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition"
          >
            ‖v‖=1
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Input Vector v */}
        <div className="rounded-xl bg-slate-900/90 border border-sky-500/30 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-sky-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              Input v
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              ‖v‖ = {formatNum(normV, 2)}
            </span>
          </div>
          <div className="space-y-1.5">
            {vector.map((_, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-slate-400 w-3">{AXES[idx]}</span>
                <input
                  type="number"
                  step="0.1"
                  aria-label={`Vector v_${AXES[idx]}`}
                  value={drafts[idx] ?? '0'}
                  onChange={(e) => handleCoordChange(idx, e.target.value)}
                  onBlur={() => setDrafts(vector.map((v) => formatNum(v, 3)))}
                  className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-sky-400 rounded-lg px-2 py-1 text-xs font-mono text-slate-100 outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Transformed Vector Av */}
        <div className="rounded-xl bg-slate-900/90 border border-rose-500/30 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Output Av
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              ‖Av‖ = {formatNum(normAv, 2)}
            </span>
          </div>
          <div className="space-y-1.5">
            {transformed.map((val, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-slate-400 w-3">{AXES[idx]}'</span>
                <div className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-rose-200">
                  {formatNum(val, 4)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
