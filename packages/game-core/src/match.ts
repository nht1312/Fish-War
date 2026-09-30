import type { MatchInputs, MatchState } from "@fishwar/game-types";

import type { MatchConfig } from "./config";
import { stepFishMovement } from "./systems/fishMovement";

const AT_REST = { x: 0, y: 0, z: 0 } as const;

/** Build the initial state of a match from its config. */
export function createMatch(config: MatchConfig): MatchState {
  return {
    tick: 0,
    time: 0,
    fish: { position: config.fishSpawn, velocity: AT_REST, yaw: 0 },
    fisherman: { position: config.fishermanSpawn },
  };
}

/**
 * Advance the match by one fixed tick of `dt` seconds. Pure: returns a new
 * state and never mutates its input. Gameplay systems are composed in here.
 */
export function stepMatch(
  state: MatchState,
  inputs: MatchInputs,
  config: MatchConfig,
  dt: number,
): MatchState {
  return {
    ...state,
    tick: state.tick + 1,
    time: state.time + dt,
    fish: stepFishMovement(state.fish, inputs.fish, config, dt),
  };
}
