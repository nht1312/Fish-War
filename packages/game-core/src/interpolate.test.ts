import type { MatchState, Projectile } from "@fishwar/game-types";
import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "./config";
import { interpolateState } from "./interpolate";
import { createMatch } from "./match";

const base = createMatch(DEFAULT_CONFIG);

function at(fishX: number, fishYaw: number, extra: Partial<MatchState> = {}): MatchState {
  return {
    ...base,
    fish: { ...base.fish, position: { x: fishX, y: -1, z: 2 }, yaw: fishYaw },
    fisherman: { ...base.fisherman, position: { x: fishX / 2, y: 1, z: 17 }, yaw: Math.PI },
    ...extra,
  };
}

const shot = (x: number, age: number): Projectile => ({
  position: { x, y: 1, z: 0 },
  velocity: { x: 1, y: 0, z: 0 },
  age,
});

describe("interpolateState", () => {
  const a = at(0, 0, { tick: 10, timeLeft: 100 });
  const b = at(4, 1, { tick: 11, timeLeft: 99, phase: "playing" });

  it("has a's positions at t = 0 and is exactly b at t = 1", () => {
    const start = interpolateState(a, b, 0);
    expect(start.fish.position).toEqual(a.fish.position);
    expect(start.fisherman.position).toEqual(a.fisherman.position);
    expect(interpolateState(a, b, 1)).toEqual(b);
  });

  it("blends positions and yaw halfway at t = 0.5", () => {
    const mid = interpolateState(a, b, 0.5);
    expect(mid.fish.position.x).toBeCloseTo(2);
    expect(mid.fisherman.position.x).toBeCloseTo(1);
    expect(mid.fish.yaw).toBeCloseTo(0.5);
  });

  it("turns the short way across ±π", () => {
    const left = at(0, Math.PI - 0.1);
    const right = at(0, -Math.PI + 0.1);
    const mid = interpolateState(left, right, 0.5);
    expect(Math.abs(Math.abs(mid.fish.yaw) - Math.PI)).toBeLessThan(1e-9);
  });

  it("takes every discrete field from the newer snapshot", () => {
    const mid = interpolateState(a, b, 0.5);
    expect(mid.tick).toBe(b.tick);
    expect(mid.phase).toBe(b.phase);
    expect(mid.timeLeft).toBe(b.timeLeft);
    expect(mid.line).toBe(b.line);
  });

  it("clamps t into [0, 1]", () => {
    expect(interpolateState(a, b, 3).fish.position).toEqual(b.fish.position);
    expect(interpolateState(a, b, -1).fish.position).toEqual(a.fish.position);
  });

  it("blends shots only when both snapshots have the same shots in flight", () => {
    const older = { ...a, projectiles: [shot(0, 0.1)] };
    const newer = { ...b, projectiles: [shot(2, 0.2)] };
    expect(interpolateState(older, newer, 0.5).projectiles[0]?.position.x).toBeCloseTo(1);

    // A new shot appeared: nothing to blend from, so use the newer snapshot's shots.
    const fired = { ...b, projectiles: [shot(2, 0.2), shot(9, 0)] };
    expect(interpolateState(older, fired, 0.5).projectiles).toBe(fired.projectiles);
  });
});
