import type {
  FishInput,
  FishState,
  LineState,
  Vec3,
} from "@fishwar/game-types";

import type { MatchConfig } from "../config";
import { constrainToLine } from "./line";
import { payOutLine, reelInLine } from "./reel";
import { linePull, stepTension } from "./tension";

type HookedLine = Extract<LineState, { phase: "hooked" }>;

export interface FightStep {
  readonly line: LineState;
  readonly fish: FishState;
  readonly lineBroken: boolean;
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
  reeling: boolean,
  drag: number,
  tip: Vec3,
  config: MatchConfig,
  dt: number,
): FightStep {
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

  if (tension.broken) return { line: { phase: "idle" }, fish, lineBroken: true };

  const length = tension.slipping ? payOutLine(reeledLength, fishPull, config, dt) : reeledLength;
  return {
    line: {
      ...line,
      length,
      tension: tension.tension,
      overTensionTime: tension.overTensionTime,
    },
    fish,
    lineBroken: false,
  };
}
