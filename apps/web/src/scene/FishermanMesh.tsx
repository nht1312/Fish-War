import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

import type { SimRunner } from "../sim/simRunner";
import { FISHERMAN_STYLE } from "./sceneConfig";

/** Sim position is the fisherman's feet; the capsule is centred above them. */
const FEET_TO_CENTER = FISHERMAN_STYLE.radius + FISHERMAN_STYLE.bodyHeight / 2;

/** Placeholder fisherman: an upright capsule, placed from sim state. */
export function FishermanMesh({ runner }: { runner: SimRunner }) {
  const ref = useRef<Mesh>(null);

  useFrame(() => {
    const { position, yaw } = runner.getState().fisherman;
    ref.current?.position.set(position.x, position.y + FEET_TO_CENTER, position.z);
    ref.current?.rotation.set(0, yaw, 0);
  });

  return (
    <mesh ref={ref}>
      <capsuleGeometry args={[FISHERMAN_STYLE.radius, FISHERMAN_STYLE.bodyHeight]} />
      <meshStandardMaterial color={FISHERMAN_STYLE.color} />
    </mesh>
  );
}
