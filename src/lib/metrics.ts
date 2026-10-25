import type { Metrics } from '../types/math';
import { det2, det3, trace2, trace3 } from './matrix';
import { frobenius2, frobenius3, spectralNorm2, spectralNorm3 } from './norms';
import { eigenvalues2, eigenvalues3, eigenvectors2, eigenvectors3 } from './eigen';
import { singularValues2, singularValues3 } from './svd';
import { create, all } from 'mathjs';
const math: any = create(all);

export function computeRank(m: number[][], dim: 2 | 3): number {
  try {
    const r = math.rank ? math.rank(m) : null;
    if (typeof r === 'number') return r;
  } catch {}
  // fallback
  if (dim === 2) {
    try {
      const d = det2(m);
      return Math.abs(d) > 1e-12 ? 2 : (Math.abs(m[0][0]) + Math.abs(m[0][1]) + Math.abs(m[1][0]) + Math.abs(m[1][1]) > 1e-12 ? 1 : 0);
    } catch {
      return 0;
    }
  }
  try {
    const d = det3(m);
    if (Math.abs(d) > 1e-12) return 3;
  } catch {}
  return 0;
}
export function computeMetrics2(a: number[][]): Metrics {
  const d = det2(a);
  const tr = trace2(a);
  const singular = Math.abs(d) < 1e-12;
  const fro = frobenius2(a);
  const spec = spectralNorm2(a);
  const svals = singularValues2(a);
  let cond: number | null = null;
  if (svals.length > 0) {
    const smax = Math.max(...svals);
    const smin = Math.min(...svals);
    if (smin < 1e-12 || singular) {
      cond = Infinity;
    } else {
      cond = smax / smin;
    }
  } else {
    cond = singular ? Infinity : null;
  }
  const evals = eigenvalues2(a);
  const evecs = eigenvectors2(a);
  const rank = computeRank(a, 2);
  return {
    det: d,
    trace: tr,
    rank,
    normFrobenius: fro,
    normSpectral: spec,
    cond,
    singular,
    eigenvalues: evals,
    eigenvectors: evecs,
    singularValues: svals,
  };
}
export function computeMetrics3(a: number[][]): Metrics {
  const d = det3(a);
  const tr = trace3(a);
  const singular = Math.abs(d) < 1e-12;
  const fro = frobenius3(a);
  const spec = spectralNorm3(a);
  const svals = singularValues3(a);
  let cond: number | null = null;
  if (svals.length > 0) {
    const smax = Math.max(...svals);
    const smin = Math.min(...svals);
    if (smin < 1e-12 || singular) {
      cond = Infinity;
    } else {
      cond = smax / smin;
    }
  } else {
    cond = singular ? Infinity : null;
  }
  const evals = eigenvalues3(a);
  const evecs = eigenvectors3(a);
  const rank = computeRank(a, 3);
  return {
    det: d,
    trace: tr,
    rank,
    normFrobenius: fro,
    normSpectral: spec,
    cond,
    singular,
    eigenvalues: evals,
    eigenvectors: evecs,
    singularValues: svals,
  };
}
