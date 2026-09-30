import type { MatchConfig } from "@fishwar/game-core";
import type { MatchState } from "@fishwar/game-types";
import { create } from "zustand";

/** Read-only HUD values mirrored from the sim. Never read back into gameplay. */
export interface HudState {
  readonly lineHooked: boolean;
  /** Line tension as a fraction of breakStrength, 0..1. */
  readonly tensionRatio: number;
}

export const useHudStore = create<HudState>(() => ({ lineHooked: false, tensionRatio: 0 }));

/** Derive the HUD values from the current sim state. */
export function selectHud(state: MatchState, config: MatchConfig): HudState {
  if (state.line.phase !== "hooked") return { lineHooked: false, tensionRatio: 0 };
  return {
    lineHooked: true,
    tensionRatio: state.line.tension / config.tension.breakStrength,
  };
}
