import type { FishermanState } from "@fishwar/game-types";
import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../config";
import { createMatch } from "../match";
import { stepFishermanMovement } from "./fishermanMovement";

const DT = 1 / DEFAULT_CONFIG.tickRate;
const { dock: DOCK, fisherman: FISHERMAN } = DEFAULT_CONFIG;
const spawn = createMatch(DEFAULT_CONFIG).fisherman;

function run(state: FishermanState, x: number, z: number, ticks: number): FishermanState {
  let s = state;
  for (let i = 0; i < ticks; i++) {
    s = stepFishermanMovement(s, { move: { x, z }, cast: false }, DEFAULT_CONFIG, DT);
  }
  return s;
}

describe("stepFishermanMovement", () => {
  it("spawns facing the pond (-Z)", () => {
    expect(spawn.yaw).toBeCloseTo(Math.PI);
  });

  it("walks at most moveSpeed", () => {
    const s = run(spawn, 1, 0, 10);
    expect(Math.hypot(s.velocity.x, s.velocity.z)).toBeCloseTo(FISHERMAN.moveSpeed);
  });

  it("cannot leave the dock in any direction", () => {
    const corners: ReadonlyArray<readonly [number, number]> = [
      [1, 1],
      [-1, -1],
    ];
    for (const [x, z] of corners) {
      const s = run(spawn, x, z, 600);
      expect(Math.abs(s.position.x - DOCK.center.x)).toBeLessThanOrEqual(DOCK.width / 2);
      expect(Math.abs(s.position.z - DOCK.center.z)).toBeLessThanOrEqual(DOCK.length / 2);
    }
  });

  it("stays standing on the dock surface", () => {
    expect(run(spawn, 1, -1, 60).position.y).toBe(DOCK.height);
  });
});
