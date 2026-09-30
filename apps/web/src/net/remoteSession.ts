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

/**
 * An online game session. The server is authoritative: this only sends our
 * own role's intent (at most once per sim tick) and shows the latest snapshot.
 */
export function createRemoteSession(
  config: MatchConfig,
  url: string,
  connect: Connect = browserConnect,
): SimRunner {
  const tickDt = 1 / config.tickRate;
  let state = createMatch(config);
  let connection = INITIAL_CONNECTION;
  let accumulator = 0;
  let seq = 0;

  const socket = connect(url, {
    onMessage(data) {
      const message = parseServerMessage(data);
      if (!message) return;
      connection = reduceConnection(connection, message);
      if (message.type === "snapshot") state = message.state;
    },
    onClose() {
      connection = reduceConnectionClosed(connection);
    },
  });

  const send = (message: ClientMessage) => socket.send(JSON.stringify(message));

  return {
    config,
    getState: () => state,
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
