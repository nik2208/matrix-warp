export function clone2(m: number[][]): number[][] {
  return [[m[0][0], m[0][1]], [m[1][0], m[1][1]]];
}
export function clone3(m: number[][]): number[][] {
  return [
    [m[0][0], m[0][1], m[0][2]],
    [m[1][0], m[1][1], m[1][2]],
    [m[2][0], m[2][1], m[2][2]],
  ];
}
export function identity2(): number[][] {
  return [[1, 0], [0, 1]];
}
export function identity3(): number[][] {
  return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
}
export function isZero(v: number, eps = 1e-12): boolean {
  return Math.abs(v) < eps;
}
export function approxEqual(a: number, b: number, eps = 1e-10): boolean {
  return Math.abs(a - b) < eps;
}
