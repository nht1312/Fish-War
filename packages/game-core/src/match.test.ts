import type { MatchInputs, MatchState } from "@fishwar/game-types";
import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG, type MatchConfig } from "./config";
import { createMatch, stepMatch } from "./match";
import { rodTipPosition } from "./systems/line";

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

describe("stepMatch hooked fish", () => {
  const dt = 1 / DEFAULT_CONFIG.tickRate;

  it("keeps a hooked fish within the line length while it swims away", () => {
    const start = createMatch(DEFAULT_CONFIG);
    const hooked = { ...start, line: { phase: "hooked" as const, length: 12 } };
    const fleeing: MatchInputs = { ...IDLE, fish: { move: { x: 0.3, z: -1 }, dive: false } };

    let state: MatchState = hooked;
    for (let i = 0; i < 300; i++) state = stepMatch(state, fleeing, DEFAULT_CONFIG, dt);

    const tip = rodTipPosition(state.fisherman, DEFAULT_CONFIG);
    const { x, y, z } = state.fish.position;
    expect(Math.hypot(x - tip.x, y - tip.y, z - tip.z)).toBeLessThanOrEqual(12 + 1e-9);
  });
});

describe("MatchState", () => {
  it("is plain JSON data", () => {
    const state = createMatch(DEFAULT_CONFIG);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});
