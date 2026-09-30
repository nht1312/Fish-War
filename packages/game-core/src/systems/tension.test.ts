import type { FishInput, FishState } from "@fishwar/game-types";
import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../config";
import { linePull, stepTension } from "./tension";

const DT = 1 / DEFAULT_CONFIG.tickRate;
const { tension: TENSION, fish: FISH } = DEFAULT_CONFIG;
const TIP = { x: 0, y: 3, z: 15 };
const LENGTH = 13;

/** A fish at the surface, straight out from the tip along -Z, `d` metres away. */
function fishOut(d: number): FishState {
  const horizontal = Math.sqrt(d * d - TIP.y * TIP.y);
  return {
    position: { x: 0, y: 0, z: TIP.z - horizontal },
    velocity: { x: 0, y: 0, z: 0 },
    yaw: Math.PI,
  };
}

const swim = (x: number, z: number): FishInput => ({ move: { x, z }, dive: false });

describe("linePull", () => {
  it("is zero while the line is slack", () => {
    expect(linePull(fishOut(LENGTH - 1), swim(0, -1), TIP, LENGTH, DEFAULT_CONFIG)).toBe(0);
  });

  it("is the fish's intended speed away from the rod when taut", () => {
    const pull = linePull(fishOut(LENGTH), swim(0, -1), TIP, LENGTH, DEFAULT_CONFIG);
    expect(pull).toBeCloseTo(FISH.swimSpeed);
  });

  it("counts only the outward component of a diagonal pull", () => {
    const pull = linePull(fishOut(LENGTH), swim(1, -1), TIP, LENGTH, DEFAULT_CONFIG);
    expect(pull).toBeCloseTo(FISH.swimSpeed * Math.SQRT1_2);
  });

  it("is zero when swimming toward the rod or not swimming", () => {
    expect(linePull(fishOut(LENGTH), swim(0, 1), TIP, LENGTH, DEFAULT_CONFIG)).toBe(0);
    expect(linePull(fishOut(LENGTH), swim(0, 0), TIP, LENGTH, DEFAULT_CONFIG)).toBe(0);
  });
});

describe("stepTension", () => {
  const FULL_PULL = FISH.swimSpeed;
  const NO_DRAG = Number.POSITIVE_INFINITY;
  const calm = { tension: 0, overTensionTime: 0 };

  it("holds tension at the drag limit and reports the line slipping", () => {
    const drag = 40;
    const next = stepTension({ tension: drag, overTensionTime: 0 }, FULL_PULL, drag, DEFAULT_CONFIG, DT);
    expect(next.tension).toBe(drag);
    expect(next.slipping).toBe(true);
    expect(next.broken).toBe(false);
  });

  it("is not slipping below the drag limit", () => {
    expect(stepTension(calm, FULL_PULL, 40, DEFAULT_CONFIG, DT).slipping).toBe(false);
  });

  it("never breaks while drag is below breakStrength", () => {
    let t = { ...calm, broken: false };
    for (let i = 0; i < 600; i++) t = stepTension(t, FULL_PULL, 90, DEFAULT_CONFIG, DT);
    expect(t.broken).toBe(false);
  });

  it("can break when drag is at breakStrength (no slip)", () => {
    let t = { ...calm, broken: false };
    for (let i = 0; i < 600 && !t.broken; i++) {
      t = stepTension(t, FULL_PULL, TENSION.breakStrength, DEFAULT_CONFIG, DT);
    }
    expect(t.broken).toBe(true);
  });

  it("rises while the fish pulls", () => {
    const next = stepTension(calm, FULL_PULL, NO_DRAG, DEFAULT_CONFIG, DT);
    expect(next.tension).toBeCloseTo((FULL_PULL * TENSION.pullToTension - TENSION.decayRate) * DT);
    expect(next.broken).toBe(false);
  });

  it("decays without pull and never goes negative", () => {
    const next = stepTension({ tension: 0.1, overTensionTime: 0 }, 0, NO_DRAG, DEFAULT_CONFIG, DT);
    expect(next.tension).toBe(0);
  });

  it("caps at breakStrength", () => {
    let t = { ...calm, broken: false };
    for (let i = 0; i < 200 && !t.broken; i++) t = stepTension(t, FULL_PULL, NO_DRAG, DEFAULT_CONFIG, DT);
    expect(t.tension).toBeLessThanOrEqual(TENSION.breakStrength);
  });

  it("breaks after staying at breakStrength longer than the grace time", () => {
    let t = { tension: TENSION.breakStrength, overTensionTime: 0, broken: false };
    const graceTicks = Math.ceil(TENSION.breakGraceSeconds / DT);
    for (let i = 0; i < graceTicks - 1; i++) t = stepTension(t, FULL_PULL, NO_DRAG, DEFAULT_CONFIG, DT);
    expect(t.broken).toBe(false);
    for (let i = 0; i < 2; i++) t = stepTension(t, FULL_PULL, NO_DRAG, DEFAULT_CONFIG, DT);
    expect(t.broken).toBe(true);
  });

  it("does not break on a short spike, and resets the grace timer", () => {
    const spiking = stepTension(
      { tension: TENSION.breakStrength, overTensionTime: 0 },
      FULL_PULL,
      NO_DRAG,
      DEFAULT_CONFIG,
      DT,
    );
    expect(spiking.overTensionTime).toBeGreaterThan(0);

    const eased = stepTension(spiking, 0, NO_DRAG, DEFAULT_CONFIG, DT);
    expect(eased.broken).toBe(false);
    expect(eased.overTensionTime).toBe(0);
  });
});
