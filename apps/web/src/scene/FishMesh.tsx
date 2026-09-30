import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

import type { SimRunner } from "../sim/simRunner";
import { FISH_STYLE } from "./sceneConfig";

/**
 * Placeholder fish, placed and turned from sim state. The outer group carries
 * position and heading; the inner capsule is laid along the group's +Z axis.
 */
export function FishMesh({ runner }: { runner: SimRunner }) {
  const ref = useRef<Group>(null);

  useFrame(() => {
    const { position, yaw } = runner.getState().fish;
    ref.current?.position.set(position.x, position.y, position.z);
    ref.current?.rotation.set(0, yaw, 0);
  });

  return (
    <group ref={ref}>
      <mesh rotation-x={Math.PI / 2}>
        <capsuleGeometry args={[FISH_STYLE.bodyRadius, FISH_STYLE.bodyLength]} />
        <meshStandardMaterial color={FISH_STYLE.color} />
      </mesh>
    </group>
  );
}
