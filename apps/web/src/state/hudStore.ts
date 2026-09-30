import type { MatchConfig } from "@fishwar/game-core";
import type { MatchOutcome, MatchPhase, MatchState } from "@fishwar/game-types";
import { create } from "zustand";

import type { ConnectionStatus } from "../net/connection";

/** Read-only HUD values mirrored from the sim. Never read back into gameplay. */
export interface HudState {
  readonly lineHooked: boolean;
  /** Line tension as a fraction of breakStrength, 0..1. */
  readonly tensionRatio: number;
  /** Reel drag as a fraction of breakStrength, 0..1. */
  readonly dragRatio: number;
  /** Fish stamina as a fraction of maxStamina, 0..1. */
  readonly staminaRatio: number;
  /** Fisherman balance as a fraction of maxBalance, 0..1. */
  readonly balanceRatio: number;
  readonly phase: MatchPhase;
  /** Seconds left before play starts. */
  readonly countdown: number;
  /** Seconds of play left. */
  readonly timeLeft: number;
  readonly outcome: MatchOutcome | null;
  /** Online connection status; null offline. */
  readonly connection: ConnectionStatus | null;
}

export const useHudStore = create<HudState>(() => ({
  lineHooked: false,
  tensionRatio: 0,
  dragRatio: 0,
  staminaRatio: 1,
  balanceRatio: 1,
  phase: "countdown",
  countdown: 0,
  timeLeft: 0,
  outcome: null,
  connection: null,
}));

/** Derive the HUD values from the current sim state and connection. */
export function selectHud(
  state: MatchState,
  config: MatchConfig,
  connection: ConnectionStatus | null,
): HudState {
  const { breakStrength } = config.tension;
  const { line } = state;
  return {
    lineHooked: line.phase === "hooked",
    tensionRatio: line.phase === "hooked" ? line.tension / breakStrength : 0,
    dragRatio: state.fisherman.drag / breakStrength,
    staminaRatio: state.fish.stamina / config.fish.maxStamina,
    balanceRatio: state.fisherman.balance / config.waterGun.maxBalance,
    phase: state.phase,
    countdown: state.countdown,
    timeLeft: state.timeLeft,
    outcome: state.outcome,
    connection,
  };
}
