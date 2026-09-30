import { createMatch, DEFAULT_CONFIG } from "@fishwar/game-core";
import type { MatchState } from "@fishwar/game-types";
import { describe, expect, it } from "vitest";

import { addSnapshot, EMPTY_BUFFER, sampleBuffer } from "./snapshotBuffer";

const TICK = 1 / DEFAULT_CONFIG.tickRate;
const DELAY = 2 * TICK;
const base = createMatch(DEFAULT_CONFIG);

/** A snapshot at server tick `tick`, with the fish at x = tick. */
function snap(tick: number): MatchState {
  return {
    ...base,
    tick,
    time: tick * TICK,
    fish: { ...base.fish, position: { x: tick, y: 0, z: 0 } },
  };
}

/** Receive ticks 1..n exactly on time; returns the buffer and the local time of the last one. */
function received(n: number, jitter: (tick: number) => number = () => 0) {
  let buffer = EMPTY_BUFFER;
  for (let tick = 1; tick <= n; tick++) buffer = addSnapshot(buffer, snap(tick), tick * TICK + jitter(tick));
  return buffer;
}

describe("snapshot buffer", () => {
  it("has nothing to show before the first snapshot", () => {
    expect(sampleBuffer(EMPTY_BUFFER, 0, DELAY)).toBeNull();
  });

  it("shows the only snapshot it has", () => {
    const buffer = addSnapshot(EMPTY_BUFFER, snap(1), TICK);
    expect(sampleBuffer(buffer, TICK, DELAY)?.fish.position.x).toBe(1);
  });

  it("renders the delay behind the newest snapshot, blended between neighbours", () => {
    const buffer = received(10);
    // Local now = arrival of tick 10 plus half a tick; render time = tick 8.5.
    const sample = sampleBuffer(buffer, 10 * TICK + TICK / 2, DELAY);
    expect(sample?.fish.position.x).toBeCloseTo(8.5);
    expect(sample?.tick).toBe(9);
  });

  it("is not thrown off by late arrivals (uses the least-delayed offset)", () => {
    // Every odd tick arrives 20 ms late.
    const buffer = received(10, (tick) => (tick % 2 ? 0.02 : 0));
    const sample = sampleBuffer(buffer, 10 * TICK + TICK / 2, DELAY);
    expect(sample?.fish.position.x).toBeCloseTo(8.5);
  });

  it("holds the newest snapshot rather than guessing past it", () => {
    const buffer = received(10);
    expect(sampleBuffer(buffer, 100, DELAY)?.fish.position.x).toBe(10);
  });

  it("starts over when the server's clock goes backwards (a rematch)", () => {
    const rematch = addSnapshot(received(10), snap(1), 20);
    expect(rematch.snapshots).toHaveLength(1);
    expect(sampleBuffer(rematch, 20, DELAY)?.tick).toBe(1);
  });

  it("keeps only a bounded number of snapshots", () => {
    expect(received(500).snapshots.length).toBeLessThanOrEqual(32);
  });
});
