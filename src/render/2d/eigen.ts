import { toCanvas } from './utils'
import { isRealComplex } from '../../lib/numerics'

export function drawEigenlines(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number, eigenvalues: any[], eigenvectors: number[][] | null) {
  if (!eigenvectors || eigenvectors.length === 0) return
  const cx = w / 2, cy = h / 2
  ctx.save()
  ctx.strokeStyle = '#22d3ee'
  ctx.setLineDash([4, 4])
  eigenvectors.forEach((ev, i) => {
    const val = eigenvalues[i]
    if (val && !isRealComplex(val)) return // skip purely non-real
    const v = ev
    const len = Math.hypot(v[0], v[1])
    if (len < 1e-12) return
    // normalize direction
    const d = [v[0] / len, v[1] / len]
    const [x1, y1] = toCanvas(ctx, -d[0] * 5, -d[1] * 5, scale, cx, cy)
    const [x2, y2] = toCanvas(ctx, d[0] * 5, d[1] * 5, scale, cx, cy)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  })
  ctx.setLineDash([])
  ctx.restore()
}
