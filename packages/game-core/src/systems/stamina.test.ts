import type { FishInput, FishState } from "@fishwar/game-types";
import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../config";
import { effectiveSwimSpeed, isSprinting, stepStamina } from "./stamina";

const DT = 1 / DEFAULT_CONFIG.tickRate;
const { fish: FISH } = DEFAULT_CONFIG;

function fishWith(stamina: number): FishState {
  return {
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    yaw: 0,
    stamina,
    dashCooldown: 0,
  };
}

const input = (sprint: boolean, x = 0, z = -1): FishInput => ({
  move: { x, z },
  dive: false,
  sprint,
  dash: false,
});

describe("isSprinting", () => {
  it("needs the sprint button, movement input, and stamina", () => {
    expect(isSprinting(fishWith(50), input(true))).toBe(true);
    expect(isSprinting(fishWith(50), input(false))).toBe(false);
    expect(isSprinting(fishWith(50), input(true, 0, 0))).toBe(false);
    expect(isSprinting(fishWith(0), input(true))).toBe(false);
  });
});

describe("effectiveSwimSpeed", () => {
  it("multiplies swim speed while sprinting", () => {
    expect(effectiveSwimSpeed(fishWith(50), input(true), DEFAULT_CONFIG)).toBeCloseTo(
      FISH.swimSpeed * FISH.sprintMultiplier,
    );
  });

  it("is the base swim speed otherwise, including when out of stamina", () => {
    expect(effectiveSwimSpeed(fishWith(50), input(false), DEFAULT_CONFIG)).toBe(FISH.swimSpeed);
    expect(effectiveSwimSpeed(fishWith(0), input(true), DEFAULT_CONFIG)).toBe(FISH.swimSpeed);
  });
});

describe("stepStamina", () => {
  it("drains at sprintDrain while sprinting", () => {
    const next = stepStamina(50, { sprinting: true, tension: 0 }, DEFAULT_CONFIG, DT);
    expect(next).toBeCloseTo(50 - FISH.sprintDrain * DT);
  });

  it("drains in proportion to line tension", () => {
    const next = stepStamina(50, { sprinting: false, tension: 80 }, DEFAULT_CONFIG, DT);
    expect(next).toBeCloseTo(50 - 80 * FISH.tensionDrain * DT);
  });

  it("stacks sprint and tension drain", () => {
    const next = stepStamina(50, { sprinting: true, tension: 80 }, DEFAULT_CONFIG, DT);
    expect(next).toBeCloseTo(50 - (FISH.sprintDrain + 80 * FISH.tensionDrain) * DT);
  });

  it("regenerates only when resting, up to maxStamina", () => {
    const rested = stepStamina(50, { sprinting: false, tension: 0 }, DEFAULT_CONFIG, DT);
    expect(rested).toBeCloseTo(50 + FISH.staminaRegen * DT);
    expect(stepStamina(FISH.maxStamina, { sprinting: false, tension: 0 }, DEFAULT_CONFIG, DT)).toBe(
      FISH.maxStamina,
    );
  });

  it("never drops below zero", () => {
    expect(stepStamina(0.01, { sprinting: true, tension: 100 }, DEFAULT_CONFIG, 1)).toBe(0);
  });
});
