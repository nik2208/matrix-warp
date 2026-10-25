import { create, all } from 'mathjs';
import type { Complex } from '../types/math';
const math = create(all);

function toComplex(c: any): Complex {
  if (typeof c === 'number') {
    return { re: c, im: 0 };
  }
  if (c && typeof c === 'object') {
    const re = typeof c.re === 'number' ? c.re : (typeof c.real === 'number' ? c.real : 0);
    const im = typeof c.im === 'number' ? c.im : (typeof c.imag === 'number' ? c.imag : 0);
    return { re, im };
  }
  return { re: 0, im: 0 };
}

export function eigenvalues2(a: number[][]): Complex[] {
  try {
    const ev = math.eigs(a) as any;
    const vals = ev.values || ev.eigenvalues || [];
    const res = (Array.isArray(vals) ? vals : [vals]).map((v: any) => toComplex(v));
    return res;
  } catch {
    return [];
  }
}
export function eigenvalues3(a: number[][]): Complex[] {
  try {
    const ev = math.eigs(a) as any;
    const vals = ev.values || ev.eigenvalues || [];
    const res = (Array.isArray(vals) ? vals : [vals]).map((v: any) => toComplex(v));
    return res;
  } catch {
    return [];
  }
}
export function eigenvectors2(a: number[][]): number[][] | null {
  try {
    const ev = math.eigs(a) as any;
    const vecs = ev.vectors || ev.eigenvectors;
    if (!vecs) return null;
    if (vecs.length === 2 && Array.isArray(vecs[0])) {
      const result: number[][] = [];
      result.push([vecs[0][0], vecs[1][0]]);
      if (vecs[0][1] !== undefined || vecs[1][1] !== undefined) {
        result.push([vecs[0][1] || 0, vecs[1][1] || 0]);
      }
      return result;
    }
    return null;
  } catch {
    return null;
  }
}
export function eigenvectors3(a: number[][]): number[][] | null {
  try {
    const ev = math.eigs(a) as any;
    const vecs = ev.vectors || ev.eigenvectors;
    if (!vecs) return null;
    if (vecs.length === 3 && Array.isArray(vecs[0])) {
      const result: number[][] = [];
      result.push([vecs[0][0], vecs[1][0], vecs[2][0]]);
      if (vecs[0][1] !== undefined) result.push([vecs[0][1], vecs[1][1], vecs[2][1]]);
      if (vecs[0][2] !== undefined) result.push([vecs[0][2], vecs[1][2], vecs[2][2]]);
      return result;
    }
    return null;
  } catch {
    return null;
  }
}
