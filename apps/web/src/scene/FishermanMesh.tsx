import { isInvulnerable } from "@fishwar/game-core";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh, MeshStandardMaterial } from "three";

import type { SimRunner } from "../sim/simRunner";
import { FISHERMAN_STYLE } from "./sceneConfig";

/** Sim position is the fisherman's feet; the capsule is centred above them. */
const FEET_TO_CENTER = FISHERMAN_STYLE.radius + FISHERMAN_STYLE.bodyHeight / 2;

/**
 * Placeholder fisherman: an upright capsule, placed from sim state. It changes
 * colour while a dodge makes him invulnerable to shots.
 */
export function FishermanMesh({ runner }: { runner: SimRunner }) {
  const ref = useRef<Mesh>(null);
  const material = useRef<MeshStandardMaterial>(null);

  useFrame(() => {
    const fisherman = runner.getState().fisherman;
    const { position, yaw } = fisherman;
    ref.current?.position.set(position.x, position.y + FEET_TO_CENTER, position.z);
    ref.current?.rotation.set(0, yaw, 0);
    material.current?.color.set(
      isInvulnerable(fisherman) ? FISHERMAN_STYLE.dodgeColor : FISHERMAN_STYLE.color,
    );
  });

  return (
    <mesh ref={ref}>
      <capsuleGeometry args={[FISHERMAN_STYLE.radius, FISHERMAN_STYLE.bodyHeight]} />
      <meshStandardMaterial ref={material} color={FISHERMAN_STYLE.color} />
    </mesh>
  );
}
