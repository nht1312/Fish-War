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
  /** 0..maxStamina. Hooked at 0, the fish is exhausted. */
  readonly stamina: number;
  /** Seconds until the fish can dash again; 0 when ready. */
  readonly dashCooldown: number;
}

export interface FishermanState {
  /** Where the fisherman's feet touch the dock. */
  readonly position: Vec3;
  readonly velocity: Vec3;
  /** Heading around the Y axis in radians; 0 faces +Z. */
  readonly yaw: number;
  /** Cast button state last tick, so the sim can tell a fresh press from a hold. */
  readonly castHeld: boolean;
  /** Reel drag: the tension above which the reel lets line out. */
  readonly drag: number;
}

/**
 * The fishing line. Idle: reeled in at the rod. Cast: the hook sits in the
 * water where it landed, `length` metres of line from the rod tip. Hooked: the
 * fish is on the line and can be at most `length` metres from the rod tip;
 * `tension` builds while it pulls, and `overTensionTime` counts seconds spent
 * at breaking strength.
 */
export type LineState =
  | { readonly phase: "idle" }
  | { readonly phase: "cast"; readonly hookPosition: Vec3; readonly length: number }
  | {
      readonly phase: "hooked";
      readonly length: number;
      readonly tension: number;
      readonly overTensionTime: number;
    };

/** Why a match ended. More reasons arrive with their systems. */
export type OutcomeReason = "line-broken" | "fish-exhausted";

export interface MatchOutcome {
  readonly winner: Role;
  readonly reason: OutcomeReason;
}

/** What the fish player wants to do this tick. Intent only, never results. */
export interface FishInput {
  /** Desired swim direction; magnitude above 1 is normalised. */
  readonly move: HorizontalVec;
  /** Held to swim down; released, the fish rises back to the surface. */
  readonly dive: boolean;
  /** Held to swim faster at the cost of stamina. */
  readonly sprint: boolean;
  /** Dash button; dashes whenever the dash is ready. */
  readonly dash: boolean;
}

/** What the fisherman player wants to do this tick. Intent only, never results. */
export interface FishermanInput {
  /** Desired walk direction on the dock; magnitude above 1 is normalised. */
  readonly move: HorizontalVec;
  /** Cast button. A fresh press casts or retrieves; held while hooked, it reels. */
  readonly cast: boolean;
  /** Drag adjustment direction, -1 (looser) to 1 (tighter). */
  readonly dragChange: number;
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
  /** Set once a win condition is met; null while the match is undecided. */
  readonly outcome: MatchOutcome | null;
}
