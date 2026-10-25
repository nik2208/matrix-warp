import { create, all } from 'mathjs';
const math = create(all);

export function frobenius2(a: number[][]): number {
  const v = math.norm(a, 'fro') as number;
  return v;
}
export function frobenius3(a: number[][]): number {
  const v = math.norm(a, 'fro') as number;
  return v;
}
export function spectralNorm2(a: number[][]): number {
  try {
    const v = math.norm(a, 2) as number;
    return v;
  } catch {
    return NaN;
  }
}
export function spectralNorm3(a: number[][]): number {
  try {
    const v = math.norm(a, 2) as number;
    return v;
  } catch {
    return NaN;
  }
}
