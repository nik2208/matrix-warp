import { useEffect, useRef } from 'react'
import { createScene } from '../render/3d/scene'
import { createCube, createParallelepiped } from '../render/3d/cube'
import { createSphere, createEllipsoid } from '../render/3d/ellipsoid'
import { createArrow } from '../render/3d/vector'
import { apply3 } from '../lib/matrix'
import type { Metrics } from '../types/math'

export default function Canvas3D({
  matrix,
  vector,
  metrics,
  powerMode,
  powerK,
}: {
  matrix: number[][]
  vector: [number, number, number]
  metrics: Metrics
  powerMode: boolean
  powerK: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<any>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    const { scene, camera, renderer, controls, onResize } = createScene(container)
    sceneRef.current = { scene, camera, renderer, controls }

    const cube = createCube()
    const sphere = createSphere()
    scene.add(cube)
    scene.add(sphere)

    let animId = 0
    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      animId = requestAnimationFrame(animate)
    }
    animate()

    const ro = new ResizeObserver(() => onResize())
    ro.observe(container)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
      window.removeEventListener('resize', onResize)
      container.innerHTML = ''
    }
  }, [])

  useEffect(() => {
    const ctx = sceneRef.current
    if (!ctx) return
    const { scene } = ctx
    // remove old transformed objects
    scene.children = scene.children.filter((c: any) => !c.userData.transformed)
    const p = createParallelepiped(matrix)
    p.userData.transformed = true
    const e = createEllipsoid(metrics.singularValues)
    e.userData.transformed = true
    scene.add(p)
    scene.add(e)
    // vectors
    scene.children = scene.children.filter((c: any) => c.type !== 'ArrowHelper' && !c.userData.vec)
    const v = vector
    const Av = apply3(matrix, v)
    const av = createArrow(Av, 0xf87171)
    av.userData.vec = true
    const vv = createArrow(v, 0x60a5fa)
    vv.userData.vec = true
    scene.add(av)
    scene.add(vv)
  }, [matrix, vector, metrics, powerMode, powerK])

  return <div ref={ref} className="w-full h-full" />
}
