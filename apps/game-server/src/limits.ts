/**
 * Per-connection abuse limits. Pure functions with explicit time, so they are
 * unit-testable; index.ts applies them to each socket.
 */

/** Messages larger than this are ignored (a real input message is ~150 bytes). */
export const MAX_MESSAGE_BYTES = 1024;

const MS_PER_SECOND = 1000;

/** Token bucket: holds at most one second of messages, refilled continuously. */
export interface RateBucket {
  readonly tokens: number;
  readonly lastMs: number;
}

export function createRateBucket(perSecond: number, nowMs: number): RateBucket {
  return { tokens: perSecond, lastMs: nowMs };
}

export interface RateDecision {
  readonly bucket: RateBucket;
  readonly allowed: boolean;
}

/** Spend one token for a message if there is one; refill by elapsed time first. */
export function allowMessage(bucket: RateBucket, nowMs: number, perSecond: number): RateDecision {
  const elapsedSeconds = Math.max(nowMs - bucket.lastMs, 0) / MS_PER_SECOND;
  const tokens = Math.min(bucket.tokens + elapsedSeconds * perSecond, perSecond);
  if (tokens < 1) return { bucket: { tokens, lastMs: nowMs }, allowed: false };
  return { bucket: { tokens: tokens - 1, lastMs: nowMs }, allowed: true };
}

export function isWithinSizeLimit(bytes: number): boolean {
  return bytes <= MAX_MESSAGE_BYTES;
}
