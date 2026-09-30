import type { FishInput, FishState, HorizontalVec } from "@fishwar/game-types";
import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../config";
import { stepFishMovement } from "./fishMovement";

const DT = 1 / DEFAULT_CONFIG.tickRate;
const { fish: FISH, pond: POND } = DEFAULT_CONFIG;

const atRest: FishState = {
  position: { x: 0, y: -0.4, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  yaw: 0,
};

const input = (x: number, z: number): FishInput => ({ move: { x, z } });

function run(state: FishState, move: HorizontalVec, ticks: number): FishState {
  let s = state;
  for (let i = 0; i < ticks; i++) {
    s = stepFishMovement(s, { move }, DEFAULT_CONFIG, DT);
  }
  return s;
}

/** Enough ticks to reach top speed from rest without reaching a wall. */
const TO_TOP_SPEED = 15;

const horizontalSpeed = (s: FishState) => Math.hypot(s.velocity.x, s.velocity.z);

describe("stepFishMovement", () => {
  it("accelerates toward the input direction by at most acceleration * dt", () => {
    const next = stepFishMovement(atRest, input(1, 0), DEFAULT_CONFIG, DT);
    expect(next.velocity.x).toBeCloseTo(Math.min(FISH.acceleration * DT, FISH.swimSpeed));
    expect(next.velocity.z).toBe(0);
    expect(next.position.x).toBeGreaterThan(0);
  });

  it("caps speed at swimSpeed", () => {
    const s = run(atRest, { x: 0, z: -1 }, TO_TOP_SPEED);
    expect(horizontalSpeed(s)).toBeCloseTo(FISH.swimSpeed);
  });

  it("normalises diagonal input so diagonals are not faster", () => {
    const s = run(atRest, { x: 1, z: 1 }, TO_TOP_SPEED);
    expect(horizontalSpeed(s)).toBeCloseTo(FISH.swimSpeed);
  });

  it("keeps analog input below full magnitude", () => {
    const s = run(atRest, { x: 0.5, z: 0 }, TO_TOP_SPEED);
    expect(horizontalSpeed(s)).toBeCloseTo(FISH.swimSpeed * 0.5);
  });

  it("damps to a full stop without input", () => {
    const moving = run(atRest, { x: 1, z: 0 }, TO_TOP_SPEED);
    expect(horizontalSpeed(moving)).toBeGreaterThan(0);
    const stopped = run(moving, { x: 0, z: 0 }, 120);
    expect(horizontalSpeed(stopped)).toBe(0);
  });

  it("never leaves the pond bounds and drops velocity into the wall", () => {
    const s = run(atRest, { x: 1, z: -1 }, 600);
    expect(s.position.x).toBe(POND.width / 2);
    expect(s.position.z).toBe(-POND.length / 2);
    expect(s.velocity.x).toBe(0);
    expect(s.velocity.z).toBe(0);
  });

  it("faces its velocity and keeps its facing when stopped", () => {
    const movingRight = run(atRest, { x: 1, z: 0 }, 10);
    expect(movingRight.yaw).toBeCloseTo(Math.PI / 2);

    const stopped = run(movingRight, { x: 0, z: 0 }, 120);
    expect(stopped.yaw).toBeCloseTo(Math.PI / 2);
  });

  it("does not change depth", () => {
    const s = run(atRest, { x: 1, z: 1 }, 30);
    expect(s.position.y).toBe(atRest.position.y);
  });

  it("does not mutate its input state", () => {
    const before = structuredClone(atRest);
    stepFishMovement(atRest, input(1, 1), DEFAULT_CONFIG, DT);
    expect(atRest).toEqual(before);
  });
});
