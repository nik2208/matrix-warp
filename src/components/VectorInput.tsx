export default function VectorInput({
  dim,
  vector,
  setVector,
}: {
  dim: 2 | 3
  vector: any
  setVector: (v: any) => void
}) {
  const update = (i: number, val: string) => {
    const num = parseFloat(val)
    const v = [...vector]
    v[i] = isNaN(num) ? 0 : num
    setVector(v)
  }
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">Test vector v</div>
      <div className="flex gap-1">
        {Array.from({ length: dim }).map((_, i) => (
          <input
            key={i}
            value={vector[i] ?? 0}
            onChange={(e) => update(i, e.target.value)}
            className="bg-white/5 px-1 py-0.5 rounded text-sm w-16"
          />
        ))}
      </div>
    </div>
  )
}
