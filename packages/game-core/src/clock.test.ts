import { describe, expect, it } from "vitest";

import { advanceClock } from "./clock";

const TICK = 1 / 30;
const MAX_TICKS = 5;

describe("advanceClock", () => {
  it("runs no ticks for a zero frame time", () => {
    expect(advanceClock(0, 0, TICK, MAX_TICKS)).toEqual({ ticks: 0, accumulator: 0 });
  });

  it("runs whole ticks and carries the remainder", () => {
    const result = advanceClock(0, TICK * 2.5, TICK, MAX_TICKS);
    expect(result.ticks).toBe(2);
    expect(result.accumulator).toBeCloseTo(TICK * 0.5);
  });

  it("adds the carried remainder to the next frame", () => {
    const result = advanceClock(TICK * 0.5, TICK * 0.6, TICK, MAX_TICKS);
    expect(result.ticks).toBe(1);
    expect(result.accumulator).toBeCloseTo(TICK * 0.1);
  });

  it("caps a huge frame time at maxTicks and drops the backlog", () => {
    const result = advanceClock(0, 10, TICK, MAX_TICKS);
    expect(result.ticks).toBe(MAX_TICKS);
    expect(result.accumulator).toBeLessThan(TICK);
  });

  it("treats a negative frame time as zero", () => {
    expect(advanceClock(TICK * 0.5, -1, TICK, MAX_TICKS)).toEqual({
      ticks: 0,
      accumulator: TICK * 0.5,
    });
  });

  it("rejects a non-positive tick duration", () => {
    expect(() => advanceClock(0, 1, 0, MAX_TICKS)).toThrow();
  });
});
