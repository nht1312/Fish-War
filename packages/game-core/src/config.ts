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
  readonly maxStamina: number;
  /** Swim speed multiplier while sprinting. */
  readonly sprintMultiplier: number;
  /** Stamina lost per second while sprinting. */
  readonly sprintDrain: number;
  /** Stamina lost per second per point of line tension. */
  readonly tensionDrain: number;
  /** Stamina regained per second while resting. */
  readonly staminaRegen: number;
  /** Speed added along the fish's facing by a dash (m/s). */
  readonly dashImpulse: number;
  /** Stamina a dash costs. */
  readonly dashCost: number;
  /** Seconds between dashes. */
  readonly dashCooldown: number;
  /** Line tension added instantly by a dash while hooked. */
  readonly dashTensionSpike: number;
}

export interface FishermanConfig {
  /** Top walking speed on the dock (m/s). */
  readonly moveSpeed: number;
  readonly acceleration: number;
  readonly deceleration: number;
  /** Heading at spawn in radians; PI faces -Z, out over the pond. */
  readonly spawnYaw: number;
  /** Speed of the dodge burst (m/s). */
  readonly dodgeSpeed: number;
  /** Seconds of invulnerability to shots after a dodge starts. */
  readonly dodgeIFrameSeconds: number;
  /** Seconds between dodges. */
  readonly dodgeCooldown: number;
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

export interface ReelConfig {
  /** Line reeled in per second while reeling (m/s). */
  readonly reelSpeed: number;
  /** Scales how much reeling against a pulling fish adds to tension. */
  readonly rodForce: number;
  /** Shortest line; keeps the hooked fish in the water below the rod tip (m). */
  readonly minLength: number;
  /** All the line on the reel; the drag cannot let out more (m). */
  readonly maxLength: number;
  readonly minDrag: number;
  /** Highest drag; at breakStrength the reel never slips. */
  readonly maxDrag: number;
  readonly initialDrag: number;
  /** Drag change per second while adjusting. */
  readonly dragAdjustRate: number;
}

export interface WaterGunConfig {
  /** Approximate shot speed; sets the flight time of an aimed shot (m/s). */
  readonly shotSpeed: number;
  /** Downward acceleration on shots (m/s²). */
  readonly gravity: number;
  /** Seconds between shots. */
  readonly shotCooldown: number;
  /** Shots older than this expire (s). */
  readonly maxShotAge: number;
  /** A shot this close to the target hits (m). */
  readonly hitRadius: number;
  /** Height of the fisherman's torso above his feet: the aim point (m). */
  readonly targetHeight: number;
  readonly maxBalance: number;
  /** Balance lost per hit. */
  readonly hitDamage: number;
  /** Balance regained per second between hits. */
  readonly balanceRegen: number;
  /** Seconds a hit stops the fisherman from reeling. */
  readonly staggerSeconds: number;
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
  readonly reel: ReelConfig;
  readonly waterGun: WaterGunConfig;
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
    maxStamina: 100,
    sprintMultiplier: 1.6,
    sprintDrain: 20,
    tensionDrain: 0.12,
    staminaRegen: 12,
    dashImpulse: 10,
    dashCost: 15,
    dashCooldown: 1.5,
    dashTensionSpike: 25,
  },
  fisherman: {
    moveSpeed: 4,
    acceleration: 25,
    deceleration: 25,
    spawnYaw: Math.PI,
    dodgeSpeed: 12,
    dodgeIFrameSeconds: 0.35,
    dodgeCooldown: 1.2,
  },
  rod: { tipHeight: 2.2, tipReach: 1.2, castDistance: 12 },
  line: { hookRadius: 1 },
  tension: {
    breakStrength: 100,
    pullToTension: 7.5,
    decayRate: 20,
    breakGraceSeconds: 1,
    tautTolerance: 0.05,
  },
  reel: {
    reelSpeed: 3,
    rodForce: 2,
    minLength: 4,
    maxLength: 30,
    minDrag: 20,
    maxDrag: 100,
    initialDrag: 60,
    dragAdjustRate: 40,
  },
  waterGun: {
    shotSpeed: 14,
    gravity: 9.8,
    shotCooldown: 0.8,
    maxShotAge: 3,
    hitRadius: 0.8,
    targetHeight: 1.4,
    maxBalance: 100,
    hitDamage: 20,
    balanceRegen: 5,
    staggerSeconds: 0.6,
  },
  fishSpawn: { x: 0, y: -FISH_SPAWN_DEPTH, z: 0 },
  fishermanSpawn: { x: DOCK.center.x, y: DOCK.height, z: DOCK.center.z },
};
