import type { MatchInputs } from "@fishwar/game-types";
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

const STILL = { x: 0, z: 0 };
const IDLE: MatchInputs = {
  fish: { move: STILL, dive: false },
  fisherman: { move: STILL, cast: false },
};

describe("stepMatch", () => {
  const dt = 1 / DEFAULT_CONFIG.tickRate;

  it("advances tick and time without mutating the input state", () => {
    const start = createMatch(DEFAULT_CONFIG);
    const next = stepMatch(start, IDLE, DEFAULT_CONFIG, dt);

    expect(next.tick).toBe(1);
    expect(next.time).toBeCloseTo(dt);
    expect(start.tick).toBe(0);
  });

  it("moves the fish and the fisherman independently in the same tick", () => {
    const start = createMatch(DEFAULT_CONFIG);
    const inputs: MatchInputs = {
      fish: { move: { x: 1, z: 0 }, dive: false },
      fisherman: { move: { x: -1, z: 0 }, cast: false },
    };
    const next = stepMatch(start, inputs, DEFAULT_CONFIG, dt);
    expect(next.fish.position.x).toBeGreaterThan(start.fish.position.x);
    expect(next.fisherman.position.x).toBeLessThan(start.fisherman.position.x);
  });
});

describe("stepMatch casting", () => {
  const dt = 1 / DEFAULT_CONFIG.tickRate;
  const pressCast: MatchInputs = { ...IDLE, fisherman: { move: STILL, cast: true } };

  it("starts with the line idle", () => {
    expect(createMatch(DEFAULT_CONFIG).line).toEqual({ phase: "idle" });
  });

  it("casts once per press, not every tick the button is held", () => {
    const first = stepMatch(createMatch(DEFAULT_CONFIG), pressCast, DEFAULT_CONFIG, dt);
    expect(first.line.phase).toBe("cast");
    expect(first.fisherman.castHeld).toBe(true);

    const held = stepMatch(first, pressCast, DEFAULT_CONFIG, dt);
    expect(held.line.phase).toBe("cast");

    const released = stepMatch(held, IDLE, DEFAULT_CONFIG, dt);
    const retrieved = stepMatch(released, pressCast, DEFAULT_CONFIG, dt);
    expect(retrieved.line.phase).toBe("idle");
  });
});

describe("MatchState", () => {
  it("is plain JSON data", () => {
    const state = createMatch(DEFAULT_CONFIG);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});
