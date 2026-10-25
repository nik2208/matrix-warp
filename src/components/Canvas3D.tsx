import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { LayerVisibility, Metrics } from '../types/math'
import {
  applyMatrix,
  computePowerOrbit,
  computeSVD,
  det3,
  formatNum,
} from '../lib/mathEngine'

interface Canvas3DProps {
  baseMatrix: number[][]
  interpolatedMatrix: number[][]
  t: number
  vector: [number, number, number]
  metrics: Metrics
  powerMode: boolean
  powerK: number
  normalizePower: boolean
  layers: LayerVisibility
}

function toThreeMat4(m: number[][]): THREE.Matrix4 {
  const mat4 = new THREE.Matrix4()
  mat4.set(
    m[0][0], m[0][1], m[0][2], 0,
    m[1][0], m[1][1], m[1][2], 0,
    m[2][0], m[2][1], m[2][2], 0,
    0, 0, 0, 1
  )
  return mat4
}

function build3DVectorArrow(
  target: number[],
  color: number,
  radius = 0.032,
  headLength = 0.22,
  headRadius = 0.085
): THREE.Group {
  const group = new THREE.Group()
  const v = new THREE.Vector3(target[0], target[1], target[2])
  const len = v.length()
  if (len < 1e-4) return group

  const dir = v.clone().normalize()
  const actualHeadLen = Math.min(headLength, len * 0.38)
  const shaftLen = Math.max(0.001, len - actualHeadLen)

  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.25,
    metalness: 0.2,
    emissive: color,
    emissiveIntensity: 0.22,
  })

  const shaftGeo = new THREE.CylinderGeometry(radius, radius, shaftLen, 16)
  shaftGeo.translate(0, shaftLen / 2, 0)
  const shaft = new THREE.Mesh(shaftGeo, mat)

  const headGeo = new THREE.ConeGeometry(headRadius, actualHeadLen, 20)
  headGeo.translate(0, shaftLen + actualHeadLen / 2, 0)
  const head = new THREE.Mesh(headGeo, mat)

  group.add(shaft, head)

  const up = new THREE.Vector3(0, 1, 0)
  if (dir.y < -0.9999) {
    group.rotation.z = Math.PI
  } else {
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir)
    group.quaternion.copy(quat)
  }

  return group
}

