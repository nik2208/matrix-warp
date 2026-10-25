import type { Metrics } from '../types/math'
import { computeMetrics } from './mathEngine'

export function computeMetrics2(a: number[][]): Metrics {
  return computeMetrics(a)
}

export function computeMetrics3(a: number[][]): Metrics {
  return computeMetrics(a)
}

export { computeMetrics }
