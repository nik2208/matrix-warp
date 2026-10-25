import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export function createScene(container: HTMLElement) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0b1020)
  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100)
  camera.position.set(3, 3, 4)
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  // lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const dir = new THREE.DirectionalLight(0xffffff, 0.8)
  dir.position.set(5, 10, 7)
  scene.add(dir)
  // axes
  const axes = new THREE.AxesHelper(3)
  scene.add(axes)
  const grid = new THREE.GridHelper(10, 10, 0x3a3f4d, 0x1f2437)
  grid.rotation.x = Math.PI / 2
  scene.add(grid)
  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  }
  window.addEventListener('resize', onResize)
  return { scene, camera, renderer, controls, onResize }
}
