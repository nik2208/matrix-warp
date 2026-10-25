import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  IterativeMethodId,
  LayerVisibility,
  LinearSystemSolution,
  LpMetrics,
  Metrics,
} from '../types/math'
import {
  applyMatrix,
  computePowerOrbit,
  computeSVD,
  det2,
  formatNum,
  sampleLpUnitBall2D,
} from '../lib/mathEngine'
import { useI18n } from '../lib/i18n'

interface Canvas2DProps {
  baseMatrix: number[][]
  interpolatedMatrix: number[][]
  t: number
  vector: [number, number]
  onVectorChange: (v: [number, number]) => void
  bVector: [number, number]
  onBVectorChange: (b: [number, number]) => void
  onMatrixChange: (m: number[][]) => void
  metrics: Metrics
  lpMetrics: LpMetrics
  solution: LinearSystemSolution
  iterStep: number
  enabledMethods: Record<IterativeMethodId, boolean>
  powerMode: boolean
  powerK: number
  normalizePower: boolean
  layers: LayerVisibility
}

type DragTarget = 'none' | 'pan' | 'vector' | 'bvec' | 'col1' | 'col2'

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth = 2.5,
  headSize = 10,
  dashed = false
) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len < 1) return

  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = lineWidth
  if (dashed) ctx.setLineDash([5, 4])

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()

  if (len >= 4) {
    const angle = Math.atan2(dy, dx)
    const h = Math.min(headSize, len * 0.45)
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - h * Math.cos(angle - Math.PI / 6), y2 - h * Math.sin(angle - Math.PI / 6))
    ctx.lineTo(x2 - h * Math.cos(angle + Math.PI / 6), y2 - h * Math.sin(angle + Math.PI / 6))
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

function drawPillLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  textColor: string,
  bgColor = 'rgba(15, 23, 42, 0.88)',
  borderColor = 'rgba(148, 163, 184, 0.25)'
) {
  ctx.save()
  ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
  const m = ctx.measureText(text)
  const padX = 6
  const w = m.width + padX * 2
  const h = 18
  const rx = x - w / 2
  const ry = y - h / 2

  ctx.fillStyle = bgColor
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(rx, ry, w, h, 5)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = textColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y + 0.5)
  ctx.restore()
}

/**
 * Draw an infinite 2D line a*x + b*y = c clipped to world extent [-R, R]
 */
function getLineEndpoints2D(
  a: number,
  b: number,
  c: number,
  R = 20
): [[number, number], [number, number]] | null {
  const norm = Math.hypot(a, b)
  if (norm < 1e-10) return null
  // Closest point to origin on line
  const x0 = (a * c) / (norm * norm)
  const y0 = (b * c) / (norm * norm)
  // Unit tangent (-b, a)/norm
  const tx = -b / norm
  const ty = a / norm
  return [
    [x0 - tx * R, y0 - ty * R],
    [x0 + tx * R, y0 + ty * R],
  ]
}

