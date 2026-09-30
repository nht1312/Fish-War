import { interpolateState } from "@fishwar/game-core";
import type { MatchState } from "@fishwar/game-types";

/** Enough history for any sane render delay; older snapshots are dropped. */
const MAX_SNAPSHOTS = 32;

/**
 * Recent server snapshots on the server's own timeline (`state.time`).
 * `offset` maps local time to server time. It is the largest
 * `state.time - receivedAt` seen, i.e. taken from the least-delayed snapshot,
 * so late arrivals (network jitter, server catch-up ticks) do not shift it.
 */
export interface SnapshotBuffer {
  readonly snapshots: readonly MatchState[];
  readonly offset: number;
}

export const EMPTY_BUFFER: SnapshotBuffer = { snapshots: [], offset: Number.NEGATIVE_INFINITY };

/** Add a snapshot received at local time `receivedAt` (seconds). */
export function addSnapshot(
  buffer: SnapshotBuffer,
  state: MatchState,
  receivedAt: number,
): SnapshotBuffer {
  const newest = buffer.snapshots[buffer.snapshots.length - 1];
  // A rematch restarts the server's clock: the old timeline no longer applies.
  const start = newest && state.tick < newest.tick ? EMPTY_BUFFER : buffer;
  const latest = start.snapshots[start.snapshots.length - 1];
  if (latest && state.tick === latest.tick) return start;

  return {
    snapshots: [...start.snapshots, state].slice(-MAX_SNAPSHOTS),
    offset: Math.max(start.offset, state.time - receivedAt),
  };
}

/**
 * The state to draw at local time `now`: `delay` seconds behind the server,
 * blended between the two snapshots around that moment. Before the oldest it
 * shows the oldest; past the newest it holds the newest (no extrapolation).
 */
export function sampleBuffer(buffer: SnapshotBuffer, now: number, delay: number): MatchState | null {
  const { snapshots } = buffer;
  const first = snapshots[0];
  if (!first) return null;

  const renderTime = now + buffer.offset - delay;
  const after = snapshots.findIndex((s) => s.time >= renderTime);
  if (after === 0) return first;
  if (after === -1) return snapshots[snapshots.length - 1] ?? first;

  const a = snapshots[after - 1] ?? first;
  const b = snapshots[after] ?? first;
  const span = b.time - a.time;
  return interpolateState(a, b, span > 0 ? (renderTime - a.time) / span : 1);
}
