import type { MatchConfig } from "../config";
import { clamp } from "../math";

/** Reeling shortens the line at reelSpeed, never below minLength. */
export function reelInLine(length: number, reeling: boolean, config: MatchConfig, dt: number): number {
  if (!reeling) return length;
  return Math.max(length - config.reel.reelSpeed * dt, config.reel.minLength);
}

/** A slipping drag lets line out at the fish's pull speed, up to maxLength. */
export function payOutLine(length: number, pull: number, config: MatchConfig, dt: number): number {
  return Math.min(length + pull * dt, config.reel.maxLength);
}

/** Drag moves at dragAdjustRate in the input direction, within [minDrag, maxDrag]. */
export function stepDrag(drag: number, change: number, config: MatchConfig, dt: number): number {
  const { dragAdjustRate, minDrag, maxDrag } = config.reel;
  return clamp(drag + clamp(change, -1, 1) * dragAdjustRate * dt, minDrag, maxDrag);
}
