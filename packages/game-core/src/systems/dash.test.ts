import type { FishInput, FishState, LineState } from "@fishwar/game-types";
import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../config";
import { applyTensionSpike, stepDash } from "./dash";

const DT = 1 / DEFAULT_CONFIG.tickRate;
const { fish: FISH, tension: TENSION } = DEFAULT_CONFIG;

const ready: FishState = {
  position: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  // Facing +X.
  yaw: Math.PI / 2,
  stamina: FISH.maxStamina,
  dashCooldown: 0,
};

const input = (dash: boolean): FishInput => ({
  move: { x: 0, z: 0 },
  dive: false,
  sprint: false,
  dash,
});

describe("stepDash", () => {
  it("bursts along the fish's facing, costs stamina, and starts the cooldown", () => {
    const { fish, dashed } = stepDash(ready, input(true), DEFAULT_CONFIG, DT);
    expect(dashed).toBe(true);
    expect(fish.velocity.x).toBeCloseTo(FISH.dashImpulse);
    expect(fish.velocity.z).toBeCloseTo(0);
    expect(fish.stamina).toBe(FISH.maxStamina - FISH.dashCost);
    expect(fish.dashCooldown).toBe(FISH.dashCooldown);
  });

  it("adds to the current velocity instead of replacing it", () => {
    const moving = { ...ready, velocity: { x: 2, y: -1, z: 3 } };
    const { fish } = stepDash(moving, input(true), DEFAULT_CONFIG, DT);
    expect(fish.velocity).toEqual({ x: 2 + FISH.dashImpulse, y: -1, z: expect.closeTo(3) as number });
  });

  it("does nothing during the cooldown except count it down", () => {
    const cooling = { ...ready, dashCooldown: 1 };
    const { fish, dashed } = stepDash(cooling, input(true), DEFAULT_CONFIG, DT);
    expect(dashed).toBe(false);
    expect(fish.velocity).toEqual(ready.velocity);
    expect(fish.dashCooldown).toBeCloseTo(1 - DT);
  });

  it("does nothing without enough stamina", () => {
    const tired = { ...ready, stamina: FISH.dashCost - 1 };
    const { fish, dashed } = stepDash(tired, input(true), DEFAULT_CONFIG, DT);
    expect(dashed).toBe(false);
    expect(fish.stamina).toBe(FISH.dashCost - 1);
  });

  it("does nothing without the dash button, and the cooldown never goes negative", () => {
    const { fish, dashed } = stepDash({ ...ready, dashCooldown: DT / 2 }, input(false), DEFAULT_CONFIG, DT);
    expect(dashed).toBe(false);
    expect(fish.dashCooldown).toBe(0);
  });
});

describe("applyTensionSpike", () => {
  const hooked: LineState = { phase: "hooked", length: 12, tension: 30, overTensionTime: 0 };

  it("adds the dash spike to a hooked line", () => {
    const line = applyTensionSpike(hooked, DEFAULT_CONFIG);
    expect(line.phase === "hooked" && line.tension).toBe(30 + FISH.dashTensionSpike);
  });

  it("never pushes tension past breakStrength", () => {
    const line = applyTensionSpike({ ...hooked, tension: TENSION.breakStrength - 1 }, DEFAULT_CONFIG);
    expect(line.phase === "hooked" && line.tension).toBe(TENSION.breakStrength);
  });

  it("leaves a line that is not hooked alone", () => {
    const idle: LineState = { phase: "idle" };
    expect(applyTensionSpike(idle, DEFAULT_CONFIG)).toBe(idle);
  });
});
