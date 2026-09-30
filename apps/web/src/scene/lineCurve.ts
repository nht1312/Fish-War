import type { Vec3 } from "@fishwar/game-types";

/**
 * Points along a hanging line from `start` to `end`: a quadratic Bézier whose
 * control point sits 2 × `sag` below the midpoint, so the curve's middle hangs
 * exactly `sag` below the straight line. Rendering only.
 */
export function sagCurvePoints(start: Vec3, end: Vec3, sag: number, segments: number): Vec3[] {
  const control = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2 - 2 * sag,
    z: (start.z + end.z) / 2,
  };
  const points: Vec3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c = t * t;
    points.push({
      x: a * start.x + b * control.x + c * end.x,
      y: a * start.y + b * control.y + c * end.y,
      z: a * start.z + b * control.z + c * end.z,
    });
  }
  return points;
}
