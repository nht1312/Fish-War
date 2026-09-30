import { createMatch, DEFAULT_CONFIG } from "@fishwar/game-core";
import type { LineState, MatchState } from "@fishwar/game-types";
import { describe, expect, it } from "vitest";

import { detectSoundEvents } from "./soundEvents";

const base: MatchState = { ...createMatch(DEFAULT_CONFIG), phase: "playing" };
const detect = (prev: MatchState, next: MatchState) => detectSoundEvents(prev, next, DEFAULT_CONFIG);

const hooked = (length: number): LineState => ({ phase: "hooked", length, tension: 0, overTensionTime: 0 });
const cast: LineState = { phase: "cast", hookPosition: { x: 0, y: 0, z: 5 }, length: 12 };

describe("detectSoundEvents", () => {
  it("is silent when nothing changed", () => {
    expect(detect(base, base)).toEqual([]);
  });

  it("beeps each countdown second and on go", () => {
    const counting: MatchState = { ...base, phase: "countdown", countdown: 2.01 };
    expect(detect(counting, { ...counting, countdown: 1.99 })).toEqual(["countdown"]);
    expect(detect({ ...counting, countdown: 2.5 }, { ...counting, countdown: 2.1 })).toEqual([]);
    expect(detect({ ...counting, countdown: 0.01 }, { ...base, countdown: 0 })).toEqual(["go"]);
  });

  it("plays cast, hook and reel from line changes", () => {
    expect(detect(base, { ...base, line: cast })).toEqual(["cast"]);
    expect(detect({ ...base, line: cast }, { ...base, line: hooked(12) })).toEqual(["hook"]);
    expect(detect({ ...base, line: hooked(12) }, { ...base, line: hooked(11.9) })).toEqual(["reel"]);
    expect(detect({ ...base, line: hooked(12) }, { ...base, line: hooked(12.1) })).toEqual([]);
  });

  it("splashes when the fish dives under", () => {
    const surfaced = { ...base, fish: { ...base.fish, position: { x: 0, y: 0, z: 0 } } };
    const under = { ...base, fish: { ...base.fish, position: { x: 0, y: -0.5, z: 0 } } };
    expect(detect(surfaced, under)).toEqual(["dive"]);
    expect(detect(under, surfaced)).toEqual([]);
  });

  it("plays shots, hits, dashes and net swings when their timers restart", () => {
    const fish = base.fish;
    const fisherman = base.fisherman;
    expect(detect(base, { ...base, fish: { ...fish, shotCooldown: 0.8 } })).toEqual(["shoot"]);
    expect(detect(base, { ...base, fish: { ...fish, dashCooldown: 1.5 } })).toEqual(["dash"]);
    expect(detect(base, { ...base, fisherman: { ...fisherman, balance: 80 } })).toEqual(["hit"]);
    expect(detect(base, { ...base, fisherman: { ...fisherman, netSwingTime: 0.4 } })).toEqual(["net"]);
    // Timers counting down are silent.
    const cooling = { ...base, fish: { ...fish, shotCooldown: 0.5 } };
    expect(detect(cooling, { ...base, fish: { ...fish, shotCooldown: 0.4 } })).toEqual([]);
  });

  it("snaps and ends when the line breaks; other endings just end", () => {
    const snapped: MatchState = { ...base, phase: "ended", outcome: { winner: "fish", reason: "line-broken" } };
    expect(detect(base, snapped)).toEqual(["snap", "end"]);
    const netted: MatchState = { ...base, phase: "ended", outcome: { winner: "fisherman", reason: "captured" } };
    expect(detect(base, netted)).toEqual(["end"]);
    expect(detect(netted, netted)).toEqual([]);
  });
});
