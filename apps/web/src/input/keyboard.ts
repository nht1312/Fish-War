import type { FishermanInput, FishInput, MatchInputs } from "@fishwar/game-types";

/** Tracks which physical keys (KeyboardEvent.code) are currently held. */
export interface Keyboard {
  isDown(code: string): boolean;
  dispose(): void;
}

export function createKeyboard(target: Window): Keyboard {
  const down = new Set<string>();
  const onKeyDown = (event: KeyboardEvent) => down.add(event.code);
  const onKeyUp = (event: KeyboardEvent) => down.delete(event.code);
  // Keys released while the window is unfocused never fire keyup.
  const onBlur = () => down.clear();

  target.addEventListener("keydown", onKeyDown);
  target.addEventListener("keyup", onKeyUp);
  target.addEventListener("blur", onBlur);

  return {
    isDown: (code) => down.has(code),
    dispose() {
      target.removeEventListener("keydown", onKeyDown);
      target.removeEventListener("keyup", onKeyUp);
      target.removeEventListener("blur", onBlur);
      down.clear();
    },
  };
}

/** -1, 0 or 1 from a pair of opposing keys. */
function axis(keyboard: Keyboard, negative: string, positive: string): number {
  return Number(keyboard.isDown(positive)) - Number(keyboard.isDown(negative));
}

/**
 * Hot-seat Fish controls: WASD swims (W = away from the dock, toward -Z),
 * hold C to dive, hold Left Shift to sprint, Space to dash.
 */
function readFishInput(keyboard: Keyboard): FishInput {
  return {
    move: { x: axis(keyboard, "KeyA", "KeyD"), z: axis(keyboard, "KeyW", "KeyS") },
    dive: keyboard.isDown("KeyC"),
    sprint: keyboard.isDown("ShiftLeft"),
    dash: keyboard.isDown("Space"),
  };
}

/**
 * Hot-seat Fisherman controls: arrow keys walk (Up = toward the pond, -Z),
 * Enter casts / retrieves (hold while hooked to reel), [ and ] loosen / tighten drag.
 */
function readFishermanInput(keyboard: Keyboard): FishermanInput {
  return {
    move: {
      x: axis(keyboard, "ArrowLeft", "ArrowRight"),
      z: axis(keyboard, "ArrowUp", "ArrowDown"),
    },
    cast: keyboard.isDown("Enter"),
    dragChange: axis(keyboard, "BracketLeft", "BracketRight"),
  };
}

export function readMatchInputs(keyboard: Keyboard): MatchInputs {
  return { fish: readFishInput(keyboard), fisherman: readFishermanInput(keyboard) };
}
