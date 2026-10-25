import type { Mode } from '../types/math'

export default function ModeToggle({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => setMode('2d')}
        className={`px-2 py-1 rounded ${mode === '2d' ? 'bg-blue-600' : 'bg-white/10'}`}
      >
        2D (2x2)
      </button>
      <button
        onClick={() => setMode('3d')}
        className={`px-2 py-1 rounded ${mode === '3d' ? 'bg-blue-600' : 'bg-white/10'}`}
      >
        3D (3x3)
      </button>
    </div>
  )
}
