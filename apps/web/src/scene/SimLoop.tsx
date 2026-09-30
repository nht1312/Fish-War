import { useFrame } from "@react-three/fiber";

import type { SimRunner } from "../sim/simRunner";

/** Drives the simulation from the render loop. Renders nothing. */
export function SimLoop({ runner }: { runner: SimRunner }) {
  useFrame((_, delta) => runner.advance(delta));
  return null;
}
