import { toCanvas } from './utils'

export function drawVector(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number, v: [number, number], color: string) {
  const cx = w / 2, cy = h / 2
  const [x, y] = toCanvas(ctx, v[0], v[1], scale, cx, cy)
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(x, y)
  ctx.stroke()
  // arrowhead
  const ang = Math.atan2(cy - y, x - cx)
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x - 6 * Math.cos(ang - Math.PI / 6), y + 6 * Math.sin(ang - Math.PI / 6))
  ctx.lineTo(x - 6 * Math.cos(ang + Math.PI / 6), y + 6 * Math.sin(ang + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}
