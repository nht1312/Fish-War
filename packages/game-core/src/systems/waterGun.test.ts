import type {
  FishermanState,
  FishInput,
  FishState,
  Projectile,
  Vec3,
} from "@fishwar/game-types";
import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../config";
import { fireWaterGun, fishermanTarget, stepBalance, stepProjectiles } from "./waterGun";

const DT = 1 / DEFAULT_CONFIG.tickRate;
const { waterGun: GUN } = DEFAULT_CONFIG;

const fisherman: FishermanState = {
  position: { x: 0, y: DEFAULT_CONFIG.dock.height, z: 17 },
  velocity: { x: 0, y: 0, z: 0 },
  yaw: Math.PI,
  castHeld: false,
  drag: DEFAULT_CONFIG.reel.initialDrag,
  balance: GUN.maxBalance,
  staggerTime: 0,
  dodgeCooldown: 0,
  dodgeTime: 0,
};
const target = fishermanTarget(fisherman, DEFAULT_CONFIG);

const surfaced: FishState = {
  position: { x: 3, y: 0, z: 2 },
  velocity: { x: 0, y: 0, z: 0 },
  yaw: 0,
  stamina: DEFAULT_CONFIG.fish.maxStamina,
  dashCooldown: 0,
  shotCooldown: 0,
};

const shoot = (on: boolean): FishInput => ({
  move: { x: 0, z: 0 },
  dive: false,
  sprint: false,
  dash: false,
  shoot: on,
});

describe("fishermanTarget", () => {
  it("is the fisherman's torso, above his feet", () => {
    expect(target).toEqual({ x: 0, y: DEFAULT_CONFIG.dock.height + GUN.targetHeight, z: 17 });
  });
});

describe("fireWaterGun", () => {
  it("fires from the water surface at the fish and starts the cooldown", () => {
    const { fish, projectile } = fireWaterGun(surfaced, shoot(true), target, DEFAULT_CONFIG, DT);
    expect(projectile?.position).toEqual({ x: 3, y: 0, z: 2 });
    expect(projectile?.age).toBe(0);
    expect(fish.shotCooldown).toBe(GUN.shotCooldown);
  });

  it("aims so the shot arcs into the fisherman's torso", () => {
    const { projectile } = fireWaterGun(surfaced, shoot(true), target, DEFAULT_CONFIG, DT);
    if (!projectile) throw new Error("expected a shot");
    let shots: readonly Projectile[] = [projectile];
    let hits = 0;
    for (let i = 0; i < 120 && shots.length > 0; i++) {
      const step = stepProjectiles(shots, target, false, DEFAULT_CONFIG, DT);
      shots = step.projectiles;
      hits += step.hits;
    }
    expect(hits).toBe(1);
  });

  it("cannot fire from below the surface", () => {
    const deep = { ...surfaced, position: { ...surfaced.position, y: -2 } };
    expect(fireWaterGun(deep, shoot(true), target, DEFAULT_CONFIG, DT).projectile).toBeNull();
  });

  it("cannot fire during the cooldown, which counts down", () => {
    const cooling = { ...surfaced, shotCooldown: 0.5 };
    const { fish, projectile } = fireWaterGun(cooling, shoot(true), target, DEFAULT_CONFIG, DT);
    expect(projectile).toBeNull();
    expect(fish.shotCooldown).toBeCloseTo(0.5 - DT);
  });

  it("does not fire without the button", () => {
    expect(fireWaterGun(surfaced, shoot(false), target, DEFAULT_CONFIG, DT).projectile).toBeNull();
  });
});

describe("stepProjectiles", () => {
  const shot = (position: Vec3, velocity: Vec3, age = 0): Projectile => ({ position, velocity, age });
  const far: Vec3 = { x: 100, y: 0, z: 100 };

  it("moves shots ballistically and ages them", () => {
    const { projectiles } = stepProjectiles(
      [shot({ x: 0, y: 1, z: 0 }, { x: 2, y: 5, z: 0 })],
      far,
      false,
      DEFAULT_CONFIG,
      DT,
    );
    const [moved] = projectiles;
    expect(moved?.velocity.y).toBeCloseTo(5 - GUN.gravity * DT);
    expect(moved?.position.x).toBeCloseTo(2 * DT);
    expect(moved?.age).toBeCloseTo(DT);
  });

  it("removes a shot that hits the target and counts the hit", () => {
    const result = stepProjectiles([shot(target, { x: 0, y: 0, z: 0 })], target, false, DEFAULT_CONFIG, DT);
    expect(result.hits).toBe(1);
    expect(result.projectiles).toHaveLength(0);
  });

  it("lets shots pass through an invulnerable (dodging) target", () => {
    const result = stepProjectiles([shot(target, { x: 0, y: 0, z: 0 })], target, true, DEFAULT_CONFIG, DT);
    expect(result.hits).toBe(0);
    expect(result.projectiles).toHaveLength(1);
  });

  it("removes shots that fall back into the water or get too old", () => {
    const falling = shot({ x: 0, y: 0.01, z: 0 }, { x: 0, y: -5, z: 0 });
    const old = shot({ x: 0, y: 5, z: 0 }, { x: 0, y: 0, z: 0 }, GUN.maxShotAge);
    const result = stepProjectiles([falling, old], far, false, DEFAULT_CONFIG, DT);
    expect(result.projectiles).toHaveLength(0);
    expect(result.hits).toBe(0);
  });
});

describe("stepBalance", () => {
  it("each hit costs balance and staggers the fisherman", () => {
    const hit = stepBalance(fisherman, 1, DEFAULT_CONFIG, DT);
    expect(hit.balance).toBe(GUN.maxBalance - GUN.hitDamage);
    expect(hit.staggerTime).toBe(GUN.staggerSeconds);
  });

  it("regenerates balance without hits, up to the max", () => {
    const shaken = { ...fisherman, balance: 50 };
    expect(stepBalance(shaken, 0, DEFAULT_CONFIG, DT).balance).toBeCloseTo(50 + GUN.balanceRegen * DT);
    expect(stepBalance(fisherman, 0, DEFAULT_CONFIG, DT).balance).toBe(GUN.maxBalance);
  });

  it("counts the stagger down and never below zero", () => {
    const staggered = { ...fisherman, staggerTime: DT / 2 };
    expect(stepBalance(staggered, 0, DEFAULT_CONFIG, DT).staggerTime).toBe(0);
  });

  it("never drops balance below zero", () => {
    expect(stepBalance({ ...fisherman, balance: 5 }, 3, DEFAULT_CONFIG, DT).balance).toBe(0);
  });
});
