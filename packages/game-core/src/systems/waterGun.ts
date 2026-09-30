import type {
  FishermanState,
  FishInput,
  FishState,
  Projectile,
  Vec3,
} from "@fishwar/game-types";

import type { MatchConfig } from "../config";
import { isAtSurface } from "./fishMovement";

/** The point shots aim at and hit: the fisherman's torso. */
export function fishermanTarget(fisherman: FishermanState, config: MatchConfig): Vec3 {
  const { x, y, z } = fisherman.position;
  return { x, y: y + config.waterGun.targetHeight, z };
}

/**
 * Launch velocity for a ballistic shot from `origin` that reaches `target`
 * after flying at roughly shotSpeed: straight-line velocity over the flight
 * time, plus the upward speed gravity will take away on the way.
 */
function aimVelocity(origin: Vec3, target: Vec3, config: MatchConfig): Vec3 {
  const { shotSpeed, gravity } = config.waterGun;
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const dz = target.z - origin.z;
  const flightTime = Math.hypot(dx, dy, dz) / shotSpeed;
  return {
    x: dx / flightTime,
    y: dy / flightTime + 0.5 * gravity * flightTime,
    z: dz / flightTime,
  };
}

export interface FireStep {
  readonly fish: FishState;
  readonly projectile: Projectile | null;
}

/** With the button held, off cooldown and at the surface, the fish fires a shot. */
export function fireWaterGun(
  fish: FishState,
  input: FishInput,
  target: Vec3,
  config: MatchConfig,
  dt: number,
): FireStep {
  const cooldown = Math.max(fish.shotCooldown - dt, 0);
  const canFire = input.shoot && fish.shotCooldown <= 0 && isAtSurface(fish, config);
  if (!canFire) return { fish: { ...fish, shotCooldown: cooldown }, projectile: null };

  const origin = { x: fish.position.x, y: 0, z: fish.position.z };
  return {
    fish: { ...fish, shotCooldown: config.waterGun.shotCooldown },
    projectile: { position: origin, velocity: aimVelocity(origin, target, config), age: 0 },
  };
}

export interface ProjectileStep {
  readonly projectiles: readonly Projectile[];
  readonly hits: number;
}

function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/**
 * Move shots under gravity. A shot within hitRadius of the target hits and is
 * removed; shots falling back into the water or older than maxShotAge expire.
 */
export function stepProjectiles(
  projectiles: readonly Projectile[],
  target: Vec3,
  config: MatchConfig,
  dt: number,
): ProjectileStep {
  const { gravity, hitRadius, maxShotAge } = config.waterGun;
  const flying: Projectile[] = [];
  let hits = 0;

  for (const shot of projectiles) {
    const velocity = { ...shot.velocity, y: shot.velocity.y - gravity * dt };
    const position = {
      x: shot.position.x + velocity.x * dt,
      y: shot.position.y + velocity.y * dt,
      z: shot.position.z + velocity.z * dt,
    };
    const age = shot.age + dt;

    if (distance(position, target) <= hitRadius) {
      hits += 1;
    } else if (!(position.y < 0 && velocity.y < 0) && age <= maxShotAge) {
      flying.push({ position, velocity, age });
    }
  }
  return { projectiles: flying, hits };
}

/**
 * Hits knock balance off and stagger the fisherman (no reeling). Without hits,
 * balance regenerates and the stagger wears off. Balance stays in [0, max].
 */
export function stepBalance(
  fisherman: FishermanState,
  hits: number,
  config: MatchConfig,
  dt: number,
): FishermanState {
  const { hitDamage, maxBalance, balanceRegen, staggerSeconds } = config.waterGun;
  if (hits > 0) {
    return {
      ...fisherman,
      balance: Math.max(fisherman.balance - hits * hitDamage, 0),
      staggerTime: staggerSeconds,
    };
  }
  return {
    ...fisherman,
    balance: Math.min(fisherman.balance + balanceRegen * dt, maxBalance),
    staggerTime: Math.max(fisherman.staggerTime - dt, 0),
  };
}

export interface WaterGunStep {
  readonly fish: FishState;
  readonly fisherman: FishermanState;
  readonly projectiles: readonly Projectile[];
  readonly knockedOut: boolean;
}

/** One tick of the water gun: shots in the air fly and hit, then the fish may fire. */
export function stepWaterGun(
  fish: FishState,
  fisherman: FishermanState,
  projectiles: readonly Projectile[],
  input: FishInput,
  config: MatchConfig,
  dt: number,
): WaterGunStep {
  const target = fishermanTarget(fisherman, config);
  const flown = stepProjectiles(projectiles, target, config, dt);
  const fired = fireWaterGun(fish, input, target, config, dt);
  const struck = stepBalance(fisherman, flown.hits, config, dt);

  return {
    fish: fired.fish,
    fisherman: struck,
    projectiles: fired.projectile ? [...flown.projectiles, fired.projectile] : flown.projectiles,
    knockedOut: struck.balance === 0,
  };
}
