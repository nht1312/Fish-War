import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

import type { SimRunner } from "../sim/simRunner";
import { FISH_STYLE } from "./sceneConfig";

/** Placeholder fish: a capsule lying along the Z axis, placed from sim state. */
export function FishMesh({ runner }: { runner: SimRunner }) {
  const ref = useRef<Mesh>(null);

  useFrame(() => {
    const { x, y, z } = runner.getState().fish.position;
    ref.current?.position.set(x, y, z);
  });

  return (
    <mesh ref={ref} rotation-x={Math.PI / 2}>
      <capsuleGeometry args={[FISH_STYLE.bodyRadius, FISH_STYLE.bodyLength]} />
      <meshStandardMaterial color={FISH_STYLE.color} />
    </mesh>
  );
}
