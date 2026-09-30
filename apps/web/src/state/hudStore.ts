import type { MatchConfig } from "@fishwar/game-core";
import type { MatchState } from "@fishwar/game-types";
import { create } from "zustand";

/** Read-only HUD values mirrored from the sim. Never read back into gameplay. */
export interface HudState {
  readonly lineHooked: boolean;
  /** Line tension as a fraction of breakStrength, 0..1. */
  readonly tensionRatio: number;
  /** Reel drag as a fraction of breakStrength, 0..1. */
  readonly dragRatio: number;
  /** Fish stamina as a fraction of maxStamina, 0..1. */
  readonly staminaRatio: number;
}

export const useHudStore = create<HudState>(() => ({
  lineHooked: false,
  tensionRatio: 0,
  dragRatio: 0,
  staminaRatio: 1,
}));

/** Derive the HUD values from the current sim state. */
export function selectHud(state: MatchState, config: MatchConfig): HudState {
  const { breakStrength } = config.tension;
  const { line } = state;
  return {
    lineHooked: line.phase === "hooked",
    tensionRatio: line.phase === "hooked" ? line.tension / breakStrength : 0,
    dragRatio: state.fisherman.drag / breakStrength,
    staminaRatio: state.fish.stamina / config.fish.maxStamina,
  };
}
