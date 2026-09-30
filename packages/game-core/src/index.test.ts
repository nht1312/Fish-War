import { describe, expect, it } from "vitest";

import { clamp, opponentOf } from "./index";

describe("clamp", () => {
  it("returns the value when already in range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps below the minimum and above the maximum", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });

  it("throws when min is greater than max", () => {
    expect(() => clamp(1, 10, 0)).toThrow();
  });
});

describe("opponentOf", () => {
  it("maps each role to its opponent", () => {
    expect(opponentOf("fish")).toBe("fisherman");
    expect(opponentOf("fisherman")).toBe("fish");
  });
});
