import type {
  FishermanInput,
  FishermanState,
  FishState,
  LineState,
  Vec3,
} from "@fishwar/game-types";

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
 * Line phase transitions. A fresh press of the cast button (`fisherman.castHeld`
 * is last tick's button state, so a hold does not repeat) casts while idle and
 * retrieves while cast. A fish within hookRadius of a cast hook gets hooked.
 */
export function stepLine(
  line: LineState,
  fisherman: FishermanState,
  fish: FishState,
  input: FishermanInput,
  config: MatchConfig,
): LineState {
  const pressed = input.cast && !fisherman.castHeld;

  switch (line.phase) {
    case "idle": {
      if (!pressed) return line;
      const hookPosition = castLandingPoint(fisherman, config);
      return {
        phase: "cast",
        hookPosition,
        length: distance(rodTipPosition(fisherman, config), hookPosition),
      };
    }
    case "cast":
      if (pressed) return { phase: "idle" };
      if (distance(fish.position, line.hookPosition) <= config.line.hookRadius) {
        const length = distance(rodTipPosition(fisherman, config), fish.position);
        return { phase: "hooked", length, tension: 0, overTensionTime: 0 };
      }
      return line;
    case "hooked":
      return line;
  }
}

/**
 * Keep a hooked fish within `length` of the rod tip. The fish is pulled back
 * horizontally at its current depth (pulling straight at the tip, which is
 * above the water, would lift it out), and velocity away from the rod is
 * removed so it slides along the line's reach instead of fighting it.
 */
export function constrainToLine(fish: FishState, tip: Vec3, length: number): FishState {
  const dx = fish.position.x - tip.x;
  const dy = fish.position.y - tip.y;
  const dz = fish.position.z - tip.z;
  if (Math.hypot(dx, dy, dz) <= length) return fish;

  const horizontal = Math.hypot(dx, dz);
  if (horizontal === 0) return fish;

  const reach = Math.sqrt(Math.max(length * length - dy * dy, 0));
  const ux = dx / horizontal;
  const uz = dz / horizontal;
  const outward = Math.max(fish.velocity.x * ux + fish.velocity.z * uz, 0);

  return {
    ...fish,
    position: { x: tip.x + ux * reach, y: fish.position.y, z: tip.z + uz * reach },
    velocity: {
      x: fish.velocity.x - outward * ux,
      y: fish.velocity.y,
      z: fish.velocity.z - outward * uz,
    },
  };
}
