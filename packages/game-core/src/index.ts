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
  type EscapeZoneConfig,
  type FishConfig,
  type FishermanConfig,
  type LineConfig,
  type MatchConfig,
  type MatchRulesConfig,
  type NetConfig,
  type PondConfig,
  type ReelConfig,
  type RodConfig,
  type TensionConfig,
  type WaterGunConfig,
} from "./config";
export { createMatch, stepMatch } from "./match";
export { applyTensionSpike, stepDash, type DashStep } from "./systems/dash";
export { isInvulnerable, stepDodge } from "./systems/dodge";
export { stepHookedFight, type FightStep } from "./systems/fight";
export { stepFishermanMovement } from "./systems/fishermanMovement";
export { isAtSurface, stepFishMovement } from "./systems/fishMovement";
export { castLandingPoint, constrainToLine, rodTipPosition, stepLine } from "./systems/line";
export { stepNet, type NetStep } from "./systems/net";
export { isInEscapeZone, NO_EVENTS, resolveOutcome, type OutcomeEvents } from "./systems/outcome";
export { payOutLine, reelInLine, stepDrag } from "./systems/reel";
export {
  effectiveSwimSpeed,
  isSprinting,
  stepStamina,
  type StaminaLoad,
} from "./systems/stamina";
export { linePull, stepTension, type TensionState, type TensionStep } from "./systems/tension";
export {
  fireWaterGun,
  fishermanTarget,
  stepBalance,
  stepProjectiles,
  stepWaterGun,
  type FireStep,
  type ProjectileStep,
  type WaterGunStep,
} from "./systems/waterGun";
export {
  integrateKinematic,
  type Bounds2D,
  type KinematicParams,
  type PlanarBody,
} from "./systems/kinematics";
