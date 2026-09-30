import type { FishInput, FishState, HorizontalVec } from "@fishwar/game-types";

import type { MatchConfig } from "../config";
import { clamp } from "../math";

/** Below this horizontal speed the fish keeps its previous facing. */
const FACING_MIN_SPEED = 1e-3;

/** Scale `v` down so its length is at most `max`. */
function capMagnitude(v: HorizontalVec, max: number): HorizontalVec {
  const length = Math.hypot(v.x, v.z);
  if (length <= max) return v;
  const scale = max / length;
  return { x: v.x * scale, z: v.z * scale };
}

/** Move `current` toward `target` by at most `maxDelta`. */
function approach(current: HorizontalVec, target: HorizontalVec, maxDelta: number): HorizontalVec {
  const dx = target.x - current.x;
  const dz = target.z - current.z;
  const distance = Math.hypot(dx, dz);
  if (distance <= maxDelta) return target;
  const scale = maxDelta / distance;
  return { x: current.x + dx * scale, z: current.z + dz * scale };
}

/**
 * Horizontal swimming: velocity eases toward the input direction (capped at
 * swim speed), the fish is clamped inside the pond, and it faces its velocity.
 */
export function stepFishMovement(
  fish: FishState,
  input: FishInput,
  config: MatchConfig,
  dt: number,
): FishState {
  const { swimSpeed, acceleration, deceleration } = config.fish;
  const direction = capMagnitude(input.move, 1);
  const target = { x: direction.x * swimSpeed, z: direction.z * swimSpeed };
  const hasInput = direction.x !== 0 || direction.z !== 0;
  const rate = hasInput ? acceleration : deceleration;
  const velocity = approach({ x: fish.velocity.x, z: fish.velocity.z }, target, rate * dt);

  const halfWidth = config.pond.width / 2;
  const halfLength = config.pond.length / 2;
  const rawX = fish.position.x + velocity.x * dt;
  const rawZ = fish.position.z + velocity.z * dt;
  const x = clamp(rawX, -halfWidth, halfWidth);
  const z = clamp(rawZ, -halfLength, halfLength);

  const speed = Math.hypot(velocity.x, velocity.z);
  return {
    ...fish,
    position: { x, y: fish.position.y, z },
    velocity: {
      x: x === rawX ? velocity.x : 0,
      y: fish.velocity.y,
      z: z === rawZ ? velocity.z : 0,
    },
    yaw: speed > FACING_MIN_SPEED ? Math.atan2(velocity.x, velocity.z) : fish.yaw,
  };
}
