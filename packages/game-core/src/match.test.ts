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
  fish: { move: STILL, dive: false, sprint: false },
  fisherman: { move: STILL, cast: false, dragChange: 0 },
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
      fish: { move: { x: 1, z: 0 }, dive: false, sprint: false },
      fisherman: { move: { x: -1, z: 0 }, cast: false, dragChange: 0 },
    };
    const next = stepMatch(start, inputs, DEFAULT_CONFIG, dt);
    expect(next.fish.position.x).toBeGreaterThan(start.fish.position.x);
    expect(next.fisherman.position.x).toBeLessThan(start.fisherman.position.x);
  });
});

describe("stepMatch casting", () => {
  const dt = 1 / DEFAULT_CONFIG.tickRate;
  const pressCast: MatchInputs = { ...IDLE, fisherman: { move: STILL, cast: true, dragChange: 0 } };

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

const HOOKED_12 = { phase: "hooked" as const, length: 12, tension: 0, overTensionTime: 0 };

describe("stepMatch hooked fish", () => {
  const dt = 1 / DEFAULT_CONFIG.tickRate;

  /** Max drag: the reel never lets line out, so a hard pull can snap it. */
  const LOCKED_REEL = { drag: DEFAULT_CONFIG.reel.maxDrag };

  function runHooked(
    fish: MatchInputs["fish"],
    ticks: number,
    options: { drag?: number; reel?: boolean } = {},
  ): MatchState {
    const start = createMatch(DEFAULT_CONFIG);
    let state: MatchState = {
      ...start,
      line: HOOKED_12,
      fisherman: { ...start.fisherman, drag: options.drag ?? DEFAULT_CONFIG.reel.initialDrag },
    };
    const fisherman = { ...IDLE.fisherman, cast: options.reel ?? false };
    for (let i = 0; i < ticks; i++) {
      state = stepMatch(state, { fish, fisherman }, DEFAULT_CONFIG, dt);
    }
    return state;
  }

  const fleeing = { move: { x: 0, z: -1 }, dive: false, sprint: false };
  const resting = { move: { x: 0, z: 0 }, dive: false, sprint: false };
  const hookedLength = (s: MatchState) => (s.line.phase === "hooked" ? s.line.length : NaN);

  it("reeling shortens the line and pulls the fish in", () => {
    const start = runHooked(resting, 1);
    const reeled = runHooked(resting, 30, { reel: true });
    expect(hookedLength(reeled)).toBeLessThan(hookedLength(start));
    const tip = rodTipPosition(reeled.fisherman, DEFAULT_CONFIG);
    const { x, y, z } = reeled.fish.position;
    expect(Math.hypot(x - tip.x, y - tip.y, z - tip.z)).toBeLessThanOrEqual(hookedLength(reeled) + 1e-9);
  });

  it("with low drag, a pulling fish takes line out instead of snapping it", () => {
    const state = runHooked(fleeing, 30 * 3, { drag: DEFAULT_CONFIG.reel.minDrag });
    expect(state.line.phase).toBe("hooked");
    expect(hookedLength(state)).toBeGreaterThan(HOOKED_12.length);
  });

  it("snaps even with low drag once all the line is out", () => {
    const state = runHooked(fleeing, 30 * 60, { drag: DEFAULT_CONFIG.reel.minDrag });
    expect(state.outcome).toEqual({ winner: "fish", reason: "line-broken" });
  });

  it("lets the fisherman win when the hooked fish runs out of stamina", () => {
    const start = createMatch(DEFAULT_CONFIG);
    let state: MatchState = { ...start, line: HOOKED_12, fish: { ...start.fish, stamina: 0.5 } };
    const sprintAway = { move: { x: 0, z: -1 }, dive: false, sprint: true };
    for (let i = 0; i < 30 && state.outcome === null; i++) {
      state = stepMatch(state, { ...IDLE, fish: sprintAway }, DEFAULT_CONFIG, dt);
    }
    expect(state.fish.stamina).toBe(0);
    expect(state.outcome).toEqual({ winner: "fisherman", reason: "fish-exhausted" });
  });

  it("adjusts drag from input, within limits", () => {
    let state = createMatch(DEFAULT_CONFIG);
    const tighten: MatchInputs = { ...IDLE, fisherman: { ...IDLE.fisherman, dragChange: 1 } };
    for (let i = 0; i < 30 * 10; i++) state = stepMatch(state, tighten, DEFAULT_CONFIG, dt);
    expect(state.fisherman.drag).toBe(DEFAULT_CONFIG.reel.maxDrag);
  });

  it("starts with no outcome", () => {
    expect(createMatch(DEFAULT_CONFIG).outcome).toBeNull();
  });

  it("snaps the line and lets the fish win when it pulls hard for long enough", () => {
    const state = runHooked(fleeing, 30 * 10, LOCKED_REEL);
    expect(state.line.phase).toBe("idle");
    expect(state.outcome).toEqual({ winner: "fish", reason: "line-broken" });
  });

  it("builds tension while pulling, before it snaps", () => {
    const state = runHooked(fleeing, 30, LOCKED_REEL);
    if (state.line.phase !== "hooked") throw new Error("expected hooked");
    expect(state.line.tension).toBeGreaterThan(0);
  });

  it("does not snap while the fish swims toward the rod", () => {
    const state = runHooked({ move: { x: 0, z: 1 }, dive: false, sprint: false }, 30 * 10, LOCKED_REEL);
    expect(state.line.phase).toBe("hooked");
    expect(state.outcome).toBeNull();
  });

  it("keeps a hooked fish within the line length while it swims away", () => {
    const start = createMatch(DEFAULT_CONFIG);
    const hooked = { ...start, line: HOOKED_12 };
    const fleeing: MatchInputs = { ...IDLE, fish: { move: { x: 0.3, z: -1 }, dive: false, sprint: false } };

    let state: MatchState = hooked;
    // Two seconds: long enough to hit the end of the line, short of snapping it.
    for (let i = 0; i < 60; i++) state = stepMatch(state, fleeing, DEFAULT_CONFIG, dt);
    expect(state.line.phase).toBe("hooked");

    const tip = rodTipPosition(state.fisherman, DEFAULT_CONFIG);
    const { x, y, z } = state.fish.position;
    expect(Math.hypot(x - tip.x, y - tip.y, z - tip.z)).toBeLessThanOrEqual(12 + 1e-9);
  });
});

describe("stepMatch stamina", () => {
  const dt = 1 / DEFAULT_CONFIG.tickRate;
  const sprint = { move: { x: 1, z: 0 }, dive: false, sprint: true };

  it("starts the fish at full stamina", () => {
    expect(createMatch(DEFAULT_CONFIG).fish.stamina).toBe(DEFAULT_CONFIG.fish.maxStamina);
  });

  it("sprinting makes the fish faster than its swim speed and costs stamina", () => {
    let state = createMatch(DEFAULT_CONFIG);
    for (let i = 0; i < 15; i++) state = stepMatch(state, { ...IDLE, fish: sprint }, DEFAULT_CONFIG, dt);
    expect(Math.hypot(state.fish.velocity.x, state.fish.velocity.z)).toBeGreaterThan(
      DEFAULT_CONFIG.fish.swimSpeed,
    );
    expect(state.fish.stamina).toBeLessThan(DEFAULT_CONFIG.fish.maxStamina);
  });

  it("running out of stamina while free just stops the sprint, with no outcome", () => {
    const start = createMatch(DEFAULT_CONFIG);
    let state: MatchState = { ...start, fish: { ...start.fish, stamina: 0.2 } };
    for (let i = 0; i < 10; i++) state = stepMatch(state, { ...IDLE, fish: sprint }, DEFAULT_CONFIG, dt);
    expect(state.outcome).toBeNull();
  });
});

describe("MatchState", () => {
  it("is plain JSON data", () => {
    const state = createMatch(DEFAULT_CONFIG);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});
