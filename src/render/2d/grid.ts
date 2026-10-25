import { toCanvas } from './utils'

export function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number) {
  const cx = w / 2, cy = h / 2
  ctx.save()
  ctx.strokeStyle = '#3a3f4d'
  ctx.lineWidth = 1
  // original grid lines
  for (let i = -10; i <= 10; i++) {
    const [x1, y1] = toCanvas(ctx, i, -10, scale, cx, cy)
    const [x2, y2] = toCanvas(ctx, i, 10, scale, cx, cy)
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke()
    const [x3, y3] = toCanvas(ctx, -10, i, scale, cx, cy)
    const [x4, y4] = toCanvas(ctx, 10, i, scale, cx, cy)
    ctx.beginPath(); ctx.moveTo(x3,y3); ctx.lineTo(x4,y4); ctx.stroke()
  }
  // axes
  ctx.strokeStyle = '#9aa0b4'
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke()
  ctx.restore()
}
export function drawDeformedGrid(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number, matrix: number[][]) {
  const cx = w / 2, cy = h / 2
  ctx.save()
  ctx.strokeStyle = '#60a5fa'
  ctx.lineWidth = 1
  for (let i = -10; i <= 10; i++) {
    // line along direction? draw grid lines transformed roughly by applying to grid points along basis directions
    // transform (i, s) for s in [-10,10]
    ctx.beginPath()
    for (let s = -10; s <= 10; s += 0.5) {
      const px = matrix[0][0] * i + matrix[0][1] * s
      const py = matrix[1][0] * i + matrix[1][1] * s
      const [x, y] = toCanvas(ctx, px, py, scale, cx, cy)
      if (s === -10) ctx.moveTo(x,y); else ctx.lineTo(x,y)
    }
    ctx.stroke()
    ctx.beginPath()
    for (let s = -10; s <= 10; s += 0.5) {
      const px = matrix[0][0] * s + matrix[0][1] * i
      const py = matrix[1][0] * s + matrix[1][1] * i
      const [x, y] = toCanvas(ctx, px, py, scale, cx, cy)
      if (s === -10) ctx.moveTo(x,y); else ctx.lineTo(x,y)
    }
    ctx.stroke()
  }
  ctx.restore()
}
