import type { MatchState } from "@fishwar/game-types";

import type { MatchConfig } from "./config";

/** Build the initial state of a match from its config. */
export function createMatch(config: MatchConfig): MatchState {
  return {
    tick: 0,
    time: 0,
    fish: { position: config.fishSpawn },
    fisherman: { position: config.fishermanSpawn },
  };
}

/**
 * Advance the match by one fixed tick of `dt` seconds. Pure: returns a new
 * state and never mutates its input. Gameplay systems are composed in here.
 */
export function stepMatch(state: MatchState, dt: number): MatchState {
  return { ...state, tick: state.tick + 1, time: state.time + dt };
}
