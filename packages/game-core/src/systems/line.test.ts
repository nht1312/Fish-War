import type { FishermanInput, FishermanState, LineState } from "@fishwar/game-types";
import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../config";
import { castLandingPoint, rodTipPosition, stepLine } from "./line";

const { rod: ROD, pond: POND } = DEFAULT_CONFIG;
const FACING_POND = Math.PI;
const FACING_LAND = 0;

function fishermanAt(x: number, z: number, yaw: number): FishermanState {
  return {
    position: { x, y: DEFAULT_CONFIG.dock.height, z },
    velocity: { x: 0, y: 0, z: 0 },
    yaw,
    castHeld: false,
  };
}

const onDock = fishermanAt(0, 17, FACING_POND);
const IDLE: LineState = { phase: "idle" };
const press = (cast: boolean): FishermanInput => ({ move: { x: 0, z: 0 }, cast });

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
    const line = stepLine(IDLE, onDock, press(true), DEFAULT_CONFIG);
    if (line.phase !== "cast") throw new Error(`expected cast, got ${line.phase}`);

    const hook = castLandingPoint(onDock, DEFAULT_CONFIG);
    const tip = rodTipPosition(onDock, DEFAULT_CONFIG);
    expect(line.hookPosition).toEqual(hook);
    expect(line.length).toBeCloseTo(Math.hypot(hook.x - tip.x, hook.y - tip.y, hook.z - tip.z));
  });

  it("stays idle without a press", () => {
    expect(stepLine(IDLE, onDock, press(false), DEFAULT_CONFIG)).toEqual(IDLE);
  });

  it("ignores a held button (only a fresh press counts)", () => {
    const holding = { ...onDock, castHeld: true };
    expect(stepLine(IDLE, holding, press(true), DEFAULT_CONFIG)).toEqual(IDLE);
  });

  it("retrieves the hook on a fresh press while cast", () => {
    const cast = stepLine(IDLE, onDock, press(true), DEFAULT_CONFIG);
    expect(stepLine(cast, onDock, press(true), DEFAULT_CONFIG)).toEqual(IDLE);
  });

  it("keeps the hook where it landed while the fisherman walks", () => {
    const cast = stepLine(IDLE, onDock, press(true), DEFAULT_CONFIG);
    const walked = { ...fishermanAt(3, 16, FACING_POND), castHeld: true };
    expect(stepLine(cast, walked, press(true), DEFAULT_CONFIG)).toEqual(cast);
  });
});
