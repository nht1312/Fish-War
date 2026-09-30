import { advanceClock, createMatch, stepMatch, type MatchConfig } from "@fishwar/game-core";
import type { MatchInputs, MatchState } from "@fishwar/game-types";

/**
 * Owns the offline simulation outside React. The render loop feeds it real
 * frame time and the current inputs; it runs fixed-duration ticks through the
 * pure game-core step.
 */
export interface SimRunner {
  readonly config: MatchConfig;
  getState(): MatchState;
  /** Advance by one rendered frame of `frameDt` seconds. */
  advance(frameDt: number, inputs: MatchInputs): void;
  /** Throw the current match away and start a fresh one. */
  restart(): void;
}

export function createSimRunner(config: MatchConfig): SimRunner {
  const tickDt = 1 / config.tickRate;
  let state = createMatch(config);
  let accumulator = 0;

  return {
    config,
    getState: () => state,
    advance(frameDt, inputs) {
      const clock = advanceClock(accumulator, frameDt, tickDt, config.maxTicksPerFrame);
      accumulator = clock.accumulator;
      for (let i = 0; i < clock.ticks; i++) {
        state = stepMatch(state, inputs, config, tickDt);
      }
    },
    restart() {
      state = createMatch(config);
      accumulator = 0;
    },
  };
}
