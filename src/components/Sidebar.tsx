import { useState } from 'react'
import type { Metrics, Mode } from '../types/math'
import type { MatrixPreset } from '../lib/presets'
import MatrixInput from './MatrixInput'
import VectorInput from './VectorInput'
import ControlsTime from './ControlsTime'
import MetricsPanel from './MetricsPanel'
import { cloneMatrix } from '../lib/mathEngine'

interface SidebarProps {
  mode: Mode
  setMode: (m: Mode) => void
  matrix2: number[][]
  matrix3: number[][]
  setMatrix2: (m: number[][]) => void
  setMatrix3: (m: number[][]) => void
  vector2: [number, number]
  vector3: [number, number, number]
  setVector2: (v: [number, number]) => void
  setVector3: (v: [number, number, number]) => void
  presets: MatrixPreset[]
  activePresetId: string | null
  onSelectPreset: (preset: MatrixPreset) => void
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
  metrics: Metrics
}

export default function Sidebar({
  mode,
  setMode,
  matrix2,
  matrix3,
  setMatrix2,
  setMatrix3,
  vector2,
  vector3,
  setVector2,
  setVector3,
  presets,
  activePresetId,
  onSelectPreset,
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
  metrics,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'controls' | 'metrics'>('controls')
  const currentMatrix = mode === '2d' ? matrix2 : matrix3
  const currentVector = mode === '2d' ? vector2 : vector3
  const activePreset = presets.find((p) => p.id === activePresetId)

  const handleMatrixUpdate = (next: number[][]) => {
    if (mode === '2d') setMatrix2(cloneMatrix(next))
    else setMatrix3(cloneMatrix(next))
  }

  const handleVectorUpdate = (next: number[]) => {
    if (mode === '2d') setVector2([next[0] ?? 0, next[1] ?? 0])
    else setVector3([next[0] ?? 0, next[1] ?? 0, next[2] ?? 0])
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 border-r border-slate-800/90">
      {/* Header & 2D/3D Mode Switcher */}
      <div className="p-4 border-b border-slate-800/90 space-y-3 bg-slate-900/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-mono font-bold text-sm text-white shadow-md shadow-sky-500/20">
              [A]
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                Matrix Warp
              </h1>
              <p className="text-[11px] text-slate-400">
                Linear Operator & Spectral Visualizer
              </p>
            </div>
          </div>

          <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              type="button"
              aria-pressed={mode === '2d'}
              onClick={() => setMode('2d')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                mode === '2d'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2×2 (2D)
            </button>
            <button
              type="button"
              aria-pressed={mode === '3d'}
              onClick={() => setMode('3d')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                mode === '3d'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3×3 (3D)
            </button>
          </div>
        </div>

        {/* Mobile/Compact Tab Switcher (Controls vs Metrics) */}
        <div className="grid grid-cols-2 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 lg:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('controls')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'controls'
                ? 'bg-slate-800 text-sky-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Matrix & Controls
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'metrics'
                ? 'bg-slate-800 text-sky-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Spectral Metrics
          </button>
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className={`space-y-5 ${activeTab === 'metrics' ? 'hidden lg:block' : 'block'}`}>
          {/* Operator Presets Gallery */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Canonical Presets
              </span>
              {activePreset && (
                <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {activePreset.name}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((preset) => {
                const isSelected = preset.id === activePresetId
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectPreset(preset)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs border transition ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500/50 text-sky-200 font-semibold'
                        : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="truncate">{preset.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 ml-1 shrink-0">
                      {preset.badge}
                    </span>
                  </button>
                )
              })}
            </div>
            {activePreset && (
              <p className="text-[11px] text-slate-400 bg-slate-900/50 border border-slate-800/80 rounded-lg px-2.5 py-1.5 leading-relaxed">
                {activePreset.description}
              </p>
            )}
          </div>

          {/* Matrix Input Cells */}
          <MatrixInput matrix={currentMatrix} onChange={handleMatrixUpdate} />

          {/* Vector Input Cells */}
          <VectorInput
            vector={currentVector}
            matrix={currentMatrix}
            onChange={handleVectorUpdate}
          />

          {/* Time Evolution & Power Iteration Studio */}
          <ControlsTime
            t={t}
            setT={setT}
            morphPlaying={morphPlaying}
            setMorphPlaying={setMorphPlaying}
            powerMode={powerMode}
            setPowerMode={setPowerMode}
            powerK={powerK}
            setPowerK={setPowerK}
            powerPlaying={powerPlaying}
            setPowerPlaying={setPowerPlaying}
            powerInterval={powerInterval}
            setPowerInterval={setPowerInterval}
            normalizePower={normalizePower}
            setNormalizePower={setNormalizePower}
          />
        </div>

        {/* Computed Spectral & Conditioning Metrics */}
        <div
          className={`pt-2 lg:border-t lg:border-slate-800/90 ${
            activeTab === 'controls' ? 'hidden lg:block' : 'block'
          }`}
        >
          <MetricsPanel
            metrics={metrics}
            mode={mode}
            onSelectVector={(vec) => handleVectorUpdate(vec)}
          />
        </div>
      </div>
    </div>
  )
}
