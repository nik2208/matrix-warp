import { useEffect, useMemo, useState } from 'react'
import Layout from './components/Layout'
import Sidebar from './components/Sidebar'
import Canvas2D from './components/Canvas2D'
import Canvas3D from './components/Canvas3D'
import { identity2, identity3 } from './lib/utils'
import { computeMetrics2, computeMetrics3 } from './lib/metrics'
import { interpolate2, interpolate3 } from './lib/matrix'

export type Mode = '2d' | '3d'

const PRESETS2 = {
  Identity: identity2(),
  Rotation: [[0, -1], [1, 0]], // 90deg
  Scaling: [[2, 0], [0, 0.5]],
  Shear: [[1, 1], [0, 1]],
  Reflection: [[-1, 0], [0, 1]],
  Projection: [[1, 0], [0, 0]],
  Singular: [[1, 2], [2, 4]],
  'Ill-conditioned': [[1, 1], [1, 1.0001]],
}

const PRESETS3 = {
  Identity: identity3(),
  Scaling: [[2, 0, 0], [0, 0.5, 0], [0, 0, 1]],
  Shear: [[1, 1, 0], [0, 1, 0], [0, 0, 1]],
  Reflection: [[-1, 0, 0], [0, 1, 0], [0, 0, 1]],
  Projection: [[1, 0, 0], [0, 1, 0], [0, 0, 0]],
  Singular: [[1, 2, 3], [2, 4, 6], [0, 0, 1]],
  'Ill-conditioned': [[1, 1, 1], [1, 1.0001, 1], [1, 1, 1.0002]],
}

export default function App() {
  const [mode, setMode] = useState<Mode>('2d')
  const [matrix2, setMatrix2] = useState<number[][]>(identity2())
  const [matrix3, setMatrix3] = useState<number[][]>(identity3())
  const [vector2, setVector2] = useState<[number, number]>([1, 0])
  const [vector3, setVector3] = useState<[number, number, number]>([1, 0, 0])
  const [t, setT] = useState(1)
  const [powerMode, setPowerMode] = useState(false)
  const [powerK, setPowerK] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!powerMode || !playing) return
    const id = setInterval(() => {
      setPowerK((k) => k + 1)
    }, 400)
    return () => clearInterval(id)
  }, [powerMode, playing])

  const mat = useMemo(() => {
    if (mode === '2d') {
      if (powerMode) {
        // compute A^k * v conceptually handled in render; return matrix power approx not needed
        return matrix2
      }
      return interpolate2(matrix2, identity2(), t)
    } else {
      if (powerMode) return matrix3
      return interpolate3(matrix3, identity3(), t)
    }
  }, [mode, matrix2, matrix3, t, powerMode])

  const metrics = useMemo(() => {
    if (mode === '2d') return computeMetrics2(mat)
    return computeMetrics3(mat)
  }, [mode, mat])

  const presets = mode === '2d' ? PRESETS2 : PRESETS3

  return (
    <Layout sidebar={
      <Sidebar
        mode={mode}
        setMode={setMode}
        matrix2={matrix2}
        matrix3={matrix3}
        setMatrix2={setMatrix2}
        setMatrix3={setMatrix3}
        vector2={vector2}
        vector3={vector3}
        setVector2={setVector2}
        setVector3={setVector3}
        presets={presets}
        t={t}
        setT={setT}
        powerMode={powerMode}
        setPowerMode={setPowerMode}
        powerK={powerK}
        setPowerK={setPowerK}
        playing={playing}
        setPlaying={setPlaying}
        metrics={metrics}
      />
    }>
      {mode === '2d' ? (
        <Canvas2D matrix={mat} vector={vector2} metrics={metrics} powerMode={powerMode} powerK={powerK} />
      ) : (
        <Canvas3D matrix={mat} vector={vector3} metrics={metrics} powerMode={powerMode} powerK={powerK} />
      )}
    </Layout>
  )
}
