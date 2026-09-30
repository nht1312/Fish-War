import type { HorizontalVec } from "@fishwar/game-types";

import { clamp } from "../math";

/** Below this speed a body keeps its previous facing. */
const FACING_MIN_SPEED = 1e-3;

export interface KinematicParams {
  readonly maxSpeed: number;
  /** Rate of velocity change toward the input (m/s²). */
  readonly acceleration: number;
  /** Rate of velocity change back to rest without input (m/s²). */
  readonly deceleration: number;
}

/** Axis-aligned rectangle in the XZ plane. */
export interface Bounds2D {
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
}

/** The horizontal part of anything that walks or swims. */
export interface PlanarBody {
  readonly position: HorizontalVec;
  readonly velocity: HorizontalVec;
  /** Heading around the Y axis in radians; 0 faces +Z. */
  readonly yaw: number;
}

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
 * One tick of horizontal movement: velocity eases toward the input direction
 * (input longer than 1 is normalised), the body is clamped to `bounds` with its
 * velocity into a wall dropped, and it faces its velocity.
 */
export function integrateKinematic(
  body: PlanarBody,
  move: HorizontalVec,
  params: KinematicParams,
  bounds: Bounds2D,
  dt: number,
): PlanarBody {
  const direction = capMagnitude(move, 1);
  const target = { x: direction.x * params.maxSpeed, z: direction.z * params.maxSpeed };
  const hasInput = direction.x !== 0 || direction.z !== 0;
  const rate = hasInput ? params.acceleration : params.deceleration;
  const velocity = approach(body.velocity, target, rate * dt);

  const rawX = body.position.x + velocity.x * dt;
  const rawZ = body.position.z + velocity.z * dt;
  const x = clamp(rawX, bounds.minX, bounds.maxX);
  const z = clamp(rawZ, bounds.minZ, bounds.maxZ);

  const speed = Math.hypot(velocity.x, velocity.z);
  return {
    position: { x, z },
    velocity: { x: x === rawX ? velocity.x : 0, z: z === rawZ ? velocity.z : 0 },
    yaw: speed > FACING_MIN_SPEED ? Math.atan2(velocity.x, velocity.z) : body.yaw,
  };
}
