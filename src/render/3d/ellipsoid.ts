import * as THREE from 'three'

export function createSphere() {
  const geom = new THREE.SphereGeometry(1, 32, 32)
  const mat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, wireframe: true, transparent: true, opacity: 0.5 })
  const mesh = new THREE.Mesh(geom, mat)
  return mesh
}
export function createEllipsoid(svals: number[]) {
  const geom = new THREE.SphereGeometry(1, 32, 32)
  const mat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.6 })
  const mesh = new THREE.Mesh(geom, mat)
  const s = svals.length >= 3 ? svals : [svals[0]||1, svals[1]||1, 1]
  mesh.scale.set(Math.abs(s[0]), Math.abs(s[1]), Math.abs(s[2]))
  return mesh
}
