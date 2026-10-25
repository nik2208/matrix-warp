import { useEffect, useMemo, useRef, useState } from 'react'
import Layout from './components/Layout'
import Sidebar from './components/Sidebar'
import Canvas2D from './components/Canvas2D'
import Canvas3D from './components/Canvas3D'
import type { IterativeMethodId, LayerVisibility, Mode } from './types/math'
import {
  cloneMatrix,
  computeLpMetrics,
  computeMetrics,
  interpolateMatrix,
} from './lib/mathEngine'
import { solveLinearSystem } from './lib/linearSolver'
import { PRESETS_2D, PRESETS_3D, type MatrixPreset } from './lib/presets'
import { useI18n } from './lib/i18n'

export default function App() {
  const { tr } = useI18n()
  const [mode, setMode] = useState<Mode>('2d')
  const [matrix2, setMatrix2] = useState<number[][]>(() => [
    [2, 0.8],
    [0.5, 1.4],
  ])
  const [matrix3, setMatrix3] = useState<number[][]>(() => [
    [2.0, 0.4, 0],
    [0.4, 1.5, 0.3],
    [0, 0.3, 1.1],
  ])
  const [activePreset2, setActivePreset2] = useState<string | null>(null)
  const [activePreset3, setActivePreset3] = useState<string | null>(null)

  const [vector2, setVector2] = useState<[number, number]>([1, 0.8])
  const [vector3, setVector3] = useState<[number, number, number]>([1, 1, 0.8])

  // Target vector b for Ax = b
  const [b2, setB2] = useState<[number, number]>([2, 1.2])
  const [b3, setB3] = useState<[number, number, number]>([2, 1.5, 1])

  // Continuous Lp norm slider (1..10, where > 10 represents Infinity)
  const [pSlider, setPSlider] = useState<number>(2)

  // Iterative solver parameters & animation
  const [sorOmega, setSorOmega] = useState<number>(1.25)
  const [iterStep, setIterStep] = useState<number>(12)
  const [iterPlaying, setIterPlaying] = useState<boolean>(false)
  const [enabledMethods, setEnabledMethods] = useState<Record<IterativeMethodId, boolean>>({
    jacobi: true,
    'gauss-seidel': true,
    sor: true,
    cg: true,
  })

  // Continuous Morph M(t) & Power Iteration A^k v
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
    lpBall: true,
    eigenLines: true,
    vectors: true,
    trajectory: true,
    rowPlanes: false,
    colPicture: false,
    iterativePaths: false,
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

  // Discrete Power Iteration v_k = A^k v scheduler
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

  // Iterative solver step k animation scheduler
  const iterLastTickRef = useRef<number | null>(null)
  useEffect(() => {
    if (!iterPlaying) {
      iterLastTickRef.current = null
      return
    }
    let rafId = 0
    const tick = (now: number) => {
      if (iterLastTickRef.current === null) {
        iterLastTickRef.current = now
      }
      if (now - iterLastTickRef.current >= 320) {
        iterLastTickRef.current = now
        setIterStep((prev) => {
          if (prev >= 25) {
            setIterPlaying(false)
            return prev
          }
          return prev + 1
        })
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [iterPlaying])

  const baseMatrix = mode === '2d' ? matrix2 : matrix3
  const activeVector = mode === '2d' ? vector2 : vector3
  const activeB = mode === '2d' ? b2 : b3
  const actualP = pSlider > 10 ? Infinity : pSlider

  const interpolatedMatrix = useMemo(() => {
    if (powerMode || Math.abs(t - 1) < 1e-5) return baseMatrix
    return interpolateMatrix(baseMatrix, t)
  }, [baseMatrix, t, powerMode])

  const metrics = useMemo(() => computeMetrics(baseMatrix), [baseMatrix])

  const lpMetrics = useMemo(
    () => computeLpMetrics(baseMatrix, activeVector, activeB, actualP),
    [baseMatrix, activeVector, activeB, actualP]
  )

  const solution = useMemo(
    () =>
      solveLinearSystem(
        baseMatrix,
        activeB,
        metrics,
        mode === '2d' ? [0, 0] : [0, 0, 0],
        sorOmega,
        25
      ),
    [baseMatrix, activeB, metrics, mode, sorOmega]
  )

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

  const toggleIterativeMethod = (id: IterativeMethodId) => {
    setEnabledMethods((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <Layout
      sidebar={
        <Sidebar
          mode={mode}
          setMode={(nextMode) => {
            setMorphPlaying(false)
            setPowerPlaying(false)
            setIterPlaying(false)
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
          b2={b2}
          b3={b3}
          setB2={setB2}
          setB3={setB3}
          pSlider={pSlider}
          setPSlider={setPSlider}
          lpMetrics={lpMetrics}
          showLpBall={layers.lpBall}
          onToggleLpBall={() => toggleLayer('lpBall')}
          solution={solution}
          sorOmega={sorOmega}
          setSorOmega={setSorOmega}
          iterStep={iterStep}
          setIterStep={setIterStep}
          iterPlaying={iterPlaying}
          setIterPlaying={(v) => {
            if (v) {
              setLayers((prev) => ({ ...prev, iterativePaths: true }))
            }
            setIterPlaying(v)
          }}
          enabledMethods={enabledMethods}
          onToggleMethod={toggleIterativeMethod}
          showRowPlanes={layers.rowPlanes}
          onToggleRowPlanes={() => toggleLayer('rowPlanes')}
          showColPicture={layers.colPicture}
          onToggleColPicture={() => toggleLayer('colPicture')}
          showIterativePaths={layers.iterativePaths}
          onToggleIterativePaths={() => toggleLayer('iterativePaths')}
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
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 shadow-xl pointer-events-auto">
          {(
            [
              ['baseGrid', tr('Base Grid', 'Griglia Base'), 'text-slate-300'],
              ['warpedGrid', tr('Warped Space', 'Spazio Deformato'), 'text-sky-300'],
              ['unitArea', mode === '2d' ? 'Area |det|' : 'Vol |det|', 'text-emerald-300'],
              [
                'svdCircle',
                mode === '2d'
                  ? tr('SVD Ellipse', 'Ellisse SVD')
                  : tr('SVD Ellipsoid', 'Ellissoide SVD'),
                'text-purple-300',
              ],
              ['lpBall', tr(`L_${lpMetrics.pLabel} Ball`, `Palla L_${lpMetrics.pLabel}`), 'text-indigo-300'],
              ['eigenLines', tr('Eigen & ρ(A)', 'Autovettori & ρ(A)'), 'text-teal-300'],
              [
                'rowPlanes',
                mode === '2d'
                  ? tr('Row Lines', 'Rette Righe')
                  : tr('Row Planes', 'Piani Righe'),
                'text-amber-300',
              ],
              ['colPicture', tr('Col Picture (b)', 'Comb. Colonne (b)'), 'text-fuchsia-300'],
              ['iterativePaths', tr('Iter Paths x⁽ᵏ⁾', 'Traiettorie x⁽ᵏ⁾'), 'text-cyan-300'],
              ['vectors', tr('Vectors v & Av', 'Vettori v & Av'), 'text-rose-300'],
              [
                'trajectory',
                powerMode
                  ? tr('Orbit Aᵏv', 'Orbita Aᵏv')
                  : tr('Trajectory', 'Traiettoria'),
                'text-orange-300',
              ],
            ] as const
          ).map(([key, label, activeColor]) => {
            const active = layers[key]
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => toggleLayer(key)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition ${
                  active
                    ? `bg-slate-800/95 border-slate-600/80 ${activeColor}`
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
          bVector={b2}
          onVectorChange={setVector2}
          onBVectorChange={setB2}
          onMatrixChange={(m) => {
            setActivePreset2(null)
            setMatrix2(m)
          }}
          metrics={metrics}
          lpMetrics={lpMetrics}
          solution={solution}
          iterStep={iterStep}
          enabledMethods={enabledMethods}
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
          bVector={b3}
          metrics={metrics}
          lpMetrics={lpMetrics}
          solution={solution}
          iterStep={iterStep}
          enabledMethods={enabledMethods}
          powerMode={powerMode}
          powerK={powerK}
          normalizePower={normalizePower}
          layers={layers}
        />
      )}
    </Layout>
  )
}
