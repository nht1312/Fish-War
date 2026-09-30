import type {
  FishInput,
  FishState,
  LineState,
  MatchInputs,
  MatchOutcome,
  MatchState,
  Vec3,
} from "@fishwar/game-types";

import type { MatchConfig } from "./config";
import { stepFishermanMovement } from "./systems/fishermanMovement";
import { stepFishMovement } from "./systems/fishMovement";
import { constrainToLine, rodTipPosition, stepLine } from "./systems/line";
import { linePull, stepTension } from "./systems/tension";

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
    outcome: null,
  };
}

const LINE_BROKEN: MatchOutcome = { winner: "fish", reason: "line-broken" };

interface HookedFight {
  readonly line: LineState;
  readonly fish: FishState;
  readonly outcome: MatchOutcome | null;
}

/** The hooked fish is held by the line, pulls on it, and may snap it. */
function stepHookedFight(
  line: Extract<LineState, { phase: "hooked" }>,
  swum: FishState,
  fishInput: FishInput,
  tip: Vec3,
  config: MatchConfig,
  dt: number,
): HookedFight {
  const fish = constrainToLine(swum, tip, line.length);
  const pull = linePull(fish, fishInput, tip, line.length, config);
  const { broken, tension, overTensionTime } = stepTension(line, pull, config, dt);
  if (broken) return { line: { phase: "idle" }, fish, outcome: LINE_BROKEN };
  return { line: { ...line, tension, overTensionTime }, fish, outcome: null };
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
  const fight =
    line.phase === "hooked"
      ? stepHookedFight(line, swum, inputs.fish, rodTipPosition(fisherman, config), config, dt)
      : { line, fish: swum, outcome: null };

  return {
    ...state,
    tick: state.tick + 1,
    time: state.time + dt,
    fish: fight.fish,
    line: fight.line,
    fisherman: { ...fisherman, castHeld: inputs.fisherman.cast },
    outcome: state.outcome ?? fight.outcome,
  };
}
