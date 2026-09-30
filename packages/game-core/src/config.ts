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

export interface FishConfig {
  /** Top horizontal swim speed (m/s). */
  readonly swimSpeed: number;
  /** How fast the fish speeds up toward its input (m/s²). */
  readonly acceleration: number;
  /** How fast the fish glides to a stop without input (m/s²). */
  readonly deceleration: number;
  /** Downward speed while diving (m/s). */
  readonly diveSpeed: number;
  /** Upward speed back to the surface when not diving (m/s). */
  readonly surfaceSpeed: number;
  /** How far below y = 0 the fish still counts as at the surface (m). */
  readonly surfaceTolerance: number;
}

export interface FishermanConfig {
  /** Top walking speed on the dock (m/s). */
  readonly moveSpeed: number;
  readonly acceleration: number;
  readonly deceleration: number;
  /** Heading at spawn in radians; PI faces -Z, out over the pond. */
  readonly spawnYaw: number;
}

export interface RodConfig {
  /** Rod tip height above the fisherman's feet (m). */
  readonly tipHeight: number;
  /** Rod tip distance in front of the fisherman (m). */
  readonly tipReach: number;
  /** Horizontal distance a cast lands in front of the fisherman (m). */
  readonly castDistance: number;
}

export interface LineConfig {
  /** A fish this close (3D) to a cast hook gets hooked (m). */
  readonly hookRadius: number;
}

export interface TensionConfig {
  /** Tension at which the line starts to fail. */
  readonly breakStrength: number;
  /** Tension gained per second per m/s of outward pull. */
  readonly pullToTension: number;
  /** Tension lost per second, always. */
  readonly decayRate: number;
  /** Seconds at breakStrength before the line snaps. */
  readonly breakGraceSeconds: number;
  /** The line counts as taut within this distance of full length (m). */
  readonly tautTolerance: number;
}

/** Every gameplay tuning value. Passed in, never hard-coded in systems. */
export interface MatchConfig {
  /** Simulation ticks per second. */
  readonly tickRate: number;
  /** Upper bound on ticks run for one rendered frame (avoids a death spiral). */
  readonly maxTicksPerFrame: number;
  readonly pond: PondConfig;
  readonly dock: DockConfig;
  readonly fish: FishConfig;
  readonly fisherman: FishermanConfig;
  readonly rod: RodConfig;
  readonly line: LineConfig;
  readonly tension: TensionConfig;
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
  fish: {
    swimSpeed: 6,
    acceleration: 20,
    deceleration: 10,
    diveSpeed: 3,
    surfaceSpeed: 2,
    surfaceTolerance: 0.1,
  },
  fisherman: { moveSpeed: 4, acceleration: 25, deceleration: 25, spawnYaw: Math.PI },
  rod: { tipHeight: 2.2, tipReach: 1.2, castDistance: 12 },
  line: { hookRadius: 1 },
  tension: {
    breakStrength: 100,
    pullToTension: 7.5,
    decayRate: 20,
    breakGraceSeconds: 1,
    tautTolerance: 0.05,
  },
  fishSpawn: { x: 0, y: -FISH_SPAWN_DEPTH, z: 0 },
  fishermanSpawn: { x: DOCK.center.x, y: DOCK.height, z: DOCK.center.z },
};
