import type { MatchInputs, MatchState } from "@fishwar/game-types";

import type { MatchConfig } from "./config";
import { stepFishermanMovement } from "./systems/fishermanMovement";
import { stepFishMovement } from "./systems/fishMovement";
import { constrainToLine, rodTipPosition, stepLine } from "./systems/line";

const AT_REST = { x: 0, y: 0, z: 0 } as const;

/** Build the initial state of a match from its config. */
export function createMatch(config: MatchConfig): MatchState {
  return {
    tick: 0,
    time: 0,
    fish: { position: config.fishSpawn, velocity: AT_REST, yaw: 0 },
    fisherman: {
      position: config.fishermanSpawn,
      velocity: AT_REST,
      yaw: config.fisherman.spawnYaw,
      castHeld: false,
    },
    line: { phase: "idle" },
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
  const fisherman = stepFishermanMovement(state.fisherman, inputs.fisherman, config, dt);
  const swum = stepFishMovement(state.fish, inputs.fish, config, dt);
  const line = stepLine(state.line, fisherman, swum, inputs.fisherman, config);
  const fish =
    line.phase === "hooked"
      ? constrainToLine(swum, rodTipPosition(fisherman, config), line.length)
      : swum;

  return {
    ...state,
    tick: state.tick + 1,
    time: state.time + dt,
    fish,
    line,
    fisherman: { ...fisherman, castHeld: inputs.fisherman.cast },
  };
}
