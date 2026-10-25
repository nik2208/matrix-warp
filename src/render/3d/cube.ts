import * as THREE from 'three'

export function createCube() {
  const geom = new THREE.BoxGeometry(1, 1, 1)
  const mat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, wireframe: true, transparent: true, opacity: 0.6 })
  const mesh = new THREE.Mesh(geom, mat)
  return mesh
}
export function createParallelepiped(matrix: number[][]) {
  const geom = new THREE.BoxGeometry(1, 1, 1)
  const mat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, wireframe: true, transparent: true, opacity: 0.7 })
  const mesh = new THREE.Mesh(geom, mat)
  // apply linear transform as matrix
  const m = new THREE.Matrix4()
  m.set(
    matrix[0][0], matrix[0][1], matrix[0][2], 0,
    matrix[1][0], matrix[1][1], matrix[1][2], 0,
    matrix[2][0], matrix[2][1], matrix[2][2], 0,
    0, 0, 0, 1
  )
  mesh.applyMatrix4(m)
  return mesh
}
