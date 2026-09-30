import { describe, expect, it } from "vitest";

import { CONTROLS_HELP } from "./bindings";
import { readMatchInputs, type Keyboard } from "./keyboard";

function holding(...codes: string[]): Keyboard {
  const down = new Set(codes);
  return { isDown: (code) => down.has(code), dispose: () => undefined };
}

describe("readMatchInputs", () => {
  it("is idle with no keys held", () => {
    expect(readMatchInputs(holding())).toEqual({
      fish: { move: { x: 0, z: 0 }, dive: false, sprint: false, dash: false, shoot: false },
      fisherman: { move: { x: 0, z: 0 }, cast: false, dragChange: 0, dodge: false, net: false },
    });
  });

  it("maps the Fish keys", () => {
    const { fish } = readMatchInputs(holding("KeyW", "KeyD", "KeyC", "ShiftLeft", "Space", "KeyF"));
    expect(fish).toEqual({ move: { x: 1, z: -1 }, dive: true, sprint: true, dash: true, shoot: true });
  });

  it("maps the Fisherman keys", () => {
    const { fisherman } = readMatchInputs(
      holding("ArrowUp", "ArrowLeft", "Enter", "BracketRight", "Period", "Slash"),
    );
    expect(fisherman).toEqual({ move: { x: -1, z: -1 }, cast: true, dragChange: 1, dodge: true, net: true });
  });

  it("cancels opposing keys", () => {
    const { fish, fisherman } = readMatchInputs(holding("KeyA", "KeyD", "BracketLeft", "BracketRight"));
    expect(fish.move.x).toBe(0);
    expect(fisherman.dragChange).toBe(0);
  });
});

describe("CONTROLS_HELP", () => {
  it("documents both roles and the app keys", () => {
    expect(CONTROLS_HELP.map((group) => group.title)).toEqual(["Fish", "Fisherman", "Anyone"]);
    for (const group of CONTROLS_HELP) expect(group.rows.length).toBeGreaterThan(0);
  });
});
