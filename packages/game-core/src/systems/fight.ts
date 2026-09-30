import type {
  FishermanInput,
  FishInput,
  FishState,
  LineState,
  MatchOutcome,
  Vec3,
} from "@fishwar/game-types";

import type { MatchConfig } from "../config";
import { constrainToLine } from "./line";
import { payOutLine, reelInLine } from "./reel";
import { linePull, stepTension } from "./tension";

type HookedLine = Extract<LineState, { phase: "hooked" }>;

const LINE_BROKEN: MatchOutcome = { winner: "fish", reason: "line-broken" };

export interface FightStep {
  readonly line: LineState;
  readonly fish: FishState;
  readonly outcome: MatchOutcome | null;
}

/**
 * One tick of the fight on the line: the reel shortens the line, the line holds
 * the fish, the fish's pull (plus the rod's, while reeling against it) builds
 * tension, the drag lets line out when tension exceeds it, and too much tension
 * for too long snaps the line.
 */
export function stepHookedFight(
  line: HookedLine,
  swum: FishState,
  fishInput: FishInput,
  fishermanInput: FishermanInput,
  drag: number,
  tip: Vec3,
  config: MatchConfig,
  dt: number,
): FightStep {
  const reeling = fishermanInput.cast;
  const reeledLength = reelInLine(line.length, reeling, config, dt);
  const fish = constrainToLine(swum, tip, reeledLength);

  const fishPull = linePull(fish, fishInput, tip, reeledLength, config);
  const rodPull = reeling && fishPull > 0 ? config.reel.reelSpeed * config.reel.rodForce : 0;
  const canSlip = reeledLength < config.reel.maxLength;
  const tension = stepTension(
    line,
    fishPull + rodPull,
    canSlip ? drag : Number.POSITIVE_INFINITY,
    config,
    dt,
  );

  if (tension.broken) return { line: { phase: "idle" }, fish, outcome: LINE_BROKEN };

  const length = tension.slipping ? payOutLine(reeledLength, fishPull, config, dt) : reeledLength;
  return {
    line: {
      ...line,
      length,
      tension: tension.tension,
      overTensionTime: tension.overTensionTime,
    },
    fish,
    outcome: null,
  };
}
