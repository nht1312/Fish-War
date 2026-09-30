/**
 * Shared, engine-agnostic types for Fish War.
 *
 * Rendering (apps/web), networking, and gameplay (packages/game-core) all depend
 * on these. Keep this package free of runtime/framework imports so both the
 * browser and the Node server can consume it.
 */

/** The two asymmetric roles in a match. */
export const ROLES = ["fish", "fisherman"] as const;

export type Role = (typeof ROLES)[number];

/** A point or vector in world space. Y is up; the water surface is y = 0. */
export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** A direction or velocity in the horizontal (XZ) plane. */
export interface HorizontalVec {
  readonly x: number;
  readonly z: number;
}

export interface FishState {
  /** Centre of the fish's body. */
  readonly position: Vec3;
  readonly velocity: Vec3;
  /** Heading around the Y axis in radians; 0 faces +Z. */
  readonly yaw: number;
}

export interface FishermanState {
  /** Where the fisherman's feet touch the dock. */
  readonly position: Vec3;
}

/** What the fish player wants to do this tick. Intent only, never results. */
export interface FishInput {
  /** Desired swim direction; magnitude above 1 is normalised. */
  readonly move: HorizontalVec;
}

/** Every player's intent for one tick. */
export interface MatchInputs {
  readonly fish: FishInput;
}

/**
 * The full simulation state of one match. Plain JSON data only (no classes,
 * Maps, or functions) so it can later be sent over the network unchanged.
 */
export interface MatchState {
  readonly tick: number;
  /** Simulated seconds since the match was created. */
  readonly time: number;
  readonly fish: FishState;
  readonly fisherman: FishermanState;
}
