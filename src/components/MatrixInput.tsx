import { useEffect, useState } from 'react'
import { formatNum, identityMatrix, invertMatrix, transposeMatrix } from '../lib/mathEngine'
import { useI18n } from '../lib/i18n'

interface MatrixInputProps {
  matrix: number[][]
  onChange: (m: number[][]) => void
}

const COL_COLORS = ['text-emerald-400', 'text-amber-400', 'text-indigo-400']

export default function MatrixInput({ matrix, onChange }: MatrixInputProps) {
  const { tr } = useI18n()
  const n = matrix.length as 2 | 3
  const [drafts, setDrafts] = useState<string[][]>(() =>
    matrix.map((row) => row.map((v) => formatNum(v, 4)))
  )

  useEffect(() => {
    setDrafts(matrix.map((row) => row.map((v) => formatNum(v, 4))))
  }, [matrix])

  const handleCellChange = (r: number, c: number, raw: string) => {
    const nextDrafts = drafts.map((row, ri) =>
      row.map((val, ci) => (ri === r && ci === c ? raw : val))
    )
    setDrafts(nextDrafts)

    const parsed = parseFloat(raw)
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      const nextMat = matrix.map((row, ri) =>
        row.map((val, ci) => (ri === r && ci === c ? parsed : val))
      )
      onChange(nextMat)
    } else if (raw.trim() === '') {
      const nextMat = matrix.map((row, ri) =>
        row.map((val, ci) => (ri === r && ci === c ? 0 : val))
      )
      onChange(nextMat)
    }
  }

  const inv = invertMatrix(matrix)

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {tr(`Operator Matrix A (${n}×${n})`, `Matrice Operatore A (${n}×${n})`)}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(transposeMatrix(matrix))}
            title={tr('Transpose Matrix (A^T)', 'Trasponi Matrice (A^T)')}
            className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            Aᵀ
          </button>
          <button
            type="button"
            disabled={!inv}
            onClick={() => inv && onChange(inv)}
            title={
              inv
                ? tr('Invert Matrix (A⁻¹)', 'Inverti Matrice (A⁻¹)')
                : tr('Matrix is singular (not invertible)', 'Matrice singolare (non invertibile)')
            }
            className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 border border-slate-700 transition"
          >
            A⁻¹
          </button>
          <button
            type="button"
            onClick={() => onChange(identityMatrix(n))}
            title={tr('Reset to Identity Matrix', 'Ripristina Matrice Identità')}
            className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition"
          >
            Reset I
          </button>
        </div>
      </div>

      {/* Column Basis Headers */}
      <div
        className={`grid gap-2 px-3 text-center text-[11px] font-mono ${
          n === 2 ? 'grid-cols-2' : 'grid-cols-3'
        }`}
      >
        {Array.from({ length: n }, (_, c) => (
          <div key={c} className={COL_COLORS[c]}>
            Col {c + 1} (Ae_{c + 1})
          </div>
        ))}
      </div>

      {/* Bracketed Matrix Cells */}
      <div className="relative flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-3">
        <div className="w-2.5 self-stretch border-l-2 border-t-2 border-b-2 border-slate-500 rounded-l-sm mr-1.5" />

        <div className={`grid gap-2 flex-1 ${n === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {matrix.map((row, r) =>
            row.map((_, c) => (
              <div key={`${r}-${c}`} className="relative">
                <input
                  type="number"
                  step="0.1"
                  aria-label={`Matrix cell a_${r + 1}${c + 1}`}
                  value={drafts[r]?.[c] ?? '0'}
                  onChange={(e) => handleCellChange(r, c, e.target.value)}
                  onBlur={() =>
                    setDrafts(matrix.map((rw) => rw.map((val) => formatNum(val, 4))))
                  }
                  className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40 rounded-lg px-2.5 py-2 text-sm font-mono text-center text-slate-100 outline-none transition"
                />
                <span className="absolute right-1.5 bottom-0.5 text-[9px] font-mono text-slate-600 pointer-events-none">
                  {r + 1},{c + 1}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="w-2.5 self-stretch border-r-2 border-t-2 border-b-2 border-slate-500 rounded-r-sm ml-1.5" />
      </div>
    </div>
  )
}
