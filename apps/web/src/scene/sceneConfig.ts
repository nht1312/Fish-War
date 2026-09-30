/**
 * Visual-only scene settings: colours, mesh sizes, camera and lights.
 * Gameplay dimensions (pond, dock, spawns) come from game-core's MatchConfig.
 */

export const POND_STYLE = {
  waterColor: "#2f7fb8",
  // See-through enough to follow the fish when it dives.
  waterOpacity: 0.55,
  floorColor: "#1c3b4a",
} as const;

export const DOCK_STYLE = {
  color: "#8a5a33",
} as const;

export const FISH_STYLE = {
  bodyRadius: 0.4,
  bodyLength: 1.2,
  color: "#ff8c42",
  finColor: "#e76f2d",
  tailLength: 0.6,
  tailRadius: 0.35,
  /** The tail and fin are flattened sideways to this fraction of their width. */
  finThickness: 0.25,
  finHeight: 0.35,
  finLength: 0.6,
  eyeRadius: 0.08,
  eyeColor: "#111111",
  /** Eyes: sideways offset, height and distance forward from the body centre (m). */
  eyeOffset: { x: 0.24, y: 0.15, z: 0.8 },
  /** Tail wag: swing (radians), and frequency at rest plus extra per m/s of speed (Hz). */
  wagAngle: 0.45,
  wagRestHz: 1.5,
  wagHzPerSpeed: 0.5,
} as const;

export const FISHERMAN_STYLE = {
  /** Torso (jacket) colour, and while a dodge makes him invulnerable. */
  color: "#3a6b35",
  dodgeColor: "#b8f2b0",
  legColor: "#2b3a67",
  skinColor: "#f1c27d",
  hatColor: "#c9a15b",
  legHeight: 0.8,
  legRadius: 0.1,
  /** Sideways distance of each leg from the centre (m). */
  legSpacing: 0.15,
  torsoRadius: 0.3,
  torsoLength: 0.5,
  headRadius: 0.22,
  hatBrimRadius: 0.36,
  hatBrimHeight: 0.04,
  hatCrownRadius: 0.2,
  hatCrownHeight: 0.25,
} as const;

export const CAMERA = {
  position: [0, 16, 34] as const,
  fov: 50,
} as const;

export const LIGHTING = {
  ambientIntensity: 0.5,
  sunIntensity: 1.2,
  sunPosition: [10, 20, 10] as const,
  skyColor: "#bfe3ff",
} as const;

export const ROD_STYLE = {
  /** Where the fisherman holds the rod, above his feet (m). */
  handHeight: 1.2,
  baseRadius: 0.04,
  tipRadius: 0.015,
  color: "#5b3a1e",
} as const;

export const LINE_STYLE = {
  color: "#f5f5f5",
  bobberRadius: 0.15,
  bobberColor: "#e63946",
  /** Straight segments the hanging curve is drawn with. */
  segments: 16,
  /** A slack line hangs this much per metre of span, up to maxSag (m). */
  sagPerMeter: 0.08,
  maxSag: 1.2,
} as const;

export const SHOT_STYLE = {
  radius: 0.2,
  color: "#8ecae6",
  /** Most shots drawn at once; the gun's cooldown keeps far fewer in the air. */
  maxVisible: 8,
} as const;

export const ESCAPE_ZONE_STYLE = {
  color: "#80ed99",
  opacity: 0.45,
  /** Just above the water so the zone is not hidden by it (m). */
  heightAboveWater: 0.02,
} as const;

export const NET_STYLE = {
  color: "#ffffff",
  /** Thickness of the reach ring drawn on the water (m). */
  tube: 0.06,
  /** Just above the water so the ring is not hidden by it (m). */
  heightAboveWater: 0.05,
} as const;
