import type { FishInput, FishState } from "@fishwar/game-types";

import type { MatchConfig } from "../config";
import { clamp } from "../math";

/** A sprint needs the button held, a direction to swim in, and stamina left. */
export function isSprinting(fish: FishState, input: FishInput): boolean {
  const moving = input.move.x !== 0 || input.move.z !== 0;
  return input.sprint && moving && fish.stamina > 0;
}

/** Top swim speed this tick: boosted by sprintMultiplier while sprinting. */
export function effectiveSwimSpeed(fish: FishState, input: FishInput, config: MatchConfig): number {
  const { swimSpeed, sprintMultiplier } = config.fish;
  return isSprinting(fish, input) ? swimSpeed * sprintMultiplier : swimSpeed;
}

export interface StaminaLoad {
  readonly sprinting: boolean;
  /** Current line tension; 0 when not hooked. */
  readonly tension: number;
}

/**
 * Sprinting and fighting line tension drain stamina; with neither, it
 * regenerates. Clamped to [0, maxStamina].
 */
export function stepStamina(
  stamina: number,
  load: StaminaLoad,
  config: MatchConfig,
  dt: number,
): number {
  const { maxStamina, sprintDrain, tensionDrain, staminaRegen } = config.fish;
  const drain = (load.sprinting ? sprintDrain : 0) + load.tension * tensionDrain;
  const rate = drain > 0 ? -drain : staminaRegen;
  return clamp(stamina + rate * dt, 0, maxStamina);
}
