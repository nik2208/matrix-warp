import { useCallback, useEffect, useRef, useState } from 'react'
import type { LayerVisibility, Metrics } from '../types/math'
import {
  applyMatrix,
  computePowerOrbit,
  computeSVD,
  det2,
  formatNum,
} from '../lib/mathEngine'

interface Canvas2DProps {
  baseMatrix: number[][]
  interpolatedMatrix: number[][]
  t: number
  vector: [number, number]
  onVectorChange: (v: [number, number]) => void
  onMatrixChange: (m: number[][]) => void
  metrics: Metrics
  powerMode: boolean
  powerK: number
  normalizePower: boolean
  layers: LayerVisibility
}

type DragTarget = 'none' | 'pan' | 'vector' | 'col1' | 'col2'

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
  const metrics = ctx.measureText(text)
  const padX = 6
  const w = metrics.width + padX * 2
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

export default function Canvas2D({
  baseMatrix,
  interpolatedMatrix,
  t,
  vector,
  onVectorChange,
  onMatrixChange,
  metrics,
  powerMode,
  powerK,
  normalizePower,
  layers,
}: Canvas2DProps) {
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

    // Subtle radial background glow
    const [ox, oy] = toScreen(0, 0, w, h)
    const bgGrad = ctx.createRadialGradient(ox, oy, 10, ox, oy, Math.max(w, h) * 0.75)
    bgGrad.addColorStop(0, '#0f172a')
    bgGrad.addColorStop(1, '#060a12')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, w, h)

    const gridRange = 14
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

      // Base coordinate axes
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(0, oy)
      ctx.lineTo(w, oy)
      ctx.moveTo(ox, 0)
      ctx.lineTo(ox, h)
      ctx.stroke()

      // Numeric tick labels
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

    // 2. UNIT SQUARE -> DETERMINANT AREA PARALLELOGRAM
    const e1 = applyMatrix(activeMat, [1, 0])
    const e2 = applyMatrix(activeMat, [0, 1])
    const e12 = [e1[0] + e2[0], e1[1] + e2[1]]
    const currentDet = det2(activeMat)

    if (layers.unitArea) {
      const [p0x, p0y] = toScreen(0, 0, w, h)
      const [p1x, p1y] = toScreen(e1[0], e1[1], w, h)
      const [p12x, p12y] = toScreen(e12[0], e12[1], w, h)
      const [p2x, p2y] = toScreen(e2[0], e2[1], w, h)

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(p0x, p0y)
      ctx.lineTo(p1x, p1y)
      ctx.lineTo(p12x, p12y)
      ctx.lineTo(p2x, p2y)
      ctx.closePath()

      const isFlipped = currentDet < -1e-9
      const isCollapsed = Math.abs(currentDet) <= 1e-9
      ctx.fillStyle = isCollapsed
        ? 'rgba(251, 191, 36, 0.12)'
        : isFlipped
          ? 'rgba(244, 63, 94, 0.16)'
          : 'rgba(16, 185, 129, 0.14)'
      ctx.fill()

      ctx.strokeStyle = isCollapsed
        ? 'rgba(251, 191, 36, 0.65)'
        : isFlipped
          ? 'rgba(244, 63, 94, 0.55)'
          : 'rgba(16, 185, 129, 0.5)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 3])
      ctx.stroke()
      ctx.restore()

      const [cx, cy] = toScreen(e12[0] * 0.5, e12[1] * 0.5, w, h)
      if (Math.hypot(e12[0], e12[1]) > 0.25) {
        drawPillLabel(
          ctx,
          `det = ${formatNum(currentDet, 2)}`,
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
        // Grid lines parallel to transformed e2
        const a1 = applyMatrix(activeMat, [i, -gridRange])
        const a2 = applyMatrix(activeMat, [i, gridRange])
        const [sx1, sy1] = toScreen(a1[0], a1[1], w, h)
        const [sx2, sy2] = toScreen(a2[0], a2[1], w, h)
        ctx.strokeStyle = isAxis ? 'rgba(56, 189, 248, 0.42)' : 'rgba(56, 189, 248, 0.15)'
        ctx.lineWidth = isAxis ? 1.6 : 1
        ctx.beginPath()
        ctx.moveTo(sx1, sy1)
        ctx.lineTo(sx2, sy2)
        ctx.stroke()

        // Grid lines parallel to transformed e1
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

      // Transformed basis vectors Ae1 (emerald) and Ae2 (amber)
      const [e1x, e1y] = toScreen(e1[0], e1[1], w, h)
      const [e2x, e2y] = toScreen(e2[0], e2[1], w, h)

      drawArrow(ctx, ox, oy, e1x, e1y, '#10b981', 2.8, 10)
      drawArrow(ctx, ox, oy, e2x, e2y, '#f59e0b', 2.8, 10)

      // Interactive drag handles for Ae1, Ae2 when t === 1
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

    // 4. SVD UNIT CIRCLE & TRANSFORMED ELLIPSE WITH SEMI-AXES
    if (layers.svdCircle) {
      ctx.save()
      // Original Unit Circle ||x|| = 1
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.38)'
      ctx.lineWidth = 1.4
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(ox, oy, scale, 0, Math.PI * 2)
      ctx.stroke()

      // Transformed Unit Circle -> SVD Ellipse under activeMat
      ctx.setLineDash([])
      ctx.strokeStyle = '#c084fc'
      ctx.fillStyle = 'rgba(192, 132, 252, 0.07)'
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

      // Compute exact SVD of activeMat so semi-major/minor axes follow interpolation M(t)
      const activeSvd = computeSVD(activeMat)
      const s1 = activeSvd.singularValues[0] ?? 0
      const s2 = activeSvd.singularValues[1] ?? 0
      const u1 = activeSvd.uVectors[0] ?? [1, 0]
      const u2 = activeSvd.uVectors[1] ?? [0, 1]

      if (s1 > 1e-4) {
        const [u1x, u1y] = toScreen(u1[0] * s1, u1[1] * s1, w, h)
        drawArrow(ctx, ox, oy, u1x, u1y, '#e879f9', 2, 8, true)
        drawPillLabel(ctx, `σ₁=${formatNum(s1, 2)}`, (ox + u1x) / 2, (oy + u1y) / 2, '#f0abfc')
      }
      if (s2 > 1e-4) {
        const [u2x, u2y] = toScreen(u2[0] * s2, u2[1] * s2, w, h)
        drawArrow(ctx, ox, oy, u2x, u2y, '#a855f7', 1.8, 7, true)
        drawPillLabel(ctx, `σ₂=${formatNum(s2, 2)}`, (ox + u2x) / 2, (oy + u2y) / 2, '#d8b4fe')
      }
      ctx.restore()
    }

    // 5. EIGENVECTOR INVARIANT SPAN LINES
    if (layers.eigenLines) {
      ctx.save()
      const realPairs = metrics.eigenPairs.filter((p) => p.isReal && p.vector !== null)
      realPairs.forEach((pair, idx) => {
        const ev = pair.vector!
        const spanRadius = 25
        const [x1, y1] = toScreen(-ev[0] * spanRadius, -ev[1] * spanRadius, w, h)
        const [x2, y2] = toScreen(ev[0] * spanRadius, ev[1] * spanRadius, w, h)

        const color = idx === 0 ? '#2dd4bf' : '#38bdf8'
        ctx.strokeStyle = color
        ctx.lineWidth = 1.6
        ctx.setLineDash([7, 5])
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        // Draw unit eigenvector & scaled lambda * eigenvector
        const [ex, ey] = toScreen(ev[0], ev[1], w, h)
        ctx.setLineDash([])
        drawArrow(ctx, ox, oy, ex, ey, color, 2.2, 8)
        drawPillLabel(
          ctx,
          `v_${idx + 1} (λ=${formatNum(pair.value.re, 2)})`,
          ex + (ev[0] >= 0 ? 28 : -28),
          ey + (ev[1] >= 0 ? -14 : 14),
          color
        )
      })
      ctx.restore()
    }

    // 6. TRAJECTORY / POWER ITERATION ORBIT
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
        // Draw smooth trajectory arc from v to Av
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

    // 7. VECTORS v, M(t)v, and Av
    if (layers.vectors) {
      const [vx, vy] = toScreen(vector[0], vector[1], w, h)
      const [mvx, mvy] = toScreen(currentMv[0], currentMv[1], w, h)
      const [avx, avy] = toScreen(fullAv[0], fullAv[1], w, h)

      // If interpolating (t < 1), show ghost of final Av
      if (Math.abs(t - 1) > 1e-3 && !powerMode) {
        drawArrow(ctx, ox, oy, avx, avy, 'rgba(248, 113, 113, 0.35)', 2, 8, true)
        drawPillLabel(ctx, 'Av', avx + 16, avy - 12, '#fca5a5')
      }

      // Input vector v (Sky Blue)
      drawArrow(ctx, ox, oy, vx, vy, '#38bdf8', 3.2, 11)

      // Draggable handle on tip of v
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

      // Transformed vector M(t)v or Av (Coral Red)
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

      // In power mode, highlight current v_k vector
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
    metrics,
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
    dragTarget === 'vector' || dragTarget === 'col1' || dragTarget === 'col2'
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
          Reset View
        </button>
      </div>

      {/* Bottom-Left Interactive Legend & Coordinates */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/85 backdrop-blur-md border border-slate-800/90 rounded-xl px-3 py-2 text-[11px] text-slate-300 shadow-lg">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
            <span>v (Drag tip)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Av (Transformed)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span>Ae₁</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span>Ae₂</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
            <span>SVD Ellipse (σ₁, σ₂)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" />
            <span>Eigenvectors</span>
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 bg-slate-900/75 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800/70 w-fit">
          {mouseWorld
            ? `Cursor: (${formatNum(mouseWorld[0], 2)}, ${formatNum(mouseWorld[1], 2)}) • Shift+Drag to snap`
            : 'Drag vector tips v, Ae₁, Ae₂ on canvas • Scroll to zoom'}
        </div>
      </div>
    </div>
  )
}
