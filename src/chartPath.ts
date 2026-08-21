/** SVG path helpers for cycle rhythm charts. */

export type ChartPoint = { x: number; y: number };

/**
 * Monotone cubic Hermite (Fritsch–Carlson) → cubic Bézier SVG path.
 * Smooth curves without the Catmull-Rom overshoot spikes on plateaus.
 */
export function monotoneCubicPath(points: ChartPoint[]): string {
  const n = points.length;
  if (n < 2) return '';
  if (n === 2) {
    return `M ${fmt(points[0].x)} ${fmt(points[0].y)} L ${fmt(points[1].x)} ${fmt(points[1].y)}`;
  }

  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    dx[i] = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    slope[i] = Math.abs(dx[i]) < 1e-9 ? 0 : dy / dx[i];
  }

  const tangent = new Array<number>(n);
  tangent[0] = slope[0];
  tangent[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i += 1) {
    if (slope[i - 1] * slope[i] <= 0) tangent[i] = 0;
    else tangent[i] = (slope[i - 1] + slope[i]) / 2;
  }

  for (let i = 0; i < n - 1; i += 1) {
    if (Math.abs(slope[i]) < 1e-12) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i] / slope[i];
    const b = tangent[i + 1] / slope[i];
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      tangent[i] = tau * a * slope[i];
      tangent[i + 1] = tau * b * slope[i];
    }
  }

  let d = `M ${fmt(points[0].x)} ${fmt(points[0].y)}`;
  for (let i = 0; i < n - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + dx[i] / 3;
    const cp1y = p0.y + (tangent[i] * dx[i]) / 3;
    const cp2x = p1.x - dx[i] / 3;
    const cp2y = p1.y - (tangent[i + 1] * dx[i]) / 3;
    d += ` C ${fmt(cp1x)} ${fmt(cp1y)} ${fmt(cp2x)} ${fmt(cp2y)} ${fmt(p1.x)} ${fmt(p1.y)}`;
  }
  return d;
}

export function monotoneCubicPathRange(points: ChartPoint[], start: number, end: number): string {
  if (end <= start || points.length < 2) return '';
  return monotoneCubicPath(points.slice(start, end + 1));
}

function fmt(n: number): string {
  return n.toFixed(2);
}
