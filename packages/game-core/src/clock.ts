export interface ClockAdvance {
  /** Fixed-duration simulation ticks to run this frame. */
  readonly ticks: number;
  /** Leftover time (< tickDt) to carry into the next frame. */
  readonly accumulator: number;
}

/**
 * Fixed-timestep accumulator: converts variable frame time into a whole number
 * of fixed simulation ticks. When a frame is too long (e.g. a background tab),
 * at most `maxTicks` run and the backlog is dropped instead of snowballing.
 */
export function advanceClock(
  accumulator: number,
  frameDt: number,
  tickDt: number,
  maxTicks: number,
): ClockAdvance {
  if (tickDt <= 0) {
    throw new Error(`advanceClock: tickDt (${tickDt}) must be > 0`);
  }
  const total = accumulator + Math.max(frameDt, 0);
  const due = Math.floor(total / tickDt);
  const remainder = total - due * tickDt;
  return { ticks: Math.min(due, maxTicks), accumulator: remainder };
}
