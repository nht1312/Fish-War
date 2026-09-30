import type { FishermanInput, FishInput, MatchInputs } from "@fishwar/game-types";

import { FISHERMAN_KEYS, FISH_KEYS } from "./bindings";

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

/** Fish controls (see bindings.ts). Forward is away from the dock, toward -Z. */
function readFishInput(keyboard: Keyboard): FishInput {
  const k = FISH_KEYS;
  return {
    move: { x: axis(keyboard, k.left, k.right), z: axis(keyboard, k.forward, k.back) },
    dive: keyboard.isDown(k.dive),
    sprint: keyboard.isDown(k.sprint),
    dash: keyboard.isDown(k.dash),
    shoot: keyboard.isDown(k.shoot),
  };
}

/** Fisherman controls (see bindings.ts). Forward is toward the pond, -Z. */
function readFishermanInput(keyboard: Keyboard): FishermanInput {
  const k = FISHERMAN_KEYS;
  return {
    move: { x: axis(keyboard, k.left, k.right), z: axis(keyboard, k.forward, k.back) },
    cast: keyboard.isDown(k.cast),
    dragChange: axis(keyboard, k.loosenDrag, k.tightenDrag),
    dodge: keyboard.isDown(k.dodge),
    net: keyboard.isDown(k.net),
  };
}

export function readMatchInputs(keyboard: Keyboard): MatchInputs {
  return { fish: readFishInput(keyboard), fisherman: readFishermanInput(keyboard) };
}
