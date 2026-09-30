import { describe, expect, it } from "vitest";

import { sagCurvePoints } from "./lineCurve";

const START = { x: 0, y: 4, z: 10 };
const END = { x: 2, y: 0, z: -6 };

describe("sagCurvePoints", () => {
  it("returns segments + 1 points from start to end exactly", () => {
    const points = sagCurvePoints(START, END, 1.5, 8);
    expect(points).toHaveLength(9);
    expect(points[0]).toEqual(START);
    expect(points[8]).toEqual(END);
  });

  it("drops the midpoint by the sag below the straight line", () => {
    const points = sagCurvePoints(START, END, 1.5, 8);
    const mid = points[4];
    expect(mid?.x).toBeCloseTo(1);
    expect(mid?.z).toBeCloseTo(2);
    expect(mid?.y).toBeCloseTo(2 - 1.5);
  });

  it("is a straight line with no sag", () => {
    const points = sagCurvePoints(START, END, 0, 4);
    expect(points[2]?.y).toBeCloseTo(2);
  });
});
