import { create, all } from 'mathjs';
const math = create(all);

export function mul2(a: number[][], b: number[][]): number[][] {
  const res = math.multiply(a, b) as any;
  return [
    [res[0][0], res[0][1]],
    [res[1][0], res[1][1]],
  ];
}
export function mul3(a: number[][], b: number[][]): number[][] {
  const res = math.multiply(a, b) as any;
  return [
    [res[0][0], res[0][1], res[0][2]],
    [res[1][0], res[1][1], res[1][2]],
    [res[2][0], res[2][1], res[2][2]],
  ];
}
export function transpose2(a: number[][]): number[][] {
  return [[a[0][0], a[1][0]], [a[0][1], a[1][1]]];
}
export function transpose3(a: number[][]): number[][] {
  return [
    [a[0][0], a[1][0], a[2][0]],
    [a[0][1], a[1][1], a[2][1]],
    [a[0][2], a[1][2], a[2][2]],
  ];
}
export function det2(a: number[][]): number {
  return a[0][0] * a[1][1] - a[0][1] * a[1][0];
}
export function det3(a: number[][]): number {
  const m = a;
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}
export function inv2(a: number[][]): number[][] | null {
  const d = det2(a);
  if (Math.abs(d) < 1e-18) return null;
  const invd = 1 / d;
  return [
    [a[1][1] * invd, -a[0][1] * invd],
    [-a[1][0] * invd, a[0][0] * invd],
  ];
}
export function apply2(a: number[][], v: [number, number]): [number, number] {
  return [a[0][0] * v[0] + a[0][1] * v[1], a[1][0] * v[0] + a[1][1] * v[1]];
}
export function apply3(a: number[][], v: [number, number, number]): [number, number, number] {
  return [
    a[0][0] * v[0] + a[0][1] * v[1] + a[0][2] * v[2],
    a[1][0] * v[0] + a[1][1] * v[1] + a[1][2] * v[2],
    a[2][0] * v[0] + a[2][1] * v[1] + a[2][2] * v[2],
  ];
}
export function interpolate2(A: number[][], I: number[][], t: number): number[][] {
  return [
    [(1 - t) * I[0][0] + t * A[0][0], (1 - t) * I[0][1] + t * A[0][1]],
    [(1 - t) * I[1][0] + t * A[1][0], (1 - t) * I[1][1] + t * A[1][1]],
  ];
}
export function interpolate3(A: number[][], I: number[][], t: number): number[][] {
  return [
    [(1 - t) * I[0][0] + t * A[0][0], (1 - t) * I[0][1] + t * A[0][1], (1 - t) * I[0][2] + t * A[0][2]],
    [(1 - t) * I[1][0] + t * A[1][0], (1 - t) * I[1][1] + t * A[1][1], (1 - t) * I[1][2] + t * A[1][2]],
    [(1 - t) * I[2][0] + t * A[2][0], (1 - t) * I[2][1] + t * A[2][1], (1 - t) * I[2][2] + t * A[2][2]],
  ];
}
export function trace2(a: number[][]): number {
  return a[0][0] + a[1][1];
}
export function trace3(a: number[][]): number {
  return a[0][0] + a[1][1] + a[2][2];
}
