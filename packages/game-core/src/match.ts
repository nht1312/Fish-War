import type { MatchInputs, MatchOutcome, MatchState } from "@fishwar/game-types";

import type { MatchConfig } from "./config";
import { stepFishermanMovement } from "./systems/fishermanMovement";
import { stepFishMovement } from "./systems/fishMovement";
import { stepHookedFight } from "./systems/fight";
import { rodTipPosition, stepLine } from "./systems/line";
import { stepDrag } from "./systems/reel";
import { isSprinting, stepStamina } from "./systems/stamina";

const AT_REST = { x: 0, y: 0, z: 0 } as const;

/** Build the initial state of a match from its config. */
export function createMatch(config: MatchConfig): MatchState {
  return {
    tick: 0,
    time: 0,
    fish: {
      position: config.fishSpawn,
      velocity: AT_REST,
      yaw: 0,
      stamina: config.fish.maxStamina,
    },
    fisherman: {
      position: config.fishermanSpawn,
      velocity: AT_REST,
      yaw: config.fisherman.spawnYaw,
      castHeld: false,
      drag: config.reel.initialDrag,
    },
    line: { phase: "idle" },
    outcome: null,
  };
}

const FISH_EXHAUSTED: MatchOutcome = { winner: "fisherman", reason: "fish-exhausted" };

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
  const walked = stepFishermanMovement(state.fisherman, inputs.fisherman, config, dt);
  const fisherman = {
    ...walked,
    drag: stepDrag(walked.drag, inputs.fisherman.dragChange, config, dt),
  };
  const swum = stepFishMovement(state.fish, inputs.fish, config, dt);
  const line = stepLine(state.line, fisherman, swum, inputs.fisherman, config);
  const fight =
    line.phase === "hooked"
      ? stepHookedFight(
          line,
          swum,
          inputs.fish,
          inputs.fisherman,
          fisherman.drag,
          rodTipPosition(fisherman, config),
          config,
          dt,
        )
      : { line, fish: swum, outcome: null };

  const stamina = stepStamina(
    state.fish.stamina,
    {
      sprinting: isSprinting(state.fish, inputs.fish),
      tension: fight.line.phase === "hooked" ? fight.line.tension : 0,
    },
    config,
    dt,
  );
  const exhausted = fight.line.phase === "hooked" && stamina === 0 ? FISH_EXHAUSTED : null;

  return {
    ...state,
    tick: state.tick + 1,
    time: state.time + dt,
    fish: { ...fight.fish, stamina },
    line: fight.line,
    fisherman: { ...fisherman, castHeld: inputs.fisherman.cast },
    outcome: state.outcome ?? fight.outcome ?? exhausted,
  };
}
