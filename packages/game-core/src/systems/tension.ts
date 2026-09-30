import type { FishInput, FishState, Vec3 } from "@fishwar/game-types";

import type { MatchConfig } from "../config";
import { effectiveSwimSpeed } from "./stamina";

export interface TensionState {
  readonly tension: number;
  /** Seconds tension has been continuously at breakStrength. */
  readonly overTensionTime: number;
}

export interface TensionStep extends TensionState {
  readonly broken: boolean;
  /** Tension wanted to exceed the drag, so the reel should let line out. */
  readonly slipping: boolean;
}

/**
 * How hard the fish is pulling on the line: its intended swim speed directly
 * away from the rod tip (horizontally), counted only while the line is taut.
 * Intent is used, not actual velocity, because the line cancels outward motion.
 */
export function linePull(
  fish: FishState,
  input: FishInput,
  tip: Vec3,
  length: number,
  config: MatchConfig,
): number {
  const dx = fish.position.x - tip.x;
  const dz = fish.position.z - tip.z;
  const distance = Math.hypot(dx, fish.position.y - tip.y, dz);
  const horizontal = Math.hypot(dx, dz);
  if (distance < length - config.tension.tautTolerance || horizontal === 0) return 0;

  const inputLength = Math.hypot(input.move.x, input.move.z);
  const scale = effectiveSwimSpeed(fish, input, config) / Math.max(inputLength, 1);
  const outward = (input.move.x * dx + input.move.z * dz) / horizontal;
  return Math.max(outward * scale, 0);
}

/**
 * Advance line tension by one tick. Pull builds tension, which decays
 * constantly. Tension is held at `dragLimit` (the reel slips instead) and never
 * exceeds breakStrength; staying at breakStrength longer than
 * breakGraceSeconds breaks the line. Pass Infinity when the reel cannot slip.
 */
export function stepTension(
  current: TensionState,
  pull: number,
  dragLimit: number,
  config: MatchConfig,
  dt: number,
): TensionStep {
  const { pullToTension, decayRate, breakStrength, breakGraceSeconds } = config.tension;
  const limit = Math.min(dragLimit, breakStrength);
  const raw = current.tension + (pull * pullToTension - decayRate) * dt;
  const tension = Math.min(Math.max(raw, 0), limit);
  const overTensionTime = tension >= breakStrength ? current.overTensionTime + dt : 0;
  return {
    tension,
    overTensionTime,
    broken: overTensionTime > breakGraceSeconds,
    slipping: raw > limit && limit < breakStrength,
  };
}
