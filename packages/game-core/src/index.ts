import type { Role } from "@fishwar/game-types";

/**
 * Foundational pure gameplay helpers.
 *
 * Everything here must stay a pure function (no rendering, no I/O, no global
 * state) so it can run identically on the authoritative server and, later, in
 * client-side prediction. Real systems (stamina, line tension, drag, capture)
 * build on top of these in subsequent steps.
 */

/** Return the opposing role. */
export function opponentOf(role: Role): Role {
  return role === "fish" ? "fisherman" : "fish";
}

export { clamp } from "./math";
export { advanceClock, type ClockAdvance } from "./clock";
export {
  DEFAULT_CONFIG,
  type DockConfig,
  type FishConfig,
  type FishermanConfig,
  type LineConfig,
  type MatchConfig,
  type PondConfig,
  type ReelConfig,
  type RodConfig,
  type TensionConfig,
} from "./config";
export { createMatch, stepMatch } from "./match";
export { stepHookedFight, type FightStep } from "./systems/fight";
export { stepFishermanMovement } from "./systems/fishermanMovement";
export { isAtSurface, stepFishMovement } from "./systems/fishMovement";
export { castLandingPoint, constrainToLine, rodTipPosition, stepLine } from "./systems/line";
export { payOutLine, reelInLine, stepDrag } from "./systems/reel";
export { linePull, stepTension, type TensionState, type TensionStep } from "./systems/tension";
export {
  integrateKinematic,
  type Bounds2D,
  type KinematicParams,
  type PlanarBody,
} from "./systems/kinematics";
