import ModeToggle from './ModeToggle'
import MatrixInput from './MatrixInput'
import VectorInput from './VectorInput'
import ControlsTime from './ControlsTime'
import MetricsPanel from './MetricsPanel'

export default function Sidebar(props: any) {
  const { mode, setMode, matrix2, matrix3, setMatrix2, setMatrix3, vector2, vector3, setVector2, setVector3, presets, t, setT, powerMode, setPowerMode, powerK, setPowerK, playing, setPlaying, metrics } = props

  const applyPreset = (key: string) => {
    if (!key) return
    if (mode === '2d' && presets[key]) setMatrix2(presets[key].map((r: any) => [...r]))
    if (mode === '3d' && presets[key]) setMatrix3(presets[key].map((r: any) => [...r]))
  }

  return (
    <div className="p-3 space-y-4">
      <div className="text-lg font-semibold">Linear Transformation Visualizer</div>
      <ModeToggle mode={mode} setMode={setMode} />
      {mode === '2d' ? (
        <>
          <MatrixInput dim={2} matrix={matrix2} setMatrix={setMatrix2} presets={presets} onApplyPreset={applyPreset} />
          <VectorInput dim={2} vector={vector2} setVector={setVector2} />
        </>
      ) : (
        <>
          <MatrixInput dim={3} matrix={matrix3} setMatrix={setMatrix3} presets={presets} onApplyPreset={applyPreset} />
          <VectorInput dim={3} vector={vector3} setVector={setVector3} />
        </>
      )}
      <ControlsTime
        t={t}
        setT={setT}
        powerMode={powerMode}
        setPowerMode={setPowerMode}
        powerK={powerK}
        setPowerK={setPowerK}
        playing={playing}
        setPlaying={setPlaying}
      />
      <MetricsPanel metrics={metrics} />
    </div>
  )
}
