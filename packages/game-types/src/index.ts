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
  readonly velocity: Vec3;
  /** Heading around the Y axis in radians; 0 faces +Z. */
  readonly yaw: number;
  /** Cast button state last tick, so the sim can tell a fresh press from a hold. */
  readonly castHeld: boolean;
}

/**
 * The fishing line. Idle: reeled in at the rod. Cast: the hook sits in the
 * water where it landed, `length` metres of line from the rod tip.
 */
export type LineState =
  | { readonly phase: "idle" }
  | { readonly phase: "cast"; readonly hookPosition: Vec3; readonly length: number };

/** What the fish player wants to do this tick. Intent only, never results. */
export interface FishInput {
  /** Desired swim direction; magnitude above 1 is normalised. */
  readonly move: HorizontalVec;
  /** Held to swim down; released, the fish rises back to the surface. */
  readonly dive: boolean;
}

/** What the fisherman player wants to do this tick. Intent only, never results. */
export interface FishermanInput {
  /** Desired walk direction on the dock; magnitude above 1 is normalised. */
  readonly move: HorizontalVec;
  /** Cast button held. A fresh press casts, or retrieves a cast hook. */
  readonly cast: boolean;
}

/** Every player's intent for one tick. */
export interface MatchInputs {
  readonly fish: FishInput;
  readonly fisherman: FishermanInput;
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
  readonly line: LineState;
}
