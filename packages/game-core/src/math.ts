/** Clamp a value into the inclusive [min, max] range. */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new Error(`clamp: min (${min}) must be <= max (${max})`);
  }
  return Math.min(Math.max(value, min), max);
}
