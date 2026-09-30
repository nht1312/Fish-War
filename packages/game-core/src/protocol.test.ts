import type {
  ClientMessage,
  FishermanInput,
  FishInput,
  ServerMessage,
} from "@fishwar/game-types";
import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "./config";
import { createMatch } from "./match";
import { parseClientMessage, parseServerMessage } from "./protocol";

const FISH_INPUT: FishInput = {
  move: { x: 0.5, z: -0.5 },
  dive: true,
  sprint: false,
  dash: false,
  shoot: true,
};

const FISHERMAN_INPUT: FishermanInput = {
  move: { x: -1, z: 0 },
  cast: true,
  dragChange: -1,
  dodge: false,
  net: true,
};

const wire = (message: unknown) => JSON.stringify(message);

describe("parseClientMessage", () => {
  it("round-trips a fish input message", () => {
    const message: ClientMessage = { type: "input", seq: 7, input: FISH_INPUT };
    expect(parseClientMessage(wire(message), "fish")).toEqual(message);
  });

  it("round-trips a fisherman input message", () => {
    const message: ClientMessage = { type: "input", seq: 0, input: FISHERMAN_INPUT };
    expect(parseClientMessage(wire(message), "fisherman")).toEqual(message);
  });

  it("round-trips a rematch request", () => {
    expect(parseClientMessage(wire({ type: "rematch" }), "fish")).toEqual({ type: "rematch" });
  });

  it("rejects anything that is not a well-formed message", () => {
    const bad = [
      "not json",
      "42",
      "null",
      wire([]),
      wire({ type: "teleport" }),
      wire({ type: "input", input: FISH_INPUT }),
      wire({ type: "input", seq: -1, input: FISH_INPUT }),
      wire({ type: "input", seq: 1.5, input: FISH_INPUT }),
      wire({ type: "input", seq: 1, input: { ...FISH_INPUT, dive: "yes" } }),
      wire({ type: "input", seq: 1, input: { ...FISH_INPUT, move: { x: 1 } } }),
      wire({ type: "input", seq: 1 }),
    ];
    for (const raw of bad) expect(parseClientMessage(raw, "fish"), raw).toBeNull();
  });

  it("rejects non-finite numbers", () => {
    // JSON.parse turns 1e999 into Infinity.
    const raw = `{"type":"input","seq":1,"input":{"move":{"x":1e999,"z":0},"dive":false,"sprint":false,"dash":false,"shoot":false}}`;
    expect(parseClientMessage(raw, "fish")).toBeNull();
  });

  it("rejects the other role's input shape", () => {
    const fishermanOnFishSeat = wire({ type: "input", seq: 1, input: FISHERMAN_INPUT });
    expect(parseClientMessage(fishermanOnFishSeat, "fish")).toBeNull();
    const fishOnFishermanSeat = wire({ type: "input", seq: 1, input: FISH_INPUT });
    expect(parseClientMessage(fishOnFishermanSeat, "fisherman")).toBeNull();
  });

  it("clamps an oversized move vector to length 1", () => {
    const raw = wire({ type: "input", seq: 1, input: { ...FISH_INPUT, move: { x: 30, z: 40 } } });
    const parsed = parseClientMessage(raw, "fish");
    if (parsed?.type !== "input") throw new Error("expected input");
    expect(parsed.input.move.x).toBeCloseTo(0.6);
    expect(parsed.input.move.z).toBeCloseTo(0.8);
  });

  it("clamps dragChange to [-1, 1]", () => {
    const raw = wire({ type: "input", seq: 1, input: { ...FISHERMAN_INPUT, dragChange: 5 } });
    const parsed = parseClientMessage(raw, "fisherman");
    if (parsed?.type !== "input" || !("dragChange" in parsed.input)) throw new Error("expected input");
    expect(parsed.input.dragChange).toBe(1);
  });

  it("drops fields it does not know about", () => {
    const raw = wire({
      type: "input",
      seq: 1,
      stamina: 9999,
      input: { ...FISH_INPUT, teleportTo: { x: 0, y: 0, z: 0 } },
    });
    expect(parseClientMessage(raw, "fish")).toEqual({ type: "input", seq: 1, input: FISH_INPUT });
  });
});

describe("parseServerMessage", () => {
  it("round-trips every server message", () => {
    const messages: ServerMessage[] = [
      { type: "welcome", role: "fisherman" },
      { type: "waiting" },
      { type: "room-full" },
      { type: "opponent-left" },
      { type: "snapshot", state: createMatch(DEFAULT_CONFIG), ackSeq: 12 },
    ];
    for (const message of messages) expect(parseServerMessage(wire(message))).toEqual(message);
  });

  it("rejects malformed server messages", () => {
    const bad = [
      "{",
      wire({ type: "welcome", role: "shark" }),
      wire({ type: "snapshot", state: "nope", ackSeq: 1 }),
      wire({ type: "snapshot", state: createMatch(DEFAULT_CONFIG) }),
      wire({ type: "snapshot", state: { tick: 1 }, ackSeq: 1 }),
      wire({ type: "mystery" }),
    ];
    for (const raw of bad) expect(parseServerMessage(raw), raw).toBeNull();
  });
});
