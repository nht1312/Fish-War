import type { MatchState, Projectile, Vec3 } from "@fishwar/game-types";

import { clamp } from "./math";

const TWO_PI = Math.PI * 2;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) };
}

/** Blend two headings the short way round. */
function lerpAngle(a: number, b: number, t: number): number {
  const delta = ((((b - a + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI) - Math.PI;
  return a + delta * t;
}

/**
 * Shots are blended only when both snapshots carry the same shots (same count,
 * each one older in `b`); otherwise a shot appeared or vanished, so use `b`'s.
 */
function blendProjectiles(
  a: readonly Projectile[],
  b: readonly Projectile[],
  t: number,
): readonly Projectile[] {
  const sameShots =
    a.length === b.length && b.every((shot, i) => shot.age > (a[i]?.age ?? Infinity));
  if (!sameShots || t >= 1) return b;
  return b.map((shot, i) => {
    const from = a[i] ?? shot;
    return { ...shot, position: lerpVec3(from.position, shot.position, t) };
  });
}

/**
 * A state between snapshots `a` (older) and `b` (newer), for smooth rendering.
 * Positions, headings and shots are blended by `t` (clamped to [0, 1]); every
 * discrete field (phase, line, timers, outcome, cooldowns) comes from `b`.
 * Rendering only: never feed the result back into the simulation.
 */
export function interpolateState(a: MatchState, b: MatchState, t: number): MatchState {
  const k = clamp(t, 0, 1);
  if (k >= 1) return b;
  return {
    ...b,
    fish: {
      ...b.fish,
      position: lerpVec3(a.fish.position, b.fish.position, k),
      yaw: lerpAngle(a.fish.yaw, b.fish.yaw, k),
    },
    fisherman: {
      ...b.fisherman,
      position: lerpVec3(a.fisherman.position, b.fisherman.position, k),
      yaw: lerpAngle(a.fisherman.yaw, b.fisherman.yaw, k),
    },
    projectiles: blendProjectiles(a.projectiles, b.projectiles, k),
  };
}
