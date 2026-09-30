import type { MatchOutcome, Vec3 } from "@fishwar/game-types";

import type { MatchConfig } from "../config";

/** Everything that can end a match, as detected during one tick. */
export interface OutcomeEvents {
  readonly captured: boolean;
  readonly fishExhausted: boolean;
  readonly lineBroken: boolean;
  readonly fishermanKnockedOut: boolean;
  readonly fishEscaped: boolean;
  readonly timeExpired: boolean;
}

export const NO_EVENTS: OutcomeEvents = {
  captured: false,
  fishExhausted: false,
  lineBroken: false,
  fishermanKnockedOut: false,
  fishEscaped: false,
  timeExpired: false,
};

/**
 * Same-tick priority, highest first: the fisherman's decisive catches, then
 * the fish's wins, and the buzzer last (a win on the final tick counts).
 */
const PRIORITY: ReadonlyArray<readonly [keyof OutcomeEvents, MatchOutcome]> = [
  ["captured", { winner: "fisherman", reason: "captured" }],
  ["fishExhausted", { winner: "fisherman", reason: "fish-exhausted" }],
  ["lineBroken", { winner: "fish", reason: "line-broken" }],
  ["fishermanKnockedOut", { winner: "fish", reason: "fisherman-knocked-out" }],
  ["fishEscaped", { winner: "fish", reason: "fish-escaped" }],
  ["timeExpired", { winner: "fish", reason: "timeout" }],
];

/** The single place every win condition (CLAUDE.md section 4) is decided. */
export function resolveOutcome(events: OutcomeEvents): MatchOutcome | null {
  const decided = PRIORITY.find(([event]) => events[event]);
  return decided ? decided[1] : null;
}

/** Whether a point is inside the escape zone (at any depth). */
export function isInEscapeZone(position: Vec3, config: MatchConfig): boolean {
  const { center, halfWidth, halfLength } = config.escapeZone;
  return (
    Math.abs(position.x - center.x) <= halfWidth && Math.abs(position.z - center.z) <= halfLength
  );
}
