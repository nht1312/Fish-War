import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG, type MatchConfig } from "./config";
import { createMatch, stepMatch } from "./match";

describe("createMatch", () => {
  const state = createMatch(DEFAULT_CONFIG);
  const { pond, dock } = DEFAULT_CONFIG;

  it("starts at tick 0, time 0", () => {
    expect(state.tick).toBe(0);
    expect(state.time).toBe(0);
  });

  it("places the fish inside the pond, underwater", () => {
    const { x, y, z } = state.fish.position;
    expect(Math.abs(x)).toBeLessThanOrEqual(pond.width / 2);
    expect(Math.abs(z)).toBeLessThanOrEqual(pond.length / 2);
    expect(y).toBeLessThanOrEqual(0);
    expect(y).toBeGreaterThanOrEqual(-pond.depth);
  });

  it("places the fisherman standing on the dock", () => {
    const { x, y, z } = state.fisherman.position;
    expect(Math.abs(x - dock.center.x)).toBeLessThanOrEqual(dock.width / 2);
    expect(Math.abs(z - dock.center.z)).toBeLessThanOrEqual(dock.length / 2);
    expect(y).toBe(dock.height);
  });

  it("uses spawn positions from the given config", () => {
    const config: MatchConfig = {
      ...DEFAULT_CONFIG,
      fishSpawn: { x: 3, y: -1, z: 2 },
    };
    expect(createMatch(config).fish.position).toEqual({ x: 3, y: -1, z: 2 });
  });
});

describe("stepMatch", () => {
  it("advances tick and time without mutating the input state", () => {
    const start = createMatch(DEFAULT_CONFIG);
    const dt = 1 / DEFAULT_CONFIG.tickRate;
    const next = stepMatch(start, dt);

    expect(next.tick).toBe(1);
    expect(next.time).toBeCloseTo(dt);
    expect(start.tick).toBe(0);
  });
});

describe("MatchState", () => {
  it("is plain JSON data", () => {
    const state = createMatch(DEFAULT_CONFIG);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});