export default function Canvas3D({
  baseMatrix,
  interpolatedMatrix,
  t,
  vector,
  metrics,
  powerMode,
  powerK,
  normalizePower,
  layers,
}: Canvas3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [autoRotate, setAutoRotate] = useState(false)

  const engineRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    controls: OrbitControls
    dynamicGroup: THREE.Group
    baseGridGroup: THREE.Group
  } | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x060a12)

    const w = container.clientWidth || 800
    const h = container.clientHeight || 600
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200)
    camera.position.set(4.2, 3.4, 4.8)

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.autoRotateSpeed = 1.4

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.75)
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.1)
    dirLight1.position.set(6, 10, 8)
    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.45)
    dirLight2.position.set(-6, -5, -4)
    scene.add(ambient, dirLight1, dirLight2)

    // Base Reference Group (Grid + X/Y/Z Axes + Reference Unit Cube/Sphere)
    const baseGridGroup = new THREE.Group()
    const gridHelper = new THREE.GridHelper(10, 10, 0x334155, 0x1e293b)
    baseGridGroup.add(gridHelper)

    // X (Red), Y (Green), Z (Blue) positive/negative coordinate lines
    const axisLen = 4.5
    const createAxisLine = (end: [number, number, number], hex: number) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-end[0] * 0.4, -end[1] * 0.4, -end[2] * 0.4),
        new THREE.Vector3(end[0], end[1], end[2]),
      ])
      const mat = new THREE.LineBasicMaterial({ color: hex, transparent: true, opacity: 0.55 })
      return new THREE.Line(geo, mat)
    }
    baseGridGroup.add(
      createAxisLine([axisLen, 0, 0], 0xef4444),
      createAxisLine([0, axisLen, 0], 0x22c55e),
      createAxisLine([0, 0, axisLen], 0x3b82f6)
    )
    scene.add(baseGridGroup)

    const dynamicGroup = new THREE.Group()
    scene.add(dynamicGroup)

    engineRef.current = { scene, camera, renderer, controls, dynamicGroup, baseGridGroup }

    let rafId = 0
    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      rafId = requestAnimationFrame(animate)
    }
    animate()

    const handleResize = () => {
      if (!container) return
      const nw = container.clientWidth
      const nh = container.clientHeight
      if (nw === 0 || nh === 0) return
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }

    const ro = new ResizeObserver(handleResize)
    ro.observe(container)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      container.innerHTML = ''
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.controls.autoRotate = autoRotate
    }
  }, [autoRotate])

  useEffect(() => {
    const eng = engineRef.current
    if (!eng) return
    const { dynamicGroup, baseGridGroup } = eng

    baseGridGroup.visible = layers.baseGrid

    // Dispose old geometries & materials in dynamicGroup
    while (dynamicGroup.children.length > 0) {
      const child = dynamicGroup.children[0]
      dynamicGroup.remove(child)
      child.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose())
          else obj.material.dispose()
        }
      })
    }

    const activeMat = interpolatedMatrix
    const mat4 = toThreeMat4(activeMat)
    const currentDet = det3(activeMat)
    const isFlipped = currentDet < -1e-8
    const isCollapsed = Math.abs(currentDet) <= 1e-8

    // 1. UNIT CUBE & TRANSFORMED PARALLELEPIPED
    if (layers.unitArea || layers.warpedGrid) {
      // Subtle reference unit cube [0,1]^3
      if (layers.baseGrid) {
        const refBox = new THREE.BoxGeometry(1, 1, 1)
        refBox.translate(0.5, 0.5, 0.5)
        const refEdges = new THREE.EdgesGeometry(refBox)
        const refLine = new THREE.LineSegments(
          refEdges,
          new THREE.LineDashedMaterial({
            color: 0x64748b,
            dashSize: 0.08,
            gapSize: 0.06,
            transparent: true,
            opacity: 0.45,
          })
        )
        refLine.computeLineDistances()
        dynamicGroup.add(refLine)
        refBox.dispose()
      }

      // Transformed Parallelepiped
      const paraGeo = new THREE.BoxGeometry(1, 1, 1)
      paraGeo.translate(0.5, 0.5, 0.5)
      paraGeo.applyMatrix4(mat4)

      if (layers.unitArea) {
        const fillColor = isCollapsed ? 0xfbbf24 : isFlipped ? 0xf43f5e : 0x10b981
        const paraMesh = new THREE.Mesh(
          paraGeo,
          new THREE.MeshStandardMaterial({
            color: fillColor,
            transparent: true,
            opacity: 0.18,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        )
        dynamicGroup.add(paraMesh)
      }

      if (layers.warpedGrid) {
        const edgeColor = isCollapsed ? 0xfbbf24 : isFlipped ? 0xfb7185 : 0x34d399
        const edgesGeo = new THREE.EdgesGeometry(paraGeo)
        const paraEdges = new THREE.LineSegments(
          edgesGeo,
          new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.85 })
        )
        dynamicGroup.add(paraEdges)

        // Transformed basis vectors Ae1, Ae2, Ae3
        const e1 = applyMatrix(activeMat, [1, 0, 0])
        const e2 = applyMatrix(activeMat, [0, 1, 0])
        const e3 = applyMatrix(activeMat, [0, 0, 1])
        dynamicGroup.add(
          build3DVectorArrow(e1, 0x10b981, 0.022, 0.16, 0.06),
          build3DVectorArrow(e2, 0xf59e0b, 0.022, 0.16, 0.06),
          build3DVectorArrow(e3, 0x818cf8, 0.022, 0.16, 0.06)
        )
      }
    }

    // 2. SVD UNIT SPHERE -> 3D ELLIPSOID & SINGULAR AXES
    if (layers.svdCircle) {
      // Reference wireframe unit sphere
      const refSphereGeo = new THREE.SphereGeometry(1, 24, 16)
      const refSphereWire = new THREE.LineSegments(
        new THREE.WireframeGeometry(refSphereGeo),
        new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.14 })
      )
      dynamicGroup.add(refSphereWire)
      refSphereGeo.dispose()

      // Exact transformed ellipsoid under M(t)
      const ellipGeo = new THREE.SphereGeometry(1, 36, 24)
      ellipGeo.applyMatrix4(mat4)

      const ellipMesh = new THREE.Mesh(
        ellipGeo,
        new THREE.MeshStandardMaterial({
          color: 0xc084fc,
          roughness: 0.3,
          metalness: 0.1,
          transparent: true,
          opacity: 0.16,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      )
      const ellipWire = new THREE.LineSegments(
        new THREE.WireframeGeometry(ellipGeo),
        new THREE.LineBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.38 })
      )
      dynamicGroup.add(ellipMesh, ellipWire)

      // Principal SVD semi-axes sigma_i * u_i
      const activeSvd = computeSVD(activeMat)
      const axisColors = [0xe879f9, 0xa855f7, 0x7e22ce]
      activeSvd.singularValues.forEach((sigma, idx) => {
        if (sigma > 1e-3) {
          const u = activeSvd.uVectors[idx]
          const tip = [u[0] * sigma, u[1] * sigma, u[2] * sigma]
          dynamicGroup.add(build3DVectorArrow(tip, axisColors[idx] ?? 0xc084fc, 0.018, 0.14, 0.05))
        }
      })
    }

    // 3. 3D INVARIANT EIGENVECTOR AXES
    if (layers.eigenLines) {
      const realPairs = metrics.eigenPairs.filter((p) => p.isReal && p.vector !== null)
      realPairs.forEach((pair, idx) => {
        const ev = pair.vector!
        const span = 5.5
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-ev[0] * span, -ev[1] * span, -ev[2] * span),
          new THREE.Vector3(ev[0] * span, ev[1] * span, ev[2] * span),
        ])
        const color = idx === 0 ? 0x2dd4bf : idx === 1 ? 0x38bdf8 : 0xa3e635
        const line = new THREE.Line(
          lineGeo,
          new THREE.LineDashedMaterial({
            color,
            dashSize: 0.18,
            gapSize: 0.1,
            transparent: true,
            opacity: 0.85,
          })
        )
        line.computeLineDistances()
        dynamicGroup.add(line)
      })
    }

    // 4. 3D VECTORS v, M(t)v, Av & POWER ORBIT
    const currentMv = applyMatrix(activeMat, vector)
    const fullAv = applyMatrix(baseMatrix, vector)

    if (layers.vectors) {
      dynamicGroup.add(build3DVectorArrow(vector, 0x38bdf8, 0.036, 0.24, 0.09))
      dynamicGroup.add(build3DVectorArrow(currentMv, 0xf43f5e, 0.036, 0.24, 0.09))
    }

    if (layers.trajectory) {
      if (powerMode) {
        const orbit = computePowerOrbit(baseMatrix, vector, powerK, normalizePower)
        if (orbit.length > 1) {
          const points = orbit.map((pt) => new THREE.Vector3(pt[0], pt[1], pt[2]))
          const orbitGeo = new THREE.BufferGeometry().setFromPoints(points)
          const orbitLine = new THREE.Line(
            orbitGeo,
            new THREE.LineBasicMaterial({ color: 0xfbbf24 })
          )
          dynamicGroup.add(orbitLine)

          points.forEach((pt, idx) => {
            const spGeo = new THREE.SphereGeometry(idx === points.length - 1 ? 0.08 : 0.05, 16, 16)
            spGeo.translate(pt.x, pt.y, pt.z)
            const spMesh = new THREE.Mesh(
              spGeo,
              new THREE.MeshStandardMaterial({
                color: idx === points.length - 1 ? 0xf59e0b : 0xfde68a,
                emissive: 0xf59e0b,
                emissiveIntensity: 0.35,
              })
            )
            dynamicGroup.add(spMesh)
          })
        }
      } else {
        // Smooth interpolation path from v to Av
        const curvePts: THREE.Vector3[] = []
        const steps = 24
        for (let i = 0; i <= steps; i++) {
          const tau = i / steps
          const ix = (1 - tau) * vector[0] + tau * fullAv[0]
          const iy = (1 - tau) * vector[1] + tau * fullAv[1]
          const iz = (1 - tau) * vector[2] + tau * fullAv[2]
          curvePts.push(new THREE.Vector3(ix, iy, iz))
        }
        const pathGeo = new THREE.BufferGeometry().setFromPoints(curvePts)
        const pathLine = new THREE.Line(
          pathGeo,
          new THREE.LineDashedMaterial({
            color: 0xf87171,
            dashSize: 0.1,
            gapSize: 0.07,
            transparent: true,
            opacity: 0.7,
          })
        )
        pathLine.computeLineDistances()
        dynamicGroup.add(pathLine)
      }
    }
  }, [baseMatrix, interpolatedMatrix, t, vector, metrics, powerMode, powerK, normalizePower, layers])

  const setCameraView = (pos: [number, number, number]) => {
    const eng = engineRef.current
    if (!eng) return
    eng.camera.position.set(...pos)
    eng.controls.target.set(0, 0, 0)
    eng.controls.update()
  }

  const currentMv = applyMatrix(interpolatedMatrix, vector)

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Bottom-Right 3D Camera Controls */}
      <div className="absolute bottom-4 right-4 flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-xl p-1.5 shadow-xl">
        <button
          type="button"
          onClick={() => setCameraView([4.2, 3.4, 4.8])}
          className="px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded-lg transition"
        >
          Iso 3D
        </button>
        <button
          type="button"
          onClick={() => setCameraView([0, 0, 6.5])}
          className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition"
        >
          XY
        </button>
        <button
          type="button"
          onClick={() => setCameraView([0, 6.5, 0.01])}
          className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition"
        >
          XZ
        </button>
        <button
          type="button"
          onClick={() => setCameraView([6.5, 0, 0])}
          className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition"
        >
          YZ
        </button>
        <div className="w-px h-4 bg-slate-700/80 mx-0.5" />
        <button
          type="button"
          onClick={() => setAutoRotate((r) => !r)}
          aria-pressed={autoRotate}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${
            autoRotate
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          {autoRotate ? '⟳ Orbiting' : '⟳ Auto-Orbit'}
        </button>
      </div>

      {/* Bottom-Left 3D Legend & Coordinates */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/85 backdrop-blur-md border border-slate-800/90 rounded-xl px-3 py-2 text-[11px] text-slate-300 shadow-lg">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
            <span>
              v ({formatNum(vector[0], 1)}, {formatNum(vector[1], 1)}, {formatNum(vector[2], 1)})
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>
              Av ({formatNum(currentMv[0], 1)}, {formatNum(currentMv[1], 1)},{' '}
              {formatNum(currentMv[2], 1)})
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span>|det(A)| = {formatNum(Math.abs(metrics.det), 2)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
            <span>3D SVD Ellipsoid</span>
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 bg-slate-900/75 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800/70 w-fit">
          Left-drag to orbit • Right-drag to pan • Scroll to zoom
        </div>
      </div>
    </div>
  )
}
