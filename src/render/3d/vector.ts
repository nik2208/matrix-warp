import * as THREE from 'three'

export function createArrow(v: [number, number, number], color: number) {
  const dir = new THREE.Vector3(v[0], v[1], v[2])
  const len = dir.length()
  if (len < 1e-12) {
    const group = new THREE.Group()
    return group
  }
  dir.normalize()
  const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0,0,0), len, color)
  return arrow
}
