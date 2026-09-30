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

/** Whether the fish is close enough to y = 0 to count as surfaced. */
export function isAtSurface(fish: FishState, config: MatchConfig): boolean {
  return fish.position.y >= -config.fish.surfaceTolerance;
}

/** Vertical velocity this tick: down while diving, otherwise back up. */
function verticalVelocity(input: FishInput, config: MatchConfig): number {
  return input.dive ? -config.fish.diveSpeed : config.fish.surfaceSpeed;
}

/**
 * Horizontal swimming: velocity eases toward the input direction (capped at
 * swim speed), the fish dives or rises between the floor and the surface, it is
 * clamped inside the pond, and it faces its horizontal velocity.
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

  const vy = verticalVelocity(input, config);
  const rawY = fish.position.y + vy * dt;
  const y = clamp(rawY, -config.pond.depth, 0);

  const speed = Math.hypot(velocity.x, velocity.z);
  return {
    ...fish,
    position: { x, y, z },
    velocity: {
      x: x === rawX ? velocity.x : 0,
      y: y === rawY ? vy : 0,
      z: z === rawZ ? velocity.z : 0,
    },
    yaw: speed > FACING_MIN_SPEED ? Math.atan2(velocity.x, velocity.z) : fish.yaw,
  };
}
