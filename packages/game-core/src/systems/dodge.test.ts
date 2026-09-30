import type { FishermanInput, FishermanState } from "@fishwar/game-types";
import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../config";
import { isInvulnerable, stepDodge } from "./dodge";

const DT = 1 / DEFAULT_CONFIG.tickRate;
const { fisherman: FISHERMAN } = DEFAULT_CONFIG;

const ready: FishermanState = {
  position: { x: 0, y: DEFAULT_CONFIG.dock.height, z: 17 },
  velocity: { x: 0, y: 0, z: 0 },
  // Facing the pond (-Z).
  yaw: Math.PI,
  castHeld: false,
  drag: DEFAULT_CONFIG.reel.initialDrag,
  balance: DEFAULT_CONFIG.waterGun.maxBalance,
  staggerTime: 0,
  dodgeCooldown: 0,
  dodgeTime: 0,
  netCooldown: 0,
  netSwingTime: 0,
};

const dodge = (on: boolean, x = 0, z = 0): FishermanInput => ({
  move: { x, z },
  cast: false,
  dragChange: 0,
  dodge: on,
  net: false,
});

describe("stepDodge", () => {
  it("bursts in the walking direction, starts the i-frames and the cooldown", () => {
    const next = stepDodge(ready, dodge(true, -1, 0), DEFAULT_CONFIG, DT);
    expect(next.velocity.x).toBeCloseTo(-FISHERMAN.dodgeSpeed);
    expect(next.velocity.z).toBeCloseTo(0);
    expect(next.dodgeTime).toBe(FISHERMAN.dodgeIFrameSeconds);
    expect(next.dodgeCooldown).toBe(FISHERMAN.dodgeCooldown);
    expect(isInvulnerable(next)).toBe(true);
  });

  it("normalises diagonal walking input", () => {
    const next = stepDodge(ready, dodge(true, 1, 1), DEFAULT_CONFIG, DT);
    expect(Math.hypot(next.velocity.x, next.velocity.z)).toBeCloseTo(FISHERMAN.dodgeSpeed);
  });

  it("sidesteps to the fisherman's right when standing still", () => {
    // Facing -Z, his right is +X.
    const next = stepDodge(ready, dodge(true), DEFAULT_CONFIG, DT);
    expect(next.velocity.x).toBeCloseTo(FISHERMAN.dodgeSpeed);
    expect(next.velocity.z).toBeCloseTo(0);
  });

  it("does nothing during the cooldown except count it and the i-frames down", () => {
    const cooling = { ...ready, dodgeCooldown: 1, dodgeTime: 0.2 };
    const next = stepDodge(cooling, dodge(true, 1, 0), DEFAULT_CONFIG, DT);
    expect(next.velocity).toEqual(ready.velocity);
    expect(next.dodgeCooldown).toBeCloseTo(1 - DT);
    expect(next.dodgeTime).toBeCloseTo(0.2 - DT);
  });

  it("does nothing without the button, and timers never go negative", () => {
    const almost = { ...ready, dodgeCooldown: DT / 2, dodgeTime: DT / 2 };
    const next = stepDodge(almost, dodge(false), DEFAULT_CONFIG, DT);
    expect(next.dodgeCooldown).toBe(0);
    expect(next.dodgeTime).toBe(0);
    expect(isInvulnerable(next)).toBe(false);
  });
});
