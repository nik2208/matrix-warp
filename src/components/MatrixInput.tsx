export default function MatrixInput({
  dim,
  matrix,
  setMatrix,
  presets,
  onApplyPreset,
}: {
  dim: 2 | 3
  matrix: number[][]
  setMatrix: (m: number[][]) => void
  presets: Record<string, number[]>
  onApplyPreset: (key: string) => void
}) {
  const update = (i: number, j: number, val: string) => {
    const num = parseFloat(val)
    const m = matrix.map((row) => [...row])
    m[i][j] = isNaN(num) ? 0 : num
    setMatrix(m)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Matrix {dim}x{dim}</div>
        <select onChange={(e) => onApplyPreset(e.target.value)} className="bg-white/10 rounded px-1 py-0.5 text-sm">
          <option value="">Presets</option>
          {Object.keys(presets).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${dim}, 1fr)` }}>
        {Array.from({ length: dim }).map((_, i) =>
          Array.from({ length: dim }).map((_, j) => (
            <input
              key={`${i}${j}`}
              value={matrix[i]?.[j] ?? 0}
              onChange={(e) => update(i, j, e.target.value)}
              className="bg-white/5 px-1 py-0.5 rounded text-sm"
            />
          ))
        )}
      </div>
    </div>
  )
}
