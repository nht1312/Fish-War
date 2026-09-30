import type { FishermanInput, FishermanState, HorizontalVec } from "@fishwar/game-types";

import type { MatchConfig } from "../config";

/** While the dodge i-frames last, water gun shots pass through the fisherman. */
export function isInvulnerable(fisherman: FishermanState): boolean {
  return fisherman.dodgeTime > 0;
}

/** Walking direction if there is one (normalised), else the fisherman's right. */
function dodgeDirection(fisherman: FishermanState, move: HorizontalVec): HorizontalVec {
  const length = Math.hypot(move.x, move.z);
  if (length > 0) return { x: move.x / length, z: move.z / length };
  // Right-hand side of the facing (sin yaw, cos yaw), with Y up.
  return { x: -Math.cos(fisherman.yaw), z: Math.sin(fisherman.yaw) };
}

/**
 * Dodge (after walking): with the button held and the cooldown elapsed, the
 * fisherman bursts at dodgeSpeed and gets dodgeIFrameSeconds of invulnerability.
 * Walking then eases the burst back down, and its dock clamp keeps him on the
 * dock. Both timers count down in sim time every tick.
 */
export function stepDodge(
  fisherman: FishermanState,
  input: FishermanInput,
  config: MatchConfig,
  dt: number,
): FishermanState {
  const { dodgeSpeed, dodgeIFrameSeconds, dodgeCooldown } = config.fisherman;
  const counted = {
    ...fisherman,
    dodgeCooldown: Math.max(fisherman.dodgeCooldown - dt, 0),
    dodgeTime: Math.max(fisherman.dodgeTime - dt, 0),
  };
  if (!input.dodge || fisherman.dodgeCooldown > 0) return counted;

  const direction = dodgeDirection(fisherman, input.move);
  return {
    ...counted,
    velocity: { x: direction.x * dodgeSpeed, y: 0, z: direction.z * dodgeSpeed },
    dodgeTime: dodgeIFrameSeconds,
    dodgeCooldown,
  };
}
