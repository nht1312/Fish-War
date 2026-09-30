import type { FishermanInput, FishermanState, FishState, LineState } from "@fishwar/game-types";
import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../config";
import { castLandingPoint, constrainToLine, rodTipPosition, stepLine } from "./line";

const { rod: ROD, pond: POND } = DEFAULT_CONFIG;
const FACING_POND = Math.PI;
const FACING_LAND = 0;

function fishermanAt(x: number, z: number, yaw: number): FishermanState {
  return {
    position: { x, y: DEFAULT_CONFIG.dock.height, z },
    velocity: { x: 0, y: 0, z: 0 },
    yaw,
    castHeld: false,
    drag: DEFAULT_CONFIG.reel.initialDrag,
    balance: DEFAULT_CONFIG.waterGun.maxBalance,
    staggerTime: 0,
    dodgeCooldown: 0,
    dodgeTime: 0,
    netCooldown: 0,
    netSwingTime: 0,
  };
}

const onDock = fishermanAt(0, 17, FACING_POND);
const IDLE: LineState = { phase: "idle" };

function fishAt(x: number, y: number, z: number, vx = 0, vz = 0): FishState {
  return { position: { x, y, z }, velocity: { x: vx, y: 0, z: vz }, yaw: 0, stamina: 100, dashCooldown: 0, shotCooldown: 0 };
}

/** A fish nowhere near any hook. */
const FAR_FISH = fishAt(-15, -5, -12);
const press = (cast: boolean): FishermanInput => ({ move: { x: 0, z: 0 }, cast, dragChange: 0, dodge: false, net: false });

describe("rodTipPosition", () => {
  it("sits tipHeight above the feet and tipReach in front", () => {
    const tip = rodTipPosition(onDock, DEFAULT_CONFIG);
    expect(tip.x).toBeCloseTo(0);
    expect(tip.y).toBeCloseTo(onDock.position.y + ROD.tipHeight);
    expect(tip.z).toBeCloseTo(17 - ROD.tipReach);
  });

  it("turns with the fisherman", () => {
    const tip = rodTipPosition(fishermanAt(0, 17, Math.PI / 2), DEFAULT_CONFIG);
    expect(tip.x).toBeCloseTo(ROD.tipReach);
    expect(tip.z).toBeCloseTo(17);
  });
});

describe("castLandingPoint", () => {
  it("lands castDistance in front of the fisherman on the water surface", () => {
    const hook = castLandingPoint(onDock, DEFAULT_CONFIG);
    expect(hook.x).toBeCloseTo(0);
    expect(hook.y).toBe(0);
    expect(hook.z).toBeCloseTo(17 - ROD.castDistance);
  });

  it("never lands on land: facing away from the pond clamps to the pond edge", () => {
    const hook = castLandingPoint(fishermanAt(0, 17, FACING_LAND), DEFAULT_CONFIG);
    expect(hook.z).toBe(POND.length / 2);
  });

  it("clamps sideways casts inside the pond", () => {
    const hook = castLandingPoint(fishermanAt(POND.width / 2, 15, Math.PI / 2), DEFAULT_CONFIG);
    expect(hook.x).toBe(POND.width / 2);
  });
});

describe("stepLine", () => {
  it("casts on a fresh press while idle", () => {
    const line = stepLine(IDLE, onDock, FAR_FISH, press(true), DEFAULT_CONFIG);
    if (line.phase !== "cast") throw new Error(`expected cast, got ${line.phase}`);

    const hook = castLandingPoint(onDock, DEFAULT_CONFIG);
    const tip = rodTipPosition(onDock, DEFAULT_CONFIG);
    expect(line.hookPosition).toEqual(hook);
    expect(line.length).toBeCloseTo(Math.hypot(hook.x - tip.x, hook.y - tip.y, hook.z - tip.z));
  });

  it("stays idle without a press", () => {
    expect(stepLine(IDLE, onDock, FAR_FISH, press(false), DEFAULT_CONFIG)).toEqual(IDLE);
  });

  it("ignores a held button (only a fresh press counts)", () => {
    const holding = { ...onDock, castHeld: true };
    expect(stepLine(IDLE, holding, FAR_FISH, press(true), DEFAULT_CONFIG)).toEqual(IDLE);
  });

  it("retrieves the hook on a fresh press while cast", () => {
    const cast = stepLine(IDLE, onDock, FAR_FISH, press(true), DEFAULT_CONFIG);
    expect(stepLine(cast, onDock, FAR_FISH, press(true), DEFAULT_CONFIG)).toEqual(IDLE);
  });

  it("keeps the hook where it landed while the fisherman walks", () => {
    const cast = stepLine(IDLE, onDock, FAR_FISH, press(true), DEFAULT_CONFIG);
    const walked = { ...fishermanAt(3, 16, FACING_POND), castHeld: true };
    expect(stepLine(cast, walked, FAR_FISH, press(true), DEFAULT_CONFIG)).toEqual(cast);
  });
});

