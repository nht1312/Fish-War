import type { FishermanInput, FishermanState, FishState } from "@fishwar/game-types";
import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../config";
import { stepNet } from "./net";

const DT = 1 / DEFAULT_CONFIG.tickRate;
const { net: NET } = DEFAULT_CONFIG;

const fisherman: FishermanState = {
  position: { x: 0, y: DEFAULT_CONFIG.dock.height, z: 15.5 },
  velocity: { x: 0, y: 0, z: 0 },
  yaw: Math.PI,
  castHeld: false,
  drag: DEFAULT_CONFIG.reel.initialDrag,
  balance: DEFAULT_CONFIG.waterGun.maxBalance,
  staggerTime: 0,
  dodgeCooldown: 0,
  dodgeTime: 0,
  netCooldown: 0,
  netSwingTime: 0,
};

/** A fish `d` metres straight out from the fisherman (horizontally), at depth `y`. */
function fishAt(d: number, y = 0): FishState {
  return {
    position: { x: 0, y, z: fisherman.position.z - d },
    velocity: { x: 0, y: 0, z: 0 },
    yaw: 0,
    stamina: DEFAULT_CONFIG.fish.maxStamina,
    dashCooldown: 0,
    shotCooldown: 0,
  };
}

const swing = (on: boolean): FishermanInput => ({
  move: { x: 0, z: 0 },
  cast: false,
  dragChange: 0,
  dodge: false,
  net: on,
});

describe("stepNet", () => {
  it("captures a fish within range near the surface", () => {
    const { captured, fisherman: after } = stepNet(fisherman, fishAt(NET.range * 0.9), swing(true), DEFAULT_CONFIG, DT);
    expect(captured).toBe(true);
    expect(after.netSwingTime).toBe(NET.swingSeconds);
  });

  it("misses a fish out of range, and starts the cooldown", () => {
    const { captured, fisherman: after } = stepNet(fisherman, fishAt(NET.range * 1.1), swing(true), DEFAULT_CONFIG, DT);
    expect(captured).toBe(false);
    expect(after.netCooldown).toBe(NET.cooldown);
    expect(after.netSwingTime).toBe(NET.swingSeconds);
  });

  it("misses a fish that has dived too deep", () => {
    const deep = fishAt(1, -NET.maxDepth - 0.1);
    expect(stepNet(fisherman, deep, swing(true), DEFAULT_CONFIG, DT).captured).toBe(false);
  });

  it("catches a fish just under the surface, within maxDepth", () => {
    const shallow = fishAt(1, -NET.maxDepth);
    expect(stepNet(fisherman, shallow, swing(true), DEFAULT_CONFIG, DT).captured).toBe(true);
  });

  it("cannot swing during the cooldown, which counts down with the swing", () => {
    const cooling = { ...fisherman, netCooldown: 1, netSwingTime: 0.2 };
    const { captured, fisherman: after } = stepNet(cooling, fishAt(1), swing(true), DEFAULT_CONFIG, DT);
    expect(captured).toBe(false);
    expect(after.netCooldown).toBeCloseTo(1 - DT);
    expect(after.netSwingTime).toBeCloseTo(0.2 - DT);
  });

  it("does nothing without the button, and timers never go negative", () => {
    const almost = { ...fisherman, netCooldown: DT / 2, netSwingTime: DT / 2 };
    const { captured, fisherman: after } = stepNet(almost, fishAt(1), swing(false), DEFAULT_CONFIG, DT);
    expect(captured).toBe(false);
    expect(after.netCooldown).toBe(0);
    expect(after.netSwingTime).toBe(0);
  });
});
