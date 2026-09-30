import type { FishInput, FishState } from "@fishwar/game-types";

import type { MatchConfig } from "../config";
import { clamp } from "../math";
import { integrateKinematic, type Bounds2D } from "./kinematics";

/** Whether the fish is close enough to y = 0 to count as surfaced. */
export function isAtSurface(fish: FishState, config: MatchConfig): boolean {
  return fish.position.y >= -config.fish.surfaceTolerance;
}

/** Vertical velocity this tick: down while diving, otherwise back up. */
function verticalVelocity(input: FishInput, config: MatchConfig): number {
  return input.dive ? -config.fish.diveSpeed : config.fish.surfaceSpeed;
}

function pondBounds(config: MatchConfig): Bounds2D {
  const halfWidth = config.pond.width / 2;
  const halfLength = config.pond.length / 2;
  return { minX: -halfWidth, maxX: halfWidth, minZ: -halfLength, maxZ: halfLength };
}

/**
 * Swimming: horizontal movement inside the pond (shared kinematics), plus
 * diving or rising between the pond floor and the surface.
 */
export function stepFishMovement(
  fish: FishState,
  input: FishInput,
  config: MatchConfig,
  dt: number,
): FishState {
  const { swimSpeed, acceleration, deceleration } = config.fish;
  const planar = integrateKinematic(
    { position: fish.position, velocity: fish.velocity, yaw: fish.yaw },
    input.move,
    { maxSpeed: swimSpeed, acceleration, deceleration },
    pondBounds(config),
    dt,
  );

  const vy = verticalVelocity(input, config);
  const rawY = fish.position.y + vy * dt;
  const y = clamp(rawY, -config.pond.depth, 0);

  return {
    ...fish,
    position: { x: planar.position.x, y, z: planar.position.z },
    velocity: { x: planar.velocity.x, y: y === rawY ? vy : 0, z: planar.velocity.z },
    yaw: planar.yaw,
  };
}
