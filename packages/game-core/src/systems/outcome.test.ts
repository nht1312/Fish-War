import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../config";
import { isInEscapeZone, NO_EVENTS, resolveOutcome, type OutcomeEvents } from "./outcome";

const only = (event: keyof OutcomeEvents): OutcomeEvents => ({ ...NO_EVENTS, [event]: true });

describe("resolveOutcome", () => {
  it("is undecided without events", () => {
    expect(resolveOutcome(NO_EVENTS)).toBeNull();
  });

  it("maps every win condition to its winner", () => {
    expect(resolveOutcome(only("captured"))).toEqual({ winner: "fisherman", reason: "captured" });
    expect(resolveOutcome(only("fishExhausted"))).toEqual({ winner: "fisherman", reason: "fish-exhausted" });
    expect(resolveOutcome(only("lineBroken"))).toEqual({ winner: "fish", reason: "line-broken" });
    expect(resolveOutcome(only("fishermanKnockedOut"))).toEqual({
      winner: "fish",
      reason: "fisherman-knocked-out",
    });
    expect(resolveOutcome(only("fishEscaped"))).toEqual({ winner: "fish", reason: "fish-escaped" });
    expect(resolveOutcome(only("timeExpired"))).toEqual({ winner: "fish", reason: "timeout" });
  });

  it("breaks same-tick ties by the documented priority", () => {
    const all: OutcomeEvents = {
      captured: true,
      fishExhausted: true,
      lineBroken: true,
      fishermanKnockedOut: true,
      fishEscaped: true,
      timeExpired: true,
    };
    expect(resolveOutcome(all)?.reason).toBe("captured");
    expect(resolveOutcome({ ...all, captured: false })?.reason).toBe("fish-exhausted");
    expect(resolveOutcome({ ...all, captured: false, fishExhausted: false })?.reason).toBe("line-broken");
    expect(resolveOutcome({ ...NO_EVENTS, fishEscaped: true, timeExpired: true })?.reason).toBe(
      "fish-escaped",
    );
  });
});

describe("isInEscapeZone", () => {
  const { escapeZone: ZONE } = DEFAULT_CONFIG;

  it("is true inside the zone at any depth", () => {
    expect(isInEscapeZone({ x: ZONE.center.x, y: -3, z: ZONE.center.z }, DEFAULT_CONFIG)).toBe(true);
  });

  it("is false outside it", () => {
    expect(isInEscapeZone({ x: 0, y: 0, z: 0 }, DEFAULT_CONFIG)).toBe(false);
    const beside = { x: ZONE.center.x + ZONE.halfWidth + 0.1, y: 0, z: ZONE.center.z };
    expect(isInEscapeZone(beside, DEFAULT_CONFIG)).toBe(false);
  });

  it("sits at the far edge of the pond, away from the dock", () => {
    expect(ZONE.center.z + ZONE.halfLength).toBeLessThan(0);
    expect(ZONE.center.z - ZONE.halfLength).toBeGreaterThanOrEqual(-DEFAULT_CONFIG.pond.length / 2);
  });
});
