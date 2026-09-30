import { advanceClock, createMatch, stepMatch, type MatchConfig } from "@fishwar/game-core";
import type { MatchInputs, MatchState } from "@fishwar/game-types";

import type { ConnectionStatus } from "../net/connection";

/**
 * A running game session, as the scene sees it. The render loop feeds it real
 * frame time and the current inputs; it provides the state to draw. Offline it
 * runs the simulation itself; online (net/remoteSession) the server does.
 */
export interface SimRunner {
  readonly config: MatchConfig;
  getState(): MatchState;
  /** Online connection status; null when playing offline. */
  getConnection(): ConnectionStatus | null;
  /** Advance by one rendered frame of `frameDt` seconds. */
  advance(frameDt: number, inputs: MatchInputs): void;
  /** Start a new match (offline immediately; online by asking the server). */
  restart(): void;
  /** Release resources (sockets) when the scene goes away. */
  dispose(): void;
}

/** The offline session: runs fixed-duration ticks through the pure game-core step. */
export function createSimRunner(config: MatchConfig): SimRunner {
  const tickDt = 1 / config.tickRate;
  let state = createMatch(config);
  let accumulator = 0;

  return {
    config,
    getState: () => state,
    getConnection: () => null,
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
    dispose() {},
  };
}
