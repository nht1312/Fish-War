import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../config";
import { payOutLine, reelInLine, stepDrag } from "./reel";

const DT = 1 / DEFAULT_CONFIG.tickRate;
const { reel: REEL, tension: TENSION, rod: ROD, dock: DOCK } = DEFAULT_CONFIG;

describe("reel config", () => {
  it("keeps the shortest line long enough for the fish to stay in the water", () => {
    expect(REEL.minLength).toBeGreaterThan(DOCK.height + ROD.tipHeight);
  });

  it("caps drag at the line's breaking strength", () => {
    expect(REEL.maxDrag).toBeLessThanOrEqual(TENSION.breakStrength);
    expect(REEL.initialDrag).toBeGreaterThanOrEqual(REEL.minDrag);
    expect(REEL.initialDrag).toBeLessThanOrEqual(REEL.maxDrag);
  });
});

describe("reelInLine", () => {
  it("shortens the line at reelSpeed while reeling", () => {
    expect(reelInLine(10, true, DEFAULT_CONFIG, DT)).toBeCloseTo(10 - REEL.reelSpeed * DT);
  });

  it("leaves the line alone when not reeling", () => {
    expect(reelInLine(10, false, DEFAULT_CONFIG, DT)).toBe(10);
  });

  it("never goes below minLength", () => {
    expect(reelInLine(REEL.minLength + 0.01, true, DEFAULT_CONFIG, 1)).toBe(REEL.minLength);
  });
});

describe("payOutLine", () => {
  it("lets line out at the fish's pull speed", () => {
    expect(payOutLine(10, 3, DEFAULT_CONFIG, DT)).toBeCloseTo(10 + 3 * DT);
  });

  it("never exceeds maxLength", () => {
    expect(payOutLine(REEL.maxLength - 0.01, 6, DEFAULT_CONFIG, 1)).toBe(REEL.maxLength);
  });
});

describe("stepDrag", () => {
  it("changes drag at dragAdjustRate in the input direction", () => {
    expect(stepDrag(50, 1, DEFAULT_CONFIG, DT)).toBeCloseTo(50 + REEL.dragAdjustRate * DT);
    expect(stepDrag(50, -1, DEFAULT_CONFIG, DT)).toBeCloseTo(50 - REEL.dragAdjustRate * DT);
  });

  it("clamps drag to [minDrag, maxDrag]", () => {
    expect(stepDrag(REEL.maxDrag, 1, DEFAULT_CONFIG, 1)).toBe(REEL.maxDrag);
    expect(stepDrag(REEL.minDrag, -1, DEFAULT_CONFIG, 1)).toBe(REEL.minDrag);
  });

  it("ignores input magnitude beyond 1", () => {
    expect(stepDrag(50, 10, DEFAULT_CONFIG, DT)).toBeCloseTo(50 + REEL.dragAdjustRate * DT);
  });
});
