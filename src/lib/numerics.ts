export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
export function isRealComplex(z: { re: number; im: number }, eps = 1e-10): boolean {
  return Math.abs(z.im) < eps;
}
