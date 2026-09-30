/**
 * Every key the game listens to (KeyboardEvent.code, so layout-independent),
 * plus the help text the start menu shows for them. One source of truth.
 */

export const FISH_KEYS = {
  forward: "KeyW",
  back: "KeyS",
  left: "KeyA",
  right: "KeyD",
  dive: "KeyC",
  sprint: "ShiftLeft",
  dash: "Space",
  shoot: "KeyF",
} as const;

export const FISHERMAN_KEYS = {
  forward: "ArrowUp",
  back: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  cast: "Enter",
  loosenDrag: "BracketLeft",
  tightenDrag: "BracketRight",
  dodge: "Period",
  net: "Slash",
} as const;

/** App controls, not gameplay input. */
export const APP_KEYS = {
  restart: "KeyR",
  menu: "Escape",
  mute: "KeyM",
} as const;

export interface ControlsGroup {
  readonly title: string;
  readonly rows: ReadonlyArray<{ readonly keys: string; readonly action: string }>;
}

export const CONTROLS_HELP: readonly ControlsGroup[] = [
  {
    title: "Fish",
    rows: [
      { keys: "W A S D", action: "Swim (W = away from the dock)" },
      { keys: "Left Shift", action: "Sprint (hold, drains stamina)" },
      { keys: "Space", action: "Dash" },
      { keys: "C", action: "Dive (hold)" },
      { keys: "F", action: "Water gun (at the surface)" },
    ],
  },
  {
    title: "Fisherman",
    rows: [
      { keys: "Arrow keys", action: "Walk the dock" },
      { keys: "Enter", action: "Cast / retrieve; hold to reel" },
      { keys: "[  ]", action: "Loosen / tighten drag" },
      { keys: ".", action: "Dodge" },
      { keys: "/", action: "Swing the net" },
    ],
  },
  {
    title: "Anyone",
    rows: [
      { keys: "R", action: "Play again after a match" },
      { keys: "Esc", action: "Back to the menu" },
      { keys: "M", action: "Mute / unmute sound" },
    ],
  },
];
