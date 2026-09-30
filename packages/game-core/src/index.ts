import type { Role } from "@fishwar/game-types";

/**
 * Foundational pure gameplay helpers.
 *
 * Everything here must stay a pure function (no rendering, no I/O, no global
 * state) so it can run identically on the authoritative server and, later, in
 * client-side prediction. Real systems (stamina, line tension, drag, capture)
 * build on top of these in subsequent steps.
 */

/** Clamp a value into the inclusive [min, max] range. */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new Error(`clamp: min (${min}) must be <= max (${max})`);
  }
  return Math.min(Math.max(value, min), max);
}

/** Return the opposing role. */
export function opponentOf(role: Role): Role {
  return role === "fish" ? "fisherman" : "fish";
}
