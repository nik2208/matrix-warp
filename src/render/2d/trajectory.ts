import { toCanvas } from './utils'
import { apply2 } from '../../lib/matrix'

export function drawTrajectory(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number, matrix: number[][], v0: [number, number], k: number) {
  const cx = w / 2, cy = h / 2
  ctx.save()
  ctx.strokeStyle = '#a78bfa'
  ctx.lineWidth = 1
  let v: [number, number] = [...v0]
  ctx.beginPath()
  for (let i = 0; i <= k && i < 200; i++) {
    const [x, y] = toCanvas(ctx, v[0], v[1], scale, cx, cy)
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    v = apply2(matrix, v)
  }
  ctx.stroke()
  ctx.restore()
}