describe("hooking", () => {
  const { hookRadius } = DEFAULT_CONFIG.line;
  const cast = stepLine(IDLE, onDock, FAR_FISH, press(true), DEFAULT_CONFIG);
  if (cast.phase !== "cast") throw new Error("setup: expected a cast line");
  const hook = cast.hookPosition;
  const holding = { ...onDock, castHeld: true };
  const noPress = press(false);

  it("hooks a fish that swims within hookRadius of the hook", () => {
    const fish = fishAt(hook.x + hookRadius * 0.9, 0, hook.z);
    expect(stepLine(cast, holding, fish, noPress, DEFAULT_CONFIG).phase).toBe("hooked");
  });

  it("sets the line length to the fish's distance from the rod tip", () => {
    const fish = fishAt(hook.x, 0, hook.z + 0.5);
    const line = stepLine(cast, holding, fish, noPress, DEFAULT_CONFIG);
    if (line.phase !== "hooked") throw new Error("expected hooked");
    expect(line.tension).toBe(0);
    const tip = rodTipPosition(holding, DEFAULT_CONFIG);
    const { x, y, z } = fish.position;
    expect(line.length).toBeCloseTo(Math.hypot(x - tip.x, y - tip.y, z - tip.z));
  });

  it("does not hook a fish just outside the radius", () => {
    const fish = fishAt(hook.x + hookRadius * 1.1, 0, hook.z);
    expect(stepLine(cast, holding, fish, noPress, DEFAULT_CONFIG).phase).toBe("cast");
  });

  it("does not hook a fish diving deep under the hook", () => {
    const fish = fishAt(hook.x, -hookRadius * 2, hook.z);
    expect(stepLine(cast, holding, fish, noPress, DEFAULT_CONFIG).phase).toBe("cast");
  });

  it("never hooks while the line is idle", () => {
    const tip = rodTipPosition(onDock, DEFAULT_CONFIG);
    const fish = fishAt(tip.x, 0, tip.z);
    expect(stepLine(IDLE, onDock, fish, noPress, DEFAULT_CONFIG)).toEqual(IDLE);
  });

  it("does not retrieve the line on a cast press while hooked", () => {
    const hooked: LineState = { phase: "hooked", length: 10, tension: 0, overTensionTime: 0 };
    expect(stepLine(hooked, onDock, FAR_FISH, press(true), DEFAULT_CONFIG)).toEqual(hooked);
  });
});

describe("constrainToLine", () => {
  const tip = { x: 0, y: 3, z: 15 };
  const dist = (f: FishState) =>
    Math.hypot(f.position.x - tip.x, f.position.y - tip.y, f.position.z - tip.z);

  it("leaves a fish within the line length untouched", () => {
    const fish = fishAt(0, 0, 10, 1, 1);
    expect(constrainToLine(fish, tip, 20)).toEqual(fish);
  });

  it("pulls a fish beyond the line length back onto it, at the same depth", () => {
    const constrained = constrainToLine(fishAt(3, -2, -5), tip, 12);
    expect(dist(constrained)).toBeCloseTo(12);
    expect(constrained.position.y).toBe(-2);
  });

  it("removes only the velocity pointing away from the rod", () => {
    // Straight out from the tip along -Z, swimming away (-Z) and sideways (+X).
    const constrained = constrainToLine(fishAt(0, 0, -5, 2, -3), tip, 12);
    expect(constrained.velocity.z).toBeCloseTo(0);
    expect(constrained.velocity.x).toBeCloseTo(2);
  });

  it("keeps velocity toward the rod", () => {
    expect(constrainToLine(fishAt(0, 0, -5, 0, 3), tip, 12).velocity.z).toBeCloseTo(3);
  });
});
