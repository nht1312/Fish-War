import type { FishermanInput, FishermanState } from "@fishwar/game-types";

import type { MatchConfig } from "../config";
import { integrateKinematic, type Bounds2D } from "./kinematics";

function dockBounds(config: MatchConfig): Bounds2D {
  const { center, width, length } = config.dock;
  return {
    minX: center.x - width / 2,
    maxX: center.x + width / 2,
    minZ: center.z - length / 2,
    maxZ: center.z + length / 2,
  };
}

/** Walking on the dock: shared kinematics clamped to the dock, at dock height. */
export function stepFishermanMovement(
  fisherman: FishermanState,
  input: FishermanInput,
  config: MatchConfig,
  dt: number,
): FishermanState {
  const { moveSpeed, acceleration, deceleration } = config.fisherman;
  const planar = integrateKinematic(
    { position: fisherman.position, velocity: fisherman.velocity, yaw: fisherman.yaw },
    input.move,
    { maxSpeed: moveSpeed, acceleration, deceleration },
    dockBounds(config),
    dt,
  );

  return {
    ...fisherman,
    position: { x: planar.position.x, y: config.dock.height, z: planar.position.z },
    velocity: { x: planar.velocity.x, y: 0, z: planar.velocity.z },
    yaw: planar.yaw,
  };
}
