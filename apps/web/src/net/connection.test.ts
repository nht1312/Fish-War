import { describe, expect, it } from "vitest";

import { INITIAL_CONNECTION, reduceConnection, reduceConnectionClosed } from "./connection";

describe("reduceConnection", () => {
  it("starts connecting with no role", () => {
    expect(INITIAL_CONNECTION).toEqual({ phase: "connecting", role: null });
  });

  it("learns its role on welcome, then waits or plays", () => {
    const welcomed = reduceConnection(INITIAL_CONNECTION, { type: "welcome", role: "fish" });
    expect(welcomed.role).toBe("fish");
    expect(reduceConnection(welcomed, { type: "waiting" }).phase).toBe("waiting");
    const snapshot = { type: "snapshot", state: {} as never, ackSeq: 0 } as const;
    expect(reduceConnection(welcomed, snapshot).phase).toBe("in-match");
  });

  it("reports a full room", () => {
    expect(reduceConnection(INITIAL_CONNECTION, { type: "room-full" }).phase).toBe("room-full");
  });

  it("keeps showing that the opponent left while waiting for a new one", () => {
    const left = reduceConnection({ phase: "in-match", role: "fish" }, { type: "opponent-left" });
    expect(left).toEqual({ phase: "opponent-left", role: "fish" });
    expect(reduceConnection(left, { type: "waiting" }).phase).toBe("opponent-left");
  });

  it("is disconnected when the socket closes, unless the room was full", () => {
    expect(reduceConnectionClosed({ phase: "in-match", role: "fish" }).phase).toBe("disconnected");
    expect(reduceConnectionClosed({ phase: "room-full", role: null }).phase).toBe("room-full");
  });
});
