import { useEffect, useMemo, useRef, useState } from 'react'
import Layout from './components/Layout'
import Sidebar from './components/Sidebar'
import Canvas2D from './components/Canvas2D'
import Canvas3D from './components/Canvas3D'
import type { LayerVisibility, Mode } from './types/math'
import { cloneMatrix, computeMetrics, interpolateMatrix } from './lib/mathEngine'
import { PRESETS_2D, PRESETS_3D, type MatrixPreset } from './lib/presets'

export default function App() {
  const [mode, setMode] = useState<Mode>('2d')
  const [matrix2, setMatrix2] = useState<number[][]>(() => [
    [1, 1.2],
    [0, 1],
  ])
  const [matrix3, setMatrix3] = useState<number[][]>(() => [
    [1.8, 0, 0],
    [0, 1.1, 0],
    [0, 0, 0.5],
  ])
  const [activePreset2, setActivePreset2] = useState<string | null>('shear')
  const [activePreset3, setActivePreset3] = useState<string | null>('scaling-3d')

  const [vector2, setVector2] = useState<[number, number]>([1, 0.8])
  const [vector3, setVector3] = useState<[number, number, number]>([1, 1, 0.8])

  const [t, setT] = useState<number>(1)
  const [morphPlaying, setMorphPlaying] = useState<boolean>(false)

  const [powerMode, setPowerMode] = useState<boolean>(false)
  const [powerK, setPowerK] = useState<number>(0)
  const [powerPlaying, setPowerPlaying] = useState<boolean>(false)
  const [powerInterval, setPowerInterval] = useState<number>(420)
  const [normalizePower, setNormalizePower] = useState<boolean>(false)

  const [layers, setLayers] = useState<LayerVisibility>({
    baseGrid: true,
    warpedGrid: true,
    unitArea: true,
    svdCircle: true,
    eigenLines: true,
    vectors: true,
    trajectory: true,
  })

  // Continuous Morph M(t) animation via requestAnimationFrame
  const morphLastTimeRef = useRef<number | null>(null)
  useEffect(() => {
    if (!morphPlaying) {
      morphLastTimeRef.current = null
      return
    }
    let rafId = 0
    const step = (now: number) => {
      if (morphLastTimeRef.current === null) {
        morphLastTimeRef.current = now
      }
      const dt = (now - morphLastTimeRef.current) / 1000
      morphLastTimeRef.current = now
      setT((prev) => {
        const next = prev + dt * 0.45
        if (next >= 1) {
          setMorphPlaying(false)
          return 1
        }
        return next
      })
      rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [morphPlaying])

  // Discrete Power Iteration v_k = A^k v via requestAnimationFrame scheduler
  const powerLastTickRef = useRef<number | null>(null)
  useEffect(() => {
    if (!powerMode || !powerPlaying) {
      powerLastTickRef.current = null
      return
    }
    let rafId = 0
    const tick = (now: number) => {
      if (powerLastTickRef.current === null) {
        powerLastTickRef.current = now
      }
      if (now - powerLastTickRef.current >= powerInterval) {
        powerLastTickRef.current = now
        setPowerK((prev) => {
          if (prev >= 24) {
            setPowerPlaying(false)
            return prev
          }
          return prev + 1
        })
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [powerMode, powerPlaying, powerInterval])

  const baseMatrix = mode === '2d' ? matrix2 : matrix3

  const interpolatedMatrix = useMemo(() => {
    if (powerMode || Math.abs(t - 1) < 1e-5) return baseMatrix
    return interpolateMatrix(baseMatrix, t)
  }, [baseMatrix, t, powerMode])

  // Dashboard metrics always reflect the operator matrix A
  const metrics = useMemo(() => computeMetrics(baseMatrix), [baseMatrix])

  const presets = mode === '2d' ? PRESETS_2D : PRESETS_3D
  const activePresetId = mode === '2d' ? activePreset2 : activePreset3

  const handleSelectPreset = (preset: MatrixPreset) => {
    setMorphPlaying(false)
    setPowerPlaying(false)
    setPowerK(0)
    setT(1)
    if (mode === '2d') {
      setMatrix2(cloneMatrix(preset.matrix))
      setActivePreset2(preset.id)
    } else {
      setMatrix3(cloneMatrix(preset.matrix))
      setActivePreset3(preset.id)
    }
  }

  const toggleLayer = (key: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Layout
      sidebar={
        <Sidebar
          mode={mode}
          setMode={(nextMode) => {
            setMorphPlaying(false)
            setPowerPlaying(false)
            setMode(nextMode)
          }}
          matrix2={matrix2}
          matrix3={matrix3}
          setMatrix2={(m) => {
            setActivePreset2(null)
            setMatrix2(m)
          }}
          setMatrix3={(m) => {
            setActivePreset3(null)
            setMatrix3(m)
          }}
          vector2={vector2}
          vector3={vector3}
          setVector2={setVector2}
          setVector3={setVector3}
          presets={presets}
          activePresetId={activePresetId}
          onSelectPreset={handleSelectPreset}
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
          metrics={metrics}
        />
      }
    >
      {/* Top Floating Layer Toggles HUD */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 shadow-xl pointer-events-auto">
          {(
            [
              ['baseGrid', 'Base Grid', 'text-slate-300'],
              ['warpedGrid', 'Warped Space', 'text-sky-300'],
              ['unitArea', mode === '2d' ? 'Area |det|' : 'Vol |det|', 'text-emerald-300'],
              ['svdCircle', mode === '2d' ? 'SVD Ellipse' : 'SVD Ellipsoid', 'text-purple-300'],
              ['eigenLines', 'Eigenvectors', 'text-teal-300'],
              ['vectors', 'Vectors v & Av', 'text-rose-300'],
              ['trajectory', powerMode ? 'Orbit Aᵏv' : 'Trajectory', 'text-amber-300'],
            ] as const
          ).map(([key, label, activeColor]) => {
            const active = layers[key]
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => toggleLayer(key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                  active
                    ? `bg-slate-800/90 border-slate-600/80 ${activeColor}`
                    : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {mode === '2d' ? (
        <Canvas2D
          baseMatrix={matrix2}
          interpolatedMatrix={interpolatedMatrix}
          t={t}
          vector={vector2}
          onVectorChange={setVector2}
          onMatrixChange={(m) => {
            setActivePreset2(null)
            setMatrix2(m)
          }}
          metrics={metrics}
          powerMode={powerMode}
          powerK={powerK}
          normalizePower={normalizePower}
          layers={layers}
        />
      ) : (
        <Canvas3D
          baseMatrix={matrix3}
          interpolatedMatrix={interpolatedMatrix}
          t={t}
          vector={vector3}
          metrics={metrics}
          powerMode={powerMode}
          powerK={powerK}
          normalizePower={normalizePower}
          layers={layers}
        />
      )}
    </Layout>
  )
}
