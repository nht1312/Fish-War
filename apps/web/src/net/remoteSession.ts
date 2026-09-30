import {
  advanceClock,
  createMatch,
  parseServerMessage,
  type MatchConfig,
} from "@fishwar/game-core";
import type { ClientMessage, MatchInputs } from "@fishwar/game-types";

import type { SimRunner } from "../sim/simRunner";
import { browserConnect, type Connect } from "./connect";
import { INITIAL_CONNECTION, reduceConnection, reduceConnectionClosed } from "./connection";
import { addSnapshot, EMPTY_BUFFER, sampleBuffer } from "./snapshotBuffer";

/** Render this many ticks behind the server, so there is a snapshot on each side to blend. */
const INTERPOLATION_DELAY_TICKS = 2;
const MS_PER_SECOND = 1000;

const browserNow = () => performance.now() / MS_PER_SECOND;

/**
 * An online game session. The server is authoritative: this only sends our
 * own role's intent (at most once per sim tick) and shows the server's state,
 * smoothed by rendering slightly in the past between the last two snapshots.
 * `now` (seconds) is injectable for tests.
 */
export function createRemoteSession(
  config: MatchConfig,
  url: string,
  connect: Connect = browserConnect,
  now: () => number = browserNow,
): SimRunner {
  const tickDt = 1 / config.tickRate;
  const renderDelay = INTERPOLATION_DELAY_TICKS * tickDt;
  const beforeFirstSnapshot = createMatch(config);
  let buffer = EMPTY_BUFFER;
  let connection = INITIAL_CONNECTION;
  let accumulator = 0;
  let seq = 0;

  const socket = connect(url, {
    onMessage(data) {
      const message = parseServerMessage(data);
      if (!message) return;
      connection = reduceConnection(connection, message);
      if (message.type === "snapshot") buffer = addSnapshot(buffer, message.state, now());
    },
    onClose() {
      connection = reduceConnectionClosed(connection);
    },
  });

  const send = (message: ClientMessage) => socket.send(JSON.stringify(message));

  return {
    config,
    getState: () => sampleBuffer(buffer, now(), renderDelay) ?? beforeFirstSnapshot,
    getConnection: () => connection,
    advance(frameDt, inputs: MatchInputs) {
      const clock = advanceClock(accumulator, frameDt, tickDt, config.maxTicksPerFrame);
      accumulator = clock.accumulator;
      const { role } = connection;
      if (clock.ticks === 0 || role === null) return;
      seq += 1;
      send({ type: "input", seq, input: inputs[role] });
    },
    restart: () => send({ type: "rematch" }),
    dispose: () => socket.close(),
  };
}
