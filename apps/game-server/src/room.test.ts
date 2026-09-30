import { DEFAULT_CONFIG } from "@fishwar/game-core";
import type { FishermanInput, FishInput } from "@fishwar/game-types";
import { describe, expect, it } from "vitest";

import {
  createRoom,
  joinRoom,
  leaveRoom,
  receiveInput,
  requestRematch,
  snapshotFor,
  tickRoom,
  IDLE_AFTER_SECONDS,
  type Room,
} from "./room";

const DT = 1 / DEFAULT_CONFIG.tickRate;

const SWIM_RIGHT: FishInput = {
  move: { x: 1, z: 0 },
  dive: false,
  sprint: false,
  dash: false,
  shoot: false,
};

const WALK_LEFT: FishermanInput = {
  move: { x: -1, z: 0 },
  cast: false,
  dragChange: 0,
  dodge: false,
  net: false,
};

function fullRoom(): Room {
  const first = joinRoom(createRoom(), DEFAULT_CONFIG);
  return joinRoom(first.room, DEFAULT_CONFIG).room;
}

/** A full room whose match is past the countdown. */
function playingRoom(): Room {
  const room = fullRoom();
  if (!room.match) throw new Error("setup: expected a match");
  return { ...room, match: { ...room.match, phase: "playing" } };
}

describe("joinRoom", () => {
  it("seats the first player as Fish and the second as Fisherman", () => {
    const first = joinRoom(createRoom(), DEFAULT_CONFIG);
    expect(first.role).toBe("fish");
    const second = joinRoom(first.room, DEFAULT_CONFIG);
    expect(second.role).toBe("fisherman");
  });

  it("refuses a third player", () => {
    const third = joinRoom(fullRoom(), DEFAULT_CONFIG);
    expect(third.role).toBeNull();
    expect(third.room).toEqual(fullRoom());
  });

  it("only has a match while both seats are filled", () => {
    const first = joinRoom(createRoom(), DEFAULT_CONFIG);
    expect(first.room.match).toBeNull();
    expect(fullRoom().match?.phase).toBe("countdown");
  });
});

describe("leaveRoom", () => {
  it("discards the match and keeps the other player seated", () => {
    const room = leaveRoom(fullRoom(), "fish");
    expect(room.match).toBeNull();
    expect(room.seats.fish).toBeNull();
    expect(room.seats.fisherman).not.toBeNull();
  });

  it("gives the free seat to the next player and starts a fresh match", () => {
    const rejoined = joinRoom(leaveRoom(fullRoom(), "fish"), DEFAULT_CONFIG);
    expect(rejoined.role).toBe("fish");
    expect(rejoined.room.match?.tick).toBe(0);
  });
});

describe("tickRoom", () => {
  it("steps the match with each seat's own input", () => {
    let room = receiveInput(playingRoom(), "fish", 1, SWIM_RIGHT);
    const before = room.match;
    for (let i = 0; i < 10; i++) room = tickRoom(room, DEFAULT_CONFIG, DT);
    expect(room.match?.fish.position.x).toBeGreaterThan(before?.fish.position.x ?? Infinity);
    // No fisherman input arrived, so he stands still.
    expect(room.match?.fisherman.position).toEqual(before?.fisherman.position);
  });

  it("never lets one seat's input drive the other role", () => {
    // A Fisherman-shaped input sent by the Fish seat is ignored.
    let room = receiveInput(playingRoom(), "fish", 1, WALK_LEFT);
    const before = room.match;
    for (let i = 0; i < 10; i++) room = tickRoom(room, DEFAULT_CONFIG, DT);
    expect(room.match?.fisherman.position).toEqual(before?.fisherman.position);
  });

  it("does nothing without a match", () => {
    const waiting = joinRoom(createRoom(), DEFAULT_CONFIG).room;
    expect(tickRoom(waiting, DEFAULT_CONFIG, DT)).toBe(waiting);
  });
});

describe("receiveInput", () => {
  it("ignores input for an empty seat", () => {
    const waiting = joinRoom(createRoom(), DEFAULT_CONFIG).room;
    expect(receiveInput(waiting, "fisherman", 1, WALK_LEFT)).toBe(waiting);
  });

  it("records the seq so snapshots can acknowledge it", () => {
    const room = receiveInput(playingRoom(), "fisherman", 42, WALK_LEFT);
    expect(snapshotFor(room, "fisherman")).toMatchObject({ type: "snapshot", ackSeq: 42 });
    expect(snapshotFor(room, "fish")).toMatchObject({ type: "snapshot", ackSeq: 0 });
  });
});

describe("input hardening", () => {
  it("ignores input that is not newer than the last one accepted", () => {
    const newer = receiveInput(playingRoom(), "fish", 5, SWIM_RIGHT);
    const stale = receiveInput(newer, "fish", 3, { ...SWIM_RIGHT, move: { x: -1, z: 0 } });
    expect(stale).toBe(newer);
    const duplicate = receiveInput(newer, "fish", 5, { ...SWIM_RIGHT, dash: true });
    expect(duplicate).toBe(newer);
  });

  it("a flood of inputs between ticks still acts once per tick", () => {
    const dash = { ...SWIM_RIGHT, dash: true };
    let room = playingRoom();
    const staminaBefore = room.match?.fish.stamina ?? 0;
    for (let seq = 1; seq <= 100; seq++) room = receiveInput(room, "fish", seq, dash);
    room = tickRoom(room, DEFAULT_CONFIG, DT);
    expect(room.match?.fish.stamina).toBeCloseTo(staminaBefore - DEFAULT_CONFIG.fish.dashCost, 0);
  });

  it("treats a seat that has gone silent as idle", () => {
    let room = receiveInput(playingRoom(), "fish", 1, SWIM_RIGHT);
    const silentTicks = Math.ceil(IDLE_AFTER_SECONDS / DT) + 1;
    for (let i = 0; i < silentTicks; i++) room = tickRoom(room, DEFAULT_CONFIG, DT);
    // By now the fish has glided to a stop instead of swimming on forever.
    for (let i = 0; i < 30; i++) room = tickRoom(room, DEFAULT_CONFIG, DT);
    expect(room.match?.fish.velocity.x).toBe(0);
  });

  it("keeps applying input while the seat keeps talking", () => {
    let room = playingRoom();
    const ticks = Math.ceil(IDLE_AFTER_SECONDS / DT) * 2;
    for (let i = 1; i <= ticks; i++) {
      room = receiveInput(room, "fish", i, SWIM_RIGHT);
      room = tickRoom(room, DEFAULT_CONFIG, DT);
    }
    expect(room.match?.fish.velocity.x).toBeGreaterThan(0);
  });
});

describe("requestRematch", () => {
  it("starts a fresh match once the current one has ended", () => {
    const room = playingRoom();
    if (!room.match) throw new Error("setup");
    const ended: Room = {
      ...room,
      match: { ...room.match, phase: "ended", outcome: { winner: "fish", reason: "timeout" } },
    };
    const rematch = requestRematch(ended, DEFAULT_CONFIG);
    expect(rematch.match?.phase).toBe("countdown");
    expect(rematch.match?.outcome).toBeNull();
  });

  it("does nothing while a match is still being played", () => {
    const room = playingRoom();
    expect(requestRematch(room, DEFAULT_CONFIG)).toBe(room);
  });
});

describe("snapshotFor", () => {
  it("is null without a match or for an empty seat", () => {
    const waiting = joinRoom(createRoom(), DEFAULT_CONFIG).room;
    expect(snapshotFor(waiting, "fish")).toBeNull();
    expect(snapshotFor(waiting, "fisherman")).toBeNull();
  });
});
