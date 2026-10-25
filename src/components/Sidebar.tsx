import { useState } from 'react'
import type {
  IterativeMethodId,
  LinearSystemSolution,
  LpMetrics,
  Metrics,
  Mode,
} from '../types/math'
import type { MatrixPreset } from '../lib/presets'
import MatrixInput from './MatrixInput'
import VectorInput from './VectorInput'
import ControlsTime from './ControlsTime'
import NormControlPanel from './NormControlPanel'
import LinearSystemPanel from './LinearSystemPanel'
import MetricsPanel from './MetricsPanel'
import { cloneMatrix } from '../lib/mathEngine'
import { useI18n } from '../lib/i18n'
import { APP_VERSION, GITHUB_CHANGELOG_URL, GITHUB_REPO_URL } from '../version'

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
  b2: [number, number]
  b3: [number, number, number]
  setB2: (b: [number, number]) => void
  setB3: (b: [number, number, number]) => void
  pSlider: number
  setPSlider: (val: number) => void
  lpMetrics: LpMetrics
  showLpBall: boolean
  onToggleLpBall: () => void
  solution: LinearSystemSolution
  sorOmega: number
  setSorOmega: (w: number) => void
  iterStep: number
  setIterStep: (k: number) => void
  iterPlaying: boolean
  setIterPlaying: (v: boolean) => void
  enabledMethods: Record<IterativeMethodId, boolean>
  onToggleMethod: (id: IterativeMethodId) => void
  showRowPlanes: boolean
  onToggleRowPlanes: () => void
  showColPicture: boolean
  onToggleColPicture: () => void
  showIterativePaths: boolean
  onToggleIterativePaths: () => void
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
  b2,
  b3,
  setB2,
  setB3,
  pSlider,
  setPSlider,
  lpMetrics,
  showLpBall,
  onToggleLpBall,
  solution,
  sorOmega,
  setSorOmega,
  iterStep,
  setIterStep,
  iterPlaying,
  setIterPlaying,
  enabledMethods,
  onToggleMethod,
  showRowPlanes,
  onToggleRowPlanes,
  showColPicture,
  onToggleColPicture,
  showIterativePaths,
  onToggleIterativePaths,
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
  const { lang, setLang, tr } = useI18n()
  const [activeTab, setActiveTab] = useState<'operator' | 'solver' | 'metrics'>('operator')
  const currentMatrix = mode === '2d' ? matrix2 : matrix3
  const currentVector = mode === '2d' ? vector2 : vector3
  const currentB = mode === '2d' ? b2 : b3
  const activePreset = presets.find((p) => p.id === activePresetId)

  const handleMatrixUpdate = (next: number[][]) => {
    if (mode === '2d') setMatrix2(cloneMatrix(next))
    else setMatrix3(cloneMatrix(next))
  }

  const handleVectorUpdate = (next: number[]) => {
    if (mode === '2d') setVector2([next[0] ?? 0, next[1] ?? 0])
    else setVector3([next[0] ?? 0, next[1] ?? 0, next[2] ?? 0])
  }

  const handleBUpdate = (next: number[]) => {
    if (mode === '2d') setB2([next[0] ?? 0, next[1] ?? 0])
    else setB3([next[0] ?? 0, next[1] ?? 0, next[2] ?? 0])
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 border-r border-slate-800/90">
      {/* Header, Language Switcher (EN/IT) & 2D/3D Mode Switcher */}
      <div className="p-3.5 border-b border-slate-800/90 space-y-2.5 bg-slate-900/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-mono font-bold text-sm text-white shadow-md shadow-sky-500/20 shrink-0">
              [A]
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                  Matrix Warp
                </h1>
                <a
                  href={GITHUB_CHANGELOG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={tr(
                    `Semantic Version v${APP_VERSION} — View Changelog`,
                    `Versione Semantica v${APP_VERSION} — Vedi Changelog`
                  )}
                  className="px-1.5 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-[10px] font-mono font-semibold text-sky-300 transition"
                >
                  v{APP_VERSION}
                </a>
              </div>
              <p className="text-[10px] text-slate-400">
                {tr(
                  'Operator, Norms, Spectral & Ax=b Studio',
                  'Studio Operatori, Norme, Spettro & Ax=b'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language Switcher EN | IT */}
            <div
              className="inline-flex rounded-xl bg-slate-900 p-0.5 border border-slate-800"
              role="group"
              aria-label="Language switcher"
            >
              <button
                type="button"
                aria-pressed={lang === 'en'}
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition ${
                  lang === 'en'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                aria-pressed={lang === 'it'}
                onClick={() => setLang('it')}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition ${
                  lang === 'it'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                IT
              </button>
            </div>

            {/* 2D / 3D Mode Switcher */}
            <div className="inline-flex rounded-xl bg-slate-900 p-0.5 border border-slate-800">
              <button
                type="button"
                aria-pressed={mode === '2d'}
                onClick={() => setMode('2d')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  mode === '2d'
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2D
              </button>
              <button
                type="button"
                aria-pressed={mode === '3d'}
                onClick={() => setMode('3d')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  mode === '3d'
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                3D
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('operator')}
            className={`py-1.5 text-[11px] font-semibold rounded-lg transition ${
              activeTab === 'operator'
                ? 'bg-slate-800 text-sky-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tr('Matrix & Lₚ', 'Matrice & Lₚ')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('solver')}
            className={`py-1.5 text-[11px] font-semibold rounded-lg transition ${
              activeTab === 'solver'
                ? 'bg-slate-800 text-fuchsia-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tr('Solve Ax = b', 'Risolvi Ax = b')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`py-1.5 text-[11px] font-semibold rounded-lg transition ${
              activeTab === 'metrics'
                ? 'bg-slate-800 text-teal-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tr('Spectrum & LU', 'Spettro & LU')}
          </button>
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {activeTab === 'operator' && (
          <>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {tr('Canonical Presets', 'Preset Canonici')}
                </span>
                {activePreset && (
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                    {tr(activePreset.name, activePreset.nameIt)}
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
                      <span className="truncate">{tr(preset.name, preset.nameIt)}</span>
                      <span className="text-[10px] font-mono text-slate-400 ml-1 shrink-0">
                        {preset.badge}
                      </span>
                    </button>
                  )
                })}
              </div>
              {activePreset && (
                <p className="text-[11px] text-slate-400 bg-slate-900/50 border border-slate-800/80 rounded-lg px-2.5 py-1.5 leading-relaxed">
                  {tr(activePreset.description, activePreset.descriptionIt)}
                </p>
              )}
            </div>

            <MatrixInput matrix={currentMatrix} onChange={handleMatrixUpdate} />

            <VectorInput
              vector={currentVector}
              matrix={currentMatrix}
              onChange={handleVectorUpdate}
            />

            <NormControlPanel
              pSlider={pSlider}
              onPSliderChange={setPSlider}
              lpMetrics={lpMetrics}
              showLpBall={showLpBall}
              onToggleLpBall={onToggleLpBall}
              onSelectMaximizer={(vec) => handleVectorUpdate(vec)}
            />

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
          </>
        )}

        {activeTab === 'solver' && (
          <>
            <MatrixInput matrix={currentMatrix} onChange={handleMatrixUpdate} />

            <LinearSystemPanel
              mode={mode}
              matrix={currentMatrix}
              onMatrixChange={handleMatrixUpdate}
              b={currentB}
              onBChange={handleBUpdate}
              solution={solution}
              metrics={metrics}
              sorOmega={sorOmega}
              onSorOmegaChange={setSorOmega}
              iterStep={iterStep}
              onIterStepChange={setIterStep}
              iterPlaying={iterPlaying}
              onIterPlayingChange={setIterPlaying}
              enabledMethods={enabledMethods}
              onToggleMethod={onToggleMethod}
              showRowPlanes={showRowPlanes}
              onToggleRowPlanes={onToggleRowPlanes}
              showColPicture={showColPicture}
              onToggleColPicture={onToggleColPicture}
              showIterativePaths={showIterativePaths}
              onToggleIterativePaths={onToggleIterativePaths}
              onSetTestVector={(vec) => handleVectorUpdate(vec)}
            />
          </>
        )}

        {activeTab === 'metrics' && (
          <MetricsPanel
            metrics={metrics}
            mode={mode}
            onSelectVector={(vec) => handleVectorUpdate(vec)}
          />
        )}
      </div>

      {/* Footer: Semantic Version & GitHub Repository Link */}
      <div className="px-3.5 py-2.5 border-t border-slate-800/90 bg-slate-900/50 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2 font-mono text-slate-400">
          <a
            href={GITHUB_CHANGELOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-300 hover:text-sky-200 font-semibold transition"
          >
            v{APP_VERSION}
          </a>
          <span className="text-slate-700">•</span>
          <span className="text-[10px] text-slate-500">SemVer 2.0</span>
        </div>

        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-medium transition"
          title={tr('Open GitHub Repository', 'Apri Repository GitHub')}
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>GitHub</span>
        </a>
      </div>
    </div>
  )
}
