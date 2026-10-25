export function toCanvas(_ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, cx: number, cy: number): [number, number] {
  return [cx + x * scale, cy - y * scale]
}
