import type { FishermanInput, FishermanState, FishState } from "@fishwar/game-types";

import type { MatchConfig } from "../config";

export interface NetStep {
  readonly fisherman: FishermanState;
  readonly captured: boolean;
}

/** The fish is in the net's reach: close enough horizontally and near the surface. */
function isNettable(fisherman: FishermanState, fish: FishState, config: MatchConfig): boolean {
  const { range, maxDepth } = config.net;
  const horizontal = Math.hypot(
    fish.position.x - fisherman.position.x,
    fish.position.z - fisherman.position.z,
  );
  return horizontal <= range && fish.position.y >= -maxDepth;
}

/**
 * Net swing: with the button held and the cooldown elapsed, the fisherman
 * swings (starting the swing animation and the cooldown). The swing captures
 * the fish if it is within range and no deeper than maxDepth; otherwise it is
 * a whiff. Timers count down in sim time every tick.
 */
export function stepNet(
  fisherman: FishermanState,
  fish: FishState,
  input: FishermanInput,
  config: MatchConfig,
  dt: number,
): NetStep {
  const counted = {
    ...fisherman,
    netCooldown: Math.max(fisherman.netCooldown - dt, 0),
    netSwingTime: Math.max(fisherman.netSwingTime - dt, 0),
  };
  if (!input.net || fisherman.netCooldown > 0) return { fisherman: counted, captured: false };

  return {
    fisherman: {
      ...counted,
      netCooldown: config.net.cooldown,
      netSwingTime: config.net.swingSeconds,
    },
    captured: isNettable(fisherman, fish, config),
  };
}
