import { advanceClock, createMatch, stepMatch, type MatchConfig } from "@fishwar/game-core";
import type { MatchState } from "@fishwar/game-types";

/**
 * Owns the offline simulation outside React. The render loop feeds it real
 * frame time; it runs fixed-duration ticks through the pure game-core step.
 */
export interface SimRunner {
  readonly config: MatchConfig;
  getState(): MatchState;
  /** Advance by one rendered frame of `frameDt` seconds. */
  advance(frameDt: number): void;
}

export function createSimRunner(config: MatchConfig): SimRunner {
  const tickDt = 1 / config.tickRate;
  let state = createMatch(config);
  let accumulator = 0;

  return {
    config,
    getState: () => state,
    advance(frameDt) {
      const clock = advanceClock(accumulator, frameDt, tickDt, config.maxTicksPerFrame);
      accumulator = clock.accumulator;
      for (let i = 0; i < clock.ticks; i++) {
        state = stepMatch(state, tickDt);
      }
    },
  };
}
