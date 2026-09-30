import { describe, expect, it } from "vitest";

import { integrateKinematic, type Bounds2D, type KinematicParams, type PlanarBody } from "./kinematics";

const DT = 1 / 30;
const PARAMS: KinematicParams = { maxSpeed: 5, acceleration: 50, deceleration: 25 };
const BOUNDS: Bounds2D = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
const REST: PlanarBody = { position: { x: 0, z: 0 }, velocity: { x: 0, z: 0 }, yaw: 1 };

function run(body: PlanarBody, move: { x: number; z: number }, ticks: number): PlanarBody {
  let b = body;
  for (let i = 0; i < ticks; i++) b = integrateKinematic(b, move, PARAMS, BOUNDS, DT);
  return b;
}

const speed = (b: PlanarBody) => Math.hypot(b.velocity.x, b.velocity.z);

describe("integrateKinematic", () => {
  it("changes velocity by at most acceleration * dt per tick", () => {
    const next = integrateKinematic(REST, { x: 0, z: 1 }, PARAMS, BOUNDS, DT);
    expect(next.velocity.z).toBeCloseTo(PARAMS.acceleration * DT);
  });

  it("caps speed at maxSpeed, including diagonals", () => {
    expect(speed(run(REST, { x: 1, z: 1 }, 10))).toBeCloseTo(PARAMS.maxSpeed);
  });

  it("scales speed with analog input", () => {
    expect(speed(run(REST, { x: 0.4, z: 0 }, 10))).toBeCloseTo(PARAMS.maxSpeed * 0.4);
  });

  it("decelerates to exactly zero without input", () => {
    const moving = run(REST, { x: 1, z: 0 }, 10);
    expect(speed(run(moving, { x: 0, z: 0 }, 30))).toBe(0);
  });

  it("clamps to the bounds and zeroes velocity into the wall only", () => {
    const b = run(REST, { x: 1, z: 0.2 }, 100);
    expect(b.position.x).toBe(BOUNDS.maxX);
    expect(b.velocity.x).toBe(0);
    // Still sliding along the wall.
    expect(b.velocity.z).toBeGreaterThan(0);
    expect(b.position.z).toBeLessThan(BOUNDS.maxZ);
  });

  it("faces its velocity, and keeps its yaw at rest", () => {
    expect(run(REST, { x: 0, z: -1 }, 5).yaw).toBeCloseTo(Math.PI);
    expect(integrateKinematic(REST, { x: 0, z: 0 }, PARAMS, BOUNDS, DT).yaw).toBe(REST.yaw);
  });
});
