import { create, all } from 'mathjs';
const math: any = create(all);

export function singularValues2(a: number[][]): number[] {
  try {
    if (typeof math.svd === 'function') {
      const res = math.svd(a);
      const s = (res && (res.s || res.S)) || [];
      if (Array.isArray(s)) {
        return s.map((x: any) => (typeof x === 'number' ? x : 0));
      }
    }
    return [];
  } catch {
    return [];
  }
}
export function singularValues3(a: number[][]): number[] {
  try {
    if (typeof math.svd === 'function') {
      const res = math.svd(a);
      const s = (res && (res.s || res.S)) || [];
      if (Array.isArray(s)) {
        return s.map((x: any) => (typeof x === 'number' ? x : 0));
      }
    }
    return [];
  } catch {
    return [];
  }
}
