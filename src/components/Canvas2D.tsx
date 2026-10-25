import { useEffect, useRef } from 'react'
import { drawGrid, drawDeformedGrid } from '../render/2d/grid'
import { drawCircle, drawEllipseFromSVD } from '../render/2d/circleEllipse'
import { drawVector } from '../render/2d/vector'
import { drawEigenlines } from '../render/2d/eigen'
import { drawTrajectory } from '../render/2d/trajectory'
import { apply2 } from '../lib/matrix'
import type { Metrics } from '../types/math'

export default function Canvas2D({
  matrix,
  vector,
  metrics,
  powerMode,
  powerK,
}: {
  matrix: number[][]
  vector: [number, number]
  metrics: Metrics
  powerMode: boolean
  powerK: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    const render = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const w = rect.width, h = rect.height
      ctx.clearRect(0, 0, w, h)
      const scale = 40
      drawGrid(ctx, w, h, scale)
      drawDeformedGrid(ctx, w, h, scale, matrix)
      drawCircle(ctx, w, h, scale)
      if (metrics.singularValues.length >= 2) {
        drawEllipseFromSVD(ctx, w, h, scale, Math.abs(metrics.singularValues[0]), Math.abs(metrics.singularValues[1]))
      }
      drawEigenlines(ctx, w, h, scale, metrics.eigenvalues, metrics.eigenvectors)
      const Av = apply2(matrix, vector)
      drawVector(ctx, w, h, scale, vector, '#60a5fa')
      drawVector(ctx, w, h, scale, Av, '#f87171')
      if (powerMode) {
        drawTrajectory(ctx, w, h, scale, matrix, vector, powerK)
      }
      raf = requestAnimationFrame(render)
    }
    render()
    return () => cancelAnimationFrame(raf)
  }, [matrix, vector, metrics, powerMode, powerK])

  return <canvas ref={ref} className="w-full h-full block" />
}
