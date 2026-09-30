/**
 * Static scene layout for the basic 3D scene (Task 1).
 *
 * World convention: Y is up and the water surface is y = 0. The pond is centred
 * on the origin; the dock sits along the pond's +Z edge, facing the camera.
 * Gameplay-relevant dimensions move into game-core config once the simulation
 * owns positions (Task 2).
 */

export const POND = {
  width: 40,
  length: 30,
  depth: 6,
  waterColor: "#2f7fb8",
  waterOpacity: 0.7,
  floorColor: "#1c3b4a",
} as const;

export const DOCK = {
  width: 12,
  length: 4,
  height: 1,
  color: "#8a5a33",
} as const;

/** The dock's centre, flush with the pond's +Z edge. */
export const DOCK_POSITION: readonly [number, number, number] = [
  0,
  DOCK.height / 2,
  POND.length / 2 + DOCK.length / 2,
];

export const FISH = {
  bodyRadius: 0.4,
  bodyLength: 1.2,
  color: "#ff8c42",
  position: [0, -0.4, 0] as const,
} as const;

export const FISHERMAN = {
  radius: 0.4,
  bodyHeight: 1.0,
  color: "#3a6b35",
  position: [0, DOCK.height + 0.9, POND.length / 2 + DOCK.length / 2] as const,
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
