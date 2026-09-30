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
} as const;

export const FISHERMAN_STYLE = {
  radius: 0.4,
  bodyHeight: 1.0,
  color: "#3a6b35",
  /** Shown while a dodge makes him invulnerable. */
  dodgeColor: "#b8f2b0",
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
