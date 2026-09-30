import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

import type { SimRunner } from "../sim/simRunner";
import { FISH_STYLE as S } from "./sceneConfig";

const HALF_BODY = S.bodyLength / 2 + S.bodyRadius;
const TWO_PI = Math.PI * 2;

/**
 * The fish, placed and turned from sim state. The outer group carries position
 * and heading; the fish is modelled along the group's +Z axis (head forward).
 * The tail wags faster the faster the fish swims (visual only).
 */
export function FishMesh({ runner }: { runner: SimRunner }) {
  const ref = useRef<Group>(null);
  const tail = useRef<Group>(null);
  const wagPhase = useRef(0);

  useFrame((_, delta) => {
    const { position, yaw, velocity } = runner.getState().fish;
    ref.current?.position.set(position.x, position.y, position.z);
    ref.current?.rotation.set(0, yaw, 0);

    const wagHz = S.wagRestHz + Math.hypot(velocity.x, velocity.z) * S.wagHzPerSpeed;
    wagPhase.current = (wagPhase.current + TWO_PI * wagHz * delta) % TWO_PI;
    tail.current?.rotation.set(0, Math.sin(wagPhase.current) * S.wagAngle, 0);
  });

  return (
    <group ref={ref}>
      <mesh rotation-x={Math.PI / 2}>
        <capsuleGeometry args={[S.bodyRadius, S.bodyLength]} />
        <meshStandardMaterial color={S.color} />
      </mesh>

      <group ref={tail} position-z={-HALF_BODY + S.bodyRadius / 2}>
        {/* Cone apex points at the body; flattened into a vertical tail fin. */}
        <mesh position-z={-S.tailLength / 2} rotation-x={Math.PI / 2} scale-x={S.finThickness}>
          <coneGeometry args={[S.tailRadius, S.tailLength]} />
          <meshStandardMaterial color={S.finColor} />
        </mesh>
      </group>

      <mesh position-y={S.bodyRadius + S.finHeight / 2 - S.bodyRadius / 4} scale-x={S.finThickness}>
        <coneGeometry args={[S.finLength / 2, S.finHeight]} />
        <meshStandardMaterial color={S.finColor} />
      </mesh>

      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * S.eyeOffset.x, S.eyeOffset.y, S.eyeOffset.z]}>
          <sphereGeometry args={[S.eyeRadius]} />
          <meshStandardMaterial color={S.eyeColor} />
        </mesh>
      ))}
    </group>
  );
}
