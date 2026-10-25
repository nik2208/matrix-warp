import { toCanvas } from './utils'

export function drawCircle(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number) {
  const cx = w / 2, cy = h / 2
  ctx.save()
  ctx.strokeStyle = '#94a3b8'
  ctx.beginPath()
  ctx.arc(cx, cy, 1 * scale, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}
export function drawEllipseFromSVD(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number, s1: number, s2: number) {
  const cx = w / 2, cy = h / 2
  ctx.save()
  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  // draw ellipse x = s1*cosθ, y = s2*sinθ (axis aligned approximation for visualization)
  for (let θ = 0; θ <= Math.PI * 2 + 0.01; θ += 0.05) {
    const x = s1 * Math.cos(θ)
    const y = s2 * Math.sin(θ)
    const [px, py] = toCanvas(ctx, x, y, scale, cx, cy)
    if (θ === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.stroke()
  ctx.restore()
}
