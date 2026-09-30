import type { FishermanInput, FishermanState, LineState, Vec3 } from "@fishwar/game-types";

import type { MatchConfig } from "../config";
import { clamp } from "../math";

/** Unit vector the fisherman faces in the XZ plane (yaw 0 faces +Z). */
function forward(yaw: number): { x: number; z: number } {
  return { x: Math.sin(yaw), z: Math.cos(yaw) };
}

function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Where the line leaves the rod: above the feet and out in front. */
export function rodTipPosition(fisherman: FishermanState, config: MatchConfig): Vec3 {
  const { tipHeight, tipReach } = config.rod;
  const dir = forward(fisherman.yaw);
  return {
    x: fisherman.position.x + dir.x * tipReach,
    y: fisherman.position.y + tipHeight,
    z: fisherman.position.z + dir.z * tipReach,
  };
}

/** Where a cast lands: castDistance ahead on the water, clamped inside the pond. */
export function castLandingPoint(fisherman: FishermanState, config: MatchConfig): Vec3 {
  const dir = forward(fisherman.yaw);
  const halfWidth = config.pond.width / 2;
  const halfLength = config.pond.length / 2;
  return {
    x: clamp(fisherman.position.x + dir.x * config.rod.castDistance, -halfWidth, halfWidth),
    y: 0,
    z: clamp(fisherman.position.z + dir.z * config.rod.castDistance, -halfLength, halfLength),
  };
}

/**
 * Cast / retrieve on a fresh press of the cast button. `fisherman.castHeld` is
 * last tick's button state, so holding the button does not repeat the action.
 */
export function stepLine(
  line: LineState,
  fisherman: FishermanState,
  input: FishermanInput,
  config: MatchConfig,
): LineState {
  const pressed = input.cast && !fisherman.castHeld;
  if (!pressed) return line;

  if (line.phase === "cast") return { phase: "idle" };

  const hookPosition = castLandingPoint(fisherman, config);
  return {
    phase: "cast",
    hookPosition,
    length: distance(rodTipPosition(fisherman, config), hookPosition),
  };
}