export default function Canvas2D({
  baseMatrix,
  interpolatedMatrix,
  t,
  vector,
  onVectorChange,
  bVector,
  onBVectorChange,
  onMatrixChange,
  metrics,
  lpMetrics,
  solution,
  iterStep,
  enabledMethods,
  powerMode,
  powerK,
  normalizePower,
  layers,
}: Canvas2DProps) {
  const { tr } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scale, setScale] = useState<number>(68)
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [dragTarget, setDragTarget] = useState<DragTarget>('none')
  const [hoverTarget, setHoverTarget] = useState<DragTarget>('none')
  const [mouseWorld, setMouseWorld] = useState<[number, number] | null>(null)
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number }>({
    x: 0,
    y: 0,
    ox: 0,
    oy: 0,
  })

  const toScreen = useCallback(
    (wx: number, wy: number, width: number, height: number): [number, number] => {
      const cx = width / 2 + offset.x
      const cy = height / 2 + offset.y
      return [cx + wx * scale, cy - wy * scale]
    },
    [offset, scale]
  )

  const toWorld = useCallback(
    (sx: number, sy: number, width: number, height: number): [number, number] => {
      const cx = width / 2 + offset.x
      const cy = height / 2 + offset.y
      return [(sx - cx) / scale, (cy - sy) / scale]
    },
    [offset, scale]
  )

  const renderScene = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    if (w === 0 || h === 0) return

    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const [ox, oy] = toScreen(0, 0, w, h)
    const bgGrad = ctx.createRadialGradient(ox, oy, 10, ox, oy, Math.max(w, h) * 0.75)
    bgGrad.addColorStop(0, '#0f172a')
    bgGrad.addColorStop(1, '#060a12')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, w, h)

    const gridRange = 16
    const activeMat = interpolatedMatrix

    // 1. BASE CARTESIAN GRID
    if (layers.baseGrid) {
      ctx.save()
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)'
      for (let i = -gridRange; i <= gridRange; i++) {
        const [x1, y1] = toScreen(i, -gridRange, w, h)
        const [x2, y2] = toScreen(i, gridRange, w, h)
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        const [hx1, hy1] = toScreen(-gridRange, i, w, h)
        const [hx2, hy2] = toScreen(gridRange, i, w, h)
        ctx.beginPath()
        ctx.moveTo(hx1, hy1)
        ctx.lineTo(hx2, hy2)
        ctx.stroke()
      }

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(0, oy)
      ctx.lineTo(w, oy)
      ctx.moveTo(ox, 0)
      ctx.lineTo(ox, h)
      ctx.stroke()

      ctx.fillStyle = 'rgba(148, 163, 184, 0.45)'
      ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace'
      const step = scale < 35 ? 2 : 1
      for (let i = -gridRange; i <= gridRange; i += step) {
        if (i === 0) continue
        const [tx] = toScreen(i, 0, w, h)
        if (tx > 20 && tx < w - 20 && oy > 15 && oy < h - 15) {
          ctx.textAlign = 'center'
          ctx.fillText(String(i), tx, oy + 14)
        }
        const [, yy] = toScreen(0, i, w, h)
        if (yy > 20 && yy < h - 20 && ox > 15 && ox < w - 25) {
          ctx.textAlign = 'left'
          ctx.fillText(String(i), ox + 6, yy + 3)
        }
      }
      ctx.restore()
    }

    // 2. EXPLICIT DETERMINANT GEOMETRY: Unit Square [0,1]^2 vs Transformed Parallelogram
    const e1 = applyMatrix(activeMat, [1, 0])
    const e2 = applyMatrix(activeMat, [0, 1])
    const e12 = [e1[0] + e2[0], e1[1] + e2[1]]
    const currentDet = det2(activeMat)

    if (layers.unitArea) {
      // Original Reference Unit Square [0,1]^2 (Area = 1)
      const [u0x, u0y] = toScreen(0, 0, w, h)
      const [u1x, u1y] = toScreen(1, 0, w, h)
      const [u12x, u12y] = toScreen(1, 1, w, h)
      const [u2x, u2y] = toScreen(0, 1, w, h)

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(u0x, u0y)
      ctx.lineTo(u1x, u1y)
      ctx.lineTo(u12x, u12y)
      ctx.lineTo(u2x, u2y)
      ctx.closePath()
      ctx.fillStyle = 'rgba(148, 163, 184, 0.05)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)'
      ctx.setLineDash([3, 3])
      ctx.lineWidth = 1.2
      ctx.stroke()
      ctx.restore()

      // Transformed Parallelogram spanned by Ae1, Ae2
      const [p0x, p0y] = toScreen(0, 0, w, h)
      const [p1x, p1y] = toScreen(e1[0], e1[1], w, h)
      const [p12x, p12y] = toScreen(e12[0], e12[1], w, h)
      const [p2x, p2y] = toScreen(e2[0], e2[1], w, h)

      const isFlipped = currentDet < -1e-9
      const isCollapsed = Math.abs(currentDet) <= 1e-9

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(p0x, p0y)
      ctx.lineTo(p1x, p1y)
      ctx.lineTo(p12x, p12y)
      ctx.lineTo(p2x, p2y)
      ctx.closePath()

      ctx.fillStyle = isCollapsed
        ? 'rgba(251, 191, 36, 0.14)'
        : isFlipped
          ? 'rgba(244, 63, 94, 0.18)'
          : 'rgba(16, 185, 129, 0.16)'
      ctx.fill()

      ctx.strokeStyle = isCollapsed
        ? 'rgba(251, 191, 36, 0.7)'
        : isFlipped
          ? 'rgba(244, 63, 94, 0.65)'
          : 'rgba(16, 185, 129, 0.6)'
      ctx.lineWidth = 1.6
      ctx.setLineDash([5, 3])
      ctx.stroke()

      // Orientation arc from Ae1 to Ae2 showing sign(det(A))
      if (!isCollapsed) {
        const ang1 = Math.atan2(p1y - p0y, p1x - p0x)
        const ang2 = Math.atan2(p2y - p0y, p2x - p0x)
        const arcR = Math.min(28, scale * 0.38)
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.arc(p0x, p0y, arcR, ang1, ang2, !isFlipped)
        ctx.strokeStyle = isFlipped ? '#fb7185' : '#34d399'
        ctx.lineWidth = 2
        ctx.stroke()
      }
      ctx.restore()

      const [cx, cy] = toScreen(e12[0] * 0.5, e12[1] * 0.5, w, h)
      if (Math.hypot(e12[0], e12[1]) > 0.2) {
        drawPillLabel(
          ctx,
          `det(A) = ${formatNum(currentDet, 2)} (${isFlipped ? 'Flipped −' : 'Area +'}${formatNum(Math.abs(currentDet), 2)})`,
          cx,
          cy,
          isCollapsed ? '#fbbf24' : isFlipped ? '#fda4af' : '#6ee7b7'
        )
      }
    }

    // 3. WARPED SPACE GRID & BASIS VECTORS
    if (layers.warpedGrid) {
      ctx.save()
      for (let i = -gridRange; i <= gridRange; i++) {
        const isAxis = i === 0
        const a1 = applyMatrix(activeMat, [i, -gridRange])
        const a2 = applyMatrix(activeMat, [i, gridRange])
        const [sx1, sy1] = toScreen(a1[0], a1[1], w, h)
        const [sx2, sy2] = toScreen(a2[0], a2[1], w, h)
        ctx.strokeStyle = isAxis ? 'rgba(56, 189, 248, 0.4)' : 'rgba(56, 189, 248, 0.13)'
        ctx.lineWidth = isAxis ? 1.6 : 1
        ctx.beginPath()
        ctx.moveTo(sx1, sy1)
        ctx.lineTo(sx2, sy2)
        ctx.stroke()

        const b1 = applyMatrix(activeMat, [-gridRange, i])
        const b2 = applyMatrix(activeMat, [gridRange, i])
        const [tx1, ty1] = toScreen(b1[0], b1[1], w, h)
        const [tx2, ty2] = toScreen(b2[0], b2[1], w, h)
        ctx.beginPath()
        ctx.moveTo(tx1, ty1)
        ctx.lineTo(tx2, ty2)
        ctx.stroke()
      }
      ctx.restore()

      const [e1x, e1y] = toScreen(e1[0], e1[1], w, h)
      const [e2x, e2y] = toScreen(e2[0], e2[1], w, h)

      drawArrow(ctx, ox, oy, e1x, e1y, '#10b981', 2.8, 10)
      drawArrow(ctx, ox, oy, e2x, e2y, '#f59e0b', 2.8, 10)

      if (Math.abs(t - 1) < 1e-3 && !powerMode) {
        for (const [pt, color, active] of [
          [[e1x, e1y], '#10b981', hoverTarget === 'col1' || dragTarget === 'col1'],
          [[e2x, e2y], '#f59e0b', hoverTarget === 'col2' || dragTarget === 'col2'],
        ] as const) {
          ctx.save()
          ctx.beginPath()
          ctx.arc(pt[0], pt[1], active ? 7 : 4.5, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.fill()
          ctx.lineWidth = 2
          ctx.strokeStyle = '#0f172a'
          ctx.stroke()
          ctx.restore()
        }
      }

      if (Math.hypot(e1[0], e1[1]) > 0.15) {
        drawPillLabel(ctx, 'Ae₁', e1x + 18, e1y - 12, '#34d399')
      }
      if (Math.hypot(e2[0], e2[1]) > 0.15) {
        drawPillLabel(ctx, 'Ae₂', e2x + 18, e2y - 12, '#fbbf24')
      }
    }

    // 4. SVD UNIT CIRCLE -> ELLIPSE & PRINCIPAL AXES (Plus Condition Number κ₂)
    if (layers.svdCircle) {
      ctx.save()
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
      ctx.lineWidth = 1.3
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(ox, oy, scale, 0, Math.PI * 2)
      ctx.stroke()

      ctx.setLineDash([])
      ctx.strokeStyle = '#c084fc'
      ctx.fillStyle = 'rgba(192, 132, 252, 0.06)'
      ctx.lineWidth = 2.2
      ctx.beginPath()
      const segments = 120
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2
        const pt = applyMatrix(activeMat, [Math.cos(theta), Math.sin(theta)])
        const [sx, sy] = toScreen(pt[0], pt[1], w, h)
        if (i === 0) ctx.moveTo(sx, sy)
        else ctx.lineTo(sx, sy)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      const activeSvd = computeSVD(activeMat)
      const s1 = activeSvd.singularValues[0] ?? 0
      const s2 = activeSvd.singularValues[1] ?? 0
      const u1 = activeSvd.uVectors[0] ?? [1, 0]
      const u2 = activeSvd.uVectors[1] ?? [0, 1]

      if (s1 > 1e-4) {
        const [u1x, u1y] = toScreen(u1[0] * s1, u1[1] * s1, w, h)
        drawArrow(ctx, ox, oy, u1x, u1y, '#e879f9', 2.2, 8, true)
        drawPillLabel(
          ctx,
          `σ₁=${formatNum(s1, 2)} (κ₂=${formatNum(metrics.cond, 2)})`,
          u1x + (u1[0] >= 0 ? 28 : -28),
          u1y - 10,
          '#f0abfc'
        )
      }
      if (s2 > 1e-4) {
        const [u2x, u2y] = toScreen(u2[0] * s2, u2[1] * s2, w, h)
        drawArrow(ctx, ox, oy, u2x, u2y, '#a855f7', 1.8, 7, true)
        drawPillLabel(ctx, `σ₂=${formatNum(s2, 2)}`, (ox + u2x) / 2, (oy + u2y) / 2, '#d8b4fe')
      }
      ctx.restore()
    }

    // 5. MINKOWSKI L_p UNIT BALL {||x||_p = 1}, TRANSFORMED A(B_p), AND NORM MAXIMIZER ||A||_p
    if (layers.lpBall) {
      const unitBallPts = sampleLpUnitBall2D(lpMetrics.p, 160)
      ctx.save()

      // Unit L_p ball ||x||_p = 1
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.55)'
      ctx.lineWidth = 1.6
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      unitBallPts.forEach(([bx, by], idx) => {
        const [sx, sy] = toScreen(bx, by, w, h)
        if (idx === 0) ctx.moveTo(sx, sy)
        else ctx.lineTo(sx, sy)
      })
      ctx.closePath()
      ctx.stroke()

      // L_p contour of radius ||v||_p passing through test vector v
      if (lpMetrics.vecNormV > 0.05) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)'
        ctx.lineWidth = 1.2
        ctx.setLineDash([2, 3])
        ctx.beginPath()
        unitBallPts.forEach(([bx, by], idx) => {
          const [sx, sy] = toScreen(
            bx * lpMetrics.vecNormV,
            by * lpMetrics.vecNormV,
            w,
            h
          )
          if (idx === 0) ctx.moveTo(sx, sy)
          else ctx.lineTo(sx, sy)
        })
        ctx.closePath()
        ctx.stroke()
      }

      // Transformed L_p ball { A x : ||x||_p = 1 }
      ctx.setLineDash([])
      ctx.strokeStyle = '#f472b6'
      ctx.fillStyle = 'rgba(244, 114, 182, 0.08)'
      ctx.lineWidth = 2.2
      ctx.beginPath()
      unitBallPts.forEach(([bx, by], idx) => {
        const ax = applyMatrix(activeMat, [bx, by])
        const [sx, sy] = toScreen(ax[0], ax[1], w, h)
        if (idx === 0) ctx.moveTo(sx, sy)
        else ctx.lineTo(sx, sy)
      })
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Induced Matrix Norm Maximizer Vector A * x_max
      const maxAx = lpMetrics.maximizerAx
      const [mx, my] = toScreen(maxAx[0], maxAx[1], w, h)
      drawArrow(ctx, ox, oy, mx, my, '#ec4899', 2.4, 9, true)
      drawPillLabel(
        ctx,
        `‖A‖_${lpMetrics.pLabel}=${formatNum(lpMetrics.matrixNormP, 2)} (κ_${lpMetrics.pLabel}=${formatNum(lpMetrics.condP, 2)})`,
        mx,
        my - 14,
        '#f9a8d4'
      )
      ctx.restore()
    }

    // 6. EIGENVALUES, EIGENVECTORS & SPECTRAL RADIUS CIRCLE ρ(A)
    if (layers.eigenLines) {
      ctx.save()
      // Spectral Radius Circle |x| = ρ(A)
      if (metrics.spectralRadius > 1e-4) {
        ctx.beginPath()
        ctx.arc(ox, oy, metrics.spectralRadius * scale, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)'
        ctx.setLineDash([6, 4])
        ctx.lineWidth = 1.5
        ctx.stroke()
        const [rx, ry] = toScreen(
          metrics.spectralRadius * Math.SQRT1_2,
          metrics.spectralRadius * Math.SQRT1_2,
          w,
          h
        )
        drawPillLabel(ctx, `ρ(A) = ${formatNum(metrics.spectralRadius, 2)}`, rx, ry, '#5eead4')
      }

      const realPairs = metrics.eigenPairs.filter((p) => p.isReal && p.vector !== null)
      realPairs.forEach((pair, idx) => {
        const ev = pair.vector!
        const lambda = pair.value.re
        const spanRadius = 25
        const [x1, y1] = toScreen(-ev[0] * spanRadius, -ev[1] * spanRadius, w, h)
        const [x2, y2] = toScreen(ev[0] * spanRadius, ev[1] * spanRadius, w, h)

        const color = idx === 0 ? '#2dd4bf' : '#38bdf8'
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.setLineDash([7, 5])
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        // Unit eigenvector e_i and scaled eigenvalue vector λ_i * e_i
        const [ex, ey] = toScreen(ev[0], ev[1], w, h)
        const [lex, ley] = toScreen(ev[0] * lambda, ev[1] * lambda, w, h)
        ctx.setLineDash([])
        drawArrow(ctx, ox, oy, ex, ey, color, 2.2, 8)
        if (Math.abs(lambda) > 1e-3) {
          drawArrow(ctx, ox, oy, lex, ley, '#facc15', 2.6, 10)
          drawPillLabel(
            ctx,
            `λ_${idx + 1}e_${idx + 1} (λ=${formatNum(lambda, 2)})`,
            lex + (ev[0] >= 0 ? 32 : -32),
            ley + (ev[1] >= 0 ? -16 : 16),
            '#fde047'
          )
        } else {
          drawPillLabel(
            ctx,
            `e_${idx + 1} (λ=0, ker A)`,
            ex + 28,
            ey - 14,
            color
          )
        }
      })
      ctx.restore()
    }

    // 7. ROW PICTURE LINES (a_11 x + a_12 y = b_1, a_21 x + a_22 y = b_2) & INTERSECTION x*
    if (layers.rowPlanes) {
      ctx.save()
      const lineColors = ['#22d3ee', '#fbbf24']
      for (let r = 0; r < 2; r++) {
        const a = baseMatrix[r][0]
        const b = baseMatrix[r][1]
        const c = bVector[r]
        const pts = getLineEndpoints2D(a, b, c, 24)
        if (pts) {
          const [p1x, p1y] = toScreen(pts[0][0], pts[0][1], w, h)
          const [p2x, p2y] = toScreen(pts[1][0], pts[1][1], w, h)
          ctx.strokeStyle = lineColors[r]
          ctx.lineWidth = 2.2
          ctx.setLineDash([8, 4])
          ctx.beginPath()
          ctx.moveTo(p1x, p1y)
          ctx.lineTo(p2x, p2y)
          ctx.stroke()

          // Label near closest point on line to origin
          const norm2 = a * a + b * b
          const lx = (a * c) / norm2
          const ly = (b * c) / norm2
          const [lsx, lsy] = toScreen(lx, ly, w, h)
          drawPillLabel(
            ctx,
            `Row ${r + 1}: ${formatNum(a, 1)}x + ${formatNum(b, 1)}y = ${formatNum(c, 1)}`,
            lsx + (r === 0 ? -36 : 36),
            lsy + (r === 0 ? -16 : 16),
            lineColors[r]
          )
        }
      }

      // Solution Intersection Point x*
      const xStar = solution.xExact
      const [xsx, xsy] = toScreen(xStar[0], xStar[1], w, h)
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.arc(xsx, xsy, 7, 0, Math.PI * 2)
      ctx.fillStyle = '#10b981'
      ctx.fill()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = '#ecfdf5'
      ctx.stroke()
      drawPillLabel(
        ctx,
        `x* (${formatNum(xStar[0], 2)}, ${formatNum(xStar[1], 2)})`,
        xsx,
        xsy - 20,
        '#6ee7b7'
      )
      ctx.restore()
    }

    // 8. COLUMN PICTURE COMBINATION: x1*(Ae1) + x2*(Ae2) = b
    if (layers.colPicture) {
      const xStar = solution.xExact
      const c1 = [baseMatrix[0][0] * xStar[0], baseMatrix[1][0] * xStar[0]]
      const c12 = [
        c1[0] + baseMatrix[0][1] * xStar[1],
        c1[1] + baseMatrix[1][1] * xStar[1],
      ]
      const [c1x, c1y] = toScreen(c1[0], c1[1], w, h)
      const [c12x, c12y] = toScreen(c12[0], c12[1], w, h)
      const [bx, by] = toScreen(bVector[0], bVector[1], w, h)

      drawArrow(ctx, ox, oy, c1x, c1y, '#34d399', 2.4, 9, true)
      drawArrow(ctx, c1x, c1y, c12x, c12y, '#fbbf24', 2.4, 9, true)
      drawArrow(ctx, ox, oy, bx, by, '#eab308', 3.2, 11)

      // Draggable handle on b
      ctx.save()
      ctx.beginPath()
      ctx.arc(
        bx,
        by,
        hoverTarget === 'bvec' || dragTarget === 'bvec' ? 8 : 5.5,
        0,
        Math.PI * 2
      )
      ctx.fillStyle = '#eab308'
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#0f172a'
      ctx.stroke()
      ctx.restore()

      drawPillLabel(
        ctx,
        `b (${formatNum(bVector[0], 2)}, ${formatNum(bVector[1], 2)})`,
        bx,
        by - 18,
        '#fde047'
      )
    }

    // 9. ITERATIVE SOLVERS CONVERGENCE TRAJECTORIES x^(0) -> x^(1) -> ... -> x^(k)
    if (layers.iterativePaths && iterStep > 0) {
      ctx.save()
      for (const trace of Object.values(solution.iterative)) {
        if (!enabledMethods[trace.id]) continue
        const count = Math.min(iterStep + 1, trace.points.length)
        if (count < 2) continue

        ctx.strokeStyle = trace.color
        ctx.lineWidth = 2.2
        ctx.setLineDash([])
        ctx.beginPath()
        for (let i = 0; i < count; i++) {
          const pt = trace.points[i]
          const [px, py] = toScreen(pt[0], pt[1], w, h)
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()

        for (let i = 0; i < count; i++) {
          const pt = trace.points[i]
          const [px, py] = toScreen(pt[0], pt[1], w, h)
          ctx.beginPath()
          ctx.arc(px, py, i === count - 1 ? 5.5 : 3.2, 0, Math.PI * 2)
          ctx.fillStyle = trace.color
          ctx.fill()
          ctx.strokeStyle = '#0f172a'
          ctx.lineWidth = 1.2
          ctx.stroke()
        }

        const lastPt = trace.points[count - 1]
        const [lx, ly] = toScreen(lastPt[0], lastPt[1], w, h)
        drawPillLabel(
          ctx,
          `${trace.id.toUpperCase()} k=${count - 1}`,
          lx + 24,
          ly + 14,
          trace.color
        )
      }
      ctx.restore()
    }

    // 10. TRAJECTORY / POWER ITERATION ORBIT
    const fullAv = applyMatrix(baseMatrix, vector)
    const currentMv = applyMatrix(activeMat, vector)

    if (layers.trajectory) {
      ctx.save()
      if (powerMode) {
        const orbit = computePowerOrbit(baseMatrix, vector, powerK, normalizePower)
        if (orbit.length > 1) {
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)'
          ctx.lineWidth = 2
          ctx.setLineDash([4, 3])
          ctx.beginPath()
          orbit.forEach((pt, idx) => {
            const [px, py] = toScreen(pt[0], pt[1], w, h)
            if (idx === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          })
          ctx.stroke()

          ctx.setLineDash([])
          orbit.forEach((pt, idx) => {
            const [px, py] = toScreen(pt[0], pt[1], w, h)
            ctx.beginPath()
            ctx.arc(px, py, idx === orbit.length - 1 ? 6 : 4, 0, Math.PI * 2)
            ctx.fillStyle = idx === orbit.length - 1 ? '#f59e0b' : '#fde68a'
            ctx.fill()
            ctx.strokeStyle = '#0f172a'
            ctx.lineWidth = 1.5
            ctx.stroke()
            if (idx === orbit.length - 1 || idx <= 4) {
              drawPillLabel(ctx, `v_${idx}`, px, py - 14, '#fde68a')
            }
          })
        }
      } else {
        const [vx, vy] = toScreen(vector[0], vector[1], w, h)
        const [avx, avy] = toScreen(fullAv[0], fullAv[1], w, h)
        const dist = Math.hypot(avx - vx, avy - vy)
        if (dist > 6) {
          const midX = (vx + avx) / 2
          const midY = (vy + avy) / 2
          const nx = -(avy - vy) / dist
          const ny = (avx - vx) / dist
          const curveOffset = Math.min(36, dist * 0.2)
          const cpx = midX + nx * curveOffset
          const cpy = midY + ny * curveOffset

          ctx.strokeStyle = 'rgba(248, 113, 113, 0.55)'
          ctx.lineWidth = 1.8
          ctx.setLineDash([4, 4])
          ctx.beginPath()
          ctx.moveTo(vx, vy)
          ctx.quadraticCurveTo(cpx, cpy, avx, avy)
          ctx.stroke()
        }
      }
      ctx.restore()
    }

    // 11. TEST VECTOR v, M(t)v, and Av
    if (layers.vectors) {
      const [vx, vy] = toScreen(vector[0], vector[1], w, h)
      const [mvx, mvy] = toScreen(currentMv[0], currentMv[1], w, h)
      const [avx, avy] = toScreen(fullAv[0], fullAv[1], w, h)

      if (Math.abs(t - 1) > 1e-3 && !powerMode) {
        drawArrow(ctx, ox, oy, avx, avy, 'rgba(248, 113, 113, 0.35)', 2, 8, true)
        drawPillLabel(ctx, 'Av', avx + 16, avy - 12, '#fca5a5')
      }

      drawArrow(ctx, ox, oy, vx, vy, '#38bdf8', 3.2, 11)

      ctx.save()
      ctx.beginPath()
      ctx.arc(
        vx,
        vy,
        hoverTarget === 'vector' || dragTarget === 'vector' ? 8 : 5.5,
        0,
        Math.PI * 2
      )
      ctx.fillStyle = '#38bdf8'
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#0f172a'
      ctx.stroke()
      ctx.restore()

      drawPillLabel(
        ctx,
        `v (${formatNum(vector[0], 2)}, ${formatNum(vector[1], 2)})`,
        vx,
        vy - 18,
        '#7dd3fc'
      )

      drawArrow(ctx, ox, oy, mvx, mvy, '#f43f5e', 3.2, 11)
      drawPillLabel(
        ctx,
        Math.abs(t - 1) < 1e-3
          ? `Av (${formatNum(currentMv[0], 2)}, ${formatNum(currentMv[1], 2)})`
          : `M(t)v (${formatNum(currentMv[0], 2)}, ${formatNum(currentMv[1], 2)})`,
        mvx,
        mvy + 18,
        '#fda4af'
      )

      if (powerMode && powerK > 0) {
        const orbit = computePowerOrbit(baseMatrix, vector, powerK, normalizePower)
        const vk = orbit[orbit.length - 1]
        const [vkx, vky] = toScreen(vk[0], vk[1], w, h)
        drawArrow(ctx, ox, oy, vkx, vky, '#f59e0b', 3.4, 12)
        drawPillLabel(
          ctx,
          `A^${powerK}v (${formatNum(vk[0], 2)}, ${formatNum(vk[1], 2)})`,
          vkx,
          vky - 20,
          '#fcd34d'
        )
      }
    }
  }, [
    baseMatrix,
    interpolatedMatrix,
    t,
    vector,
    bVector,
    metrics,
    lpMetrics,
    solution,
    iterStep,
    enabledMethods,
    powerMode,
    powerK,
    normalizePower,
    layers,
    scale,
    toScreen,
    hoverTarget,
    dragTarget,
  ])

  useEffect(() => {
    const id = requestAnimationFrame(renderScene)
    return () => cancelAnimationFrame(id)
  }, [renderScene])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(renderScene)
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [renderScene])

  const detectHitTarget = (sx: number, sy: number, w: number, h: number): DragTarget => {
    const [vx, vy] = toScreen(vector[0], vector[1], w, h)
    if (Math.hypot(sx - vx, sy - vy) <= 16) return 'vector'

    if (layers.colPicture) {
      const [bx, by] = toScreen(bVector[0], bVector[1], w, h)
      if (Math.hypot(sx - bx, sy - by) <= 16) return 'bvec'
    }

    if (Math.abs(t - 1) < 1e-3 && !powerMode && layers.warpedGrid) {
      const [e1x, e1y] = toScreen(baseMatrix[0][0], baseMatrix[1][0], w, h)
      if (Math.hypot(sx - e1x, sy - e1y) <= 14) return 'col1'

      const [e2x, e2y] = toScreen(baseMatrix[0][1], baseMatrix[1][1], w, h)
      if (Math.hypot(sx - e2x, sy - e2y) <= 14) return 'col2'
    }

    return 'pan'
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const hit = detectHitTarget(sx, sy, rect.width, rect.height)
    setDragTarget(hit)
    panStartRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
    canvas.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const [wx, wy] = toWorld(sx, sy, rect.width, rect.height)
    setMouseWorld([wx, wy])

    const snap = (val: number) => {
      if (e.shiftKey) return Math.round(val * 4) / 4
      return Math.round(val * 20) / 20
    }

    if (dragTarget === 'none') {
      const hit = detectHitTarget(sx, sy, rect.width, rect.height)
      setHoverTarget(hit === 'pan' ? 'none' : hit)
      return
    }

    if (dragTarget === 'pan') {
      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      setOffset({ x: panStartRef.current.ox + dx, y: panStartRef.current.oy + dy })
    } else if (dragTarget === 'vector') {
      onVectorChange([snap(wx), snap(wy)])
    } else if (dragTarget === 'bvec') {
      onBVectorChange([snap(wx), snap(wy)])
    } else if (dragTarget === 'col1') {
      onMatrixChange([
        [snap(wx), baseMatrix[0][1]],
        [snap(wy), baseMatrix[1][1]],
      ])
    } else if (dragTarget === 'col2') {
      onMatrixChange([
        [baseMatrix[0][0], snap(wx)],
        [baseMatrix[1][0], snap(wy)],
      ])
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setDragTarget('none')
    const canvas = canvasRef.current
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId)
    }
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const [wx, wy] = toWorld(sx, sy, rect.width, rect.height)

    const zoomFactor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    const nextScale = Math.min(220, Math.max(18, scale * zoomFactor))

    const cxNew = sx - wx * nextScale
    const cyNew = sy + wy * nextScale
    setScale(nextScale)
    setOffset({
      x: cxNew - rect.width / 2,
      y: cyNew - rect.height / 2,
    })
  }

  const cursorClass =
    dragTarget !== 'none' && dragTarget !== 'pan'
      ? 'cursor-grabbing'
      : hoverTarget !== 'none'
        ? 'cursor-grab'
        : dragTarget === 'pan'
          ? 'cursor-move'
          : 'cursor-crosshair'

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onDoubleClick={() => {
          setOffset({ x: 0, y: 0 })
          setScale(68)
        }}
        className={`w-full h-full block ${cursorClass}`}
      />

      {/* Bottom-Right Viewport Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-xl p-1.5 shadow-xl">
        <button
          type="button"
          onClick={() => setScale((s) => Math.min(220, s * 1.2))}
          title="Zoom In"
          className="px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800 rounded-lg transition"
        >
          +
        </button>
        <span className="text-[11px] font-mono text-slate-400 px-1.5">
          {Math.round((scale / 68) * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setScale((s) => Math.max(18, s / 1.2))}
          title="Zoom Out"
          className="px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800 rounded-lg transition"
        >
          −
        </button>
        <div className="w-px h-4 bg-slate-700/80 mx-0.5" />
        <button
          type="button"
          onClick={() => {
            setOffset({ x: 0, y: 0 })
            setScale(68)
          }}
          className="px-2.5 py-1 text-xs font-medium text-sky-400 hover:bg-sky-500/10 rounded-lg transition"
        >
          {tr('Reset View', 'Ripristina Vista')}
        </button>
      </div>

      {/* Bottom-Left Interactive Legend & Coordinates */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/85 backdrop-blur-md border border-slate-800/90 rounded-xl px-3 py-2 text-[11px] text-slate-300 shadow-lg">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
            <span>{tr('v (Drag)', 'v (Trascina)')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Av</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span>det(A)={formatNum(metrics.det, 2)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-400 inline-block" />
            <span>
              ‖A‖_{lpMetrics.pLabel}={formatNum(lpMetrics.matrixNormP, 2)}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" />
            <span>ρ(A)={formatNum(metrics.spectralRadius, 2)}</span>
          </span>
          {layers.rowPlanes && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              <span>{tr('Row Lines → x*', 'Rette Righe → x*')}</span>
            </span>
          )}
        </div>
        <div className="text-[11px] font-mono text-slate-400 bg-slate-900/75 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800/70 w-fit">
          {mouseWorld
            ? tr(
                `Cursor: (${formatNum(mouseWorld[0], 2)}, ${formatNum(mouseWorld[1], 2)}) • Drag v, b, Ae₁, Ae₂`,
                `Cursore: (${formatNum(mouseWorld[0], 2)}, ${formatNum(mouseWorld[1], 2)}) • Trascina v, b, Ae₁, Ae₂`
              )
            : tr(
                'Drag vector tips v, b, Ae₁, Ae₂ on canvas • Scroll to zoom',
                'Trascina le punte dei vettori v, b, Ae₁, Ae₂ sul canvas • Scorri per zoom'
              )}
        </div>
      </div>
    </div>
  )
}
