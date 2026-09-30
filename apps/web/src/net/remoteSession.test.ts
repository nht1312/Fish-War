import { createMatch, DEFAULT_CONFIG } from "@fishwar/game-core";
import type { MatchInputs, MatchState, ServerMessage } from "@fishwar/game-types";
import { describe, expect, it } from "vitest";

import type { Connect, ConnectionHandlers } from "./connect";
import { createRemoteSession } from "./remoteSession";

const TICK = 1 / DEFAULT_CONFIG.tickRate;

const INPUTS: MatchInputs = {
  fish: { move: { x: 1, z: 0 }, dive: false, sprint: true, dash: false, shoot: false },
  fisherman: { move: { x: -1, z: 0 }, cast: true, dragChange: 0, dodge: false, net: false },
};

/** A fake server connection that records what the client sends. */
function fakeServer() {
  const sent: unknown[] = [];
  let handlers: ConnectionHandlers | null = null;
  let closed = false;
  const connect: Connect = (_url, h) => {
    handlers = h;
    return {
      send: (data) => sent.push(JSON.parse(data)),
      close: () => {
        closed = true;
      },
    };
  };
  const push = (message: ServerMessage) => handlers?.onMessage(JSON.stringify(message));
  return { connect, sent, push, raw: (data: string) => handlers?.onMessage(data), isClosed: () => closed };
}

function session() {
  const server = fakeServer();
  const clock = { now: 0 };
  const remote = createRemoteSession(DEFAULT_CONFIG, "ws://test", server.connect, () => clock.now);
  return { server, remote, clock };
}

describe("createRemoteSession", () => {
  it("sends nothing before the server has assigned a role", () => {
    const { server, remote } = session();
    remote.advance(TICK, INPUTS);
    expect(server.sent).toEqual([]);
  });

  it("sends only its own role's input, numbered in order", () => {
    const { server, remote } = session();
    server.push({ type: "welcome", role: "fisherman" });
    remote.advance(TICK, INPUTS);
    remote.advance(TICK, INPUTS);
    expect(server.sent).toEqual([
      { type: "input", seq: 1, input: INPUTS.fisherman },
      { type: "input", seq: 2, input: INPUTS.fisherman },
    ]);
  });

  it("sends at most once per sim tick, however often it renders", () => {
    const { server, remote } = session();
    server.push({ type: "welcome", role: "fish" });
    for (let i = 0; i < 3; i++) remote.advance(TICK / 3 + 1e-6, INPUTS);
    expect(server.sent).toHaveLength(1);
    remote.advance(TICK * 5, INPUTS);
    expect(server.sent).toHaveLength(2);
  });

  it("shows a fresh local match until the first snapshot, then the server's state", () => {
    const { server, remote } = session();
    expect(remote.getState()).toEqual(createMatch(DEFAULT_CONFIG));
    const state: MatchState = { ...createMatch(DEFAULT_CONFIG), tick: 99, phase: "playing" };
    server.push({ type: "snapshot", state, ackSeq: 0 });
    expect(remote.getState()).toEqual(state);
  });

  it("renders between snapshots, a little behind the server", () => {
    const { server, remote, clock } = session();
    const base = createMatch(DEFAULT_CONFIG);
    for (let tick = 1; tick <= 5; tick++) {
      clock.now = tick * TICK;
      const state: MatchState = {
        ...base,
        tick,
        time: tick * TICK,
        fish: { ...base.fish, position: { x: tick, y: 0, z: 0 } },
      };
      server.push({ type: "snapshot", state, ackSeq: 0 });
    }
    clock.now = 5 * TICK + TICK / 2;
    // Two ticks behind the newest, half-way between ticks 3 and 4.
    expect(remote.getState().fish.position.x).toBeCloseTo(3.5);
  });

  it("asks the server for a rematch on restart", () => {
    const { server, remote } = session();
    remote.restart();
    expect(server.sent).toEqual([{ type: "rematch" }]);
  });

  it("tracks the connection status and ignores malformed messages", () => {
    const { server, remote } = session();
    server.push({ type: "welcome", role: "fish" });
    server.push({ type: "waiting" });
    server.raw("garbage");
    expect(remote.getConnection()).toEqual({ phase: "waiting", role: "fish" });
  });

  it("closes the connection on dispose", () => {
    const { server, remote } = session();
    remote.dispose();
    expect(server.isClosed()).toBe(true);
  });
});
