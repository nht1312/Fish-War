import type { Vec3 } from "@fishwar/game-types";

/** The pond is an axis-aligned box centred on the origin, below y = 0. */
export interface PondConfig {
  readonly width: number;
  readonly length: number;
  readonly depth: number;
}

/** The dock is a raised strip along the pond's +Z edge. */
export interface DockConfig {
  readonly width: number;
  readonly length: number;
  readonly height: number;
  /** Centre of the dock's footprint at ground level (y = 0). */
  readonly center: Vec3;
}

/** Every gameplay tuning value. Passed in, never hard-coded in systems. */
export interface MatchConfig {
  /** Simulation ticks per second. */
  readonly tickRate: number;
  /** Upper bound on ticks run for one rendered frame (avoids a death spiral). */
  readonly maxTicksPerFrame: number;
  readonly pond: PondConfig;
  readonly dock: DockConfig;
  readonly fishSpawn: Vec3;
  readonly fishermanSpawn: Vec3;
}

const POND: PondConfig = { width: 40, length: 30, depth: 6 };

const DOCK_WIDTH = 12;
const DOCK_LENGTH = 4;
const DOCK_HEIGHT = 1;

const DOCK: DockConfig = {
  width: DOCK_WIDTH,
  length: DOCK_LENGTH,
  height: DOCK_HEIGHT,
  center: { x: 0, y: 0, z: POND.length / 2 + DOCK_LENGTH / 2 },
};

/** Spawn the fish just below the surface in the middle of the pond. */
const FISH_SPAWN_DEPTH = 0.4;

export const DEFAULT_CONFIG: MatchConfig = {
  tickRate: 30,
  maxTicksPerFrame: 5,
  pond: POND,
  dock: DOCK,
  fishSpawn: { x: 0, y: -FISH_SPAWN_DEPTH, z: 0 },
  fishermanSpawn: { x: DOCK.center.x, y: DOCK.height, z: DOCK.center.z },
};
