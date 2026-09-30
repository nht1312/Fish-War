import { isInvulnerable } from "@fishwar/game-core";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, MeshStandardMaterial } from "three";

import type { SimRunner } from "../sim/simRunner";
import { FISHERMAN_STYLE as S } from "./sceneConfig";

// Heights above the feet (the sim position), bottom to top.
const TORSO_CENTER = S.legHeight + S.torsoRadius + S.torsoLength / 2;
const HEAD_CENTER = S.legHeight + S.torsoLength + S.torsoRadius * 2 + S.headRadius * 0.8;
const BRIM_Y = HEAD_CENTER + S.headRadius * 0.7;
const CROWN_Y = BRIM_Y + S.hatCrownHeight / 2;

/**
 * The fisherman: legs, torso, head and hat, placed at his feet from sim state
 * and turned to his heading. The jacket changes colour while a dodge makes him
 * invulnerable to shots.
 */
export function FishermanMesh({ runner }: { runner: SimRunner }) {
  const ref = useRef<Group>(null);
  const jacket = useRef<MeshStandardMaterial>(null);

  useFrame(() => {
    const fisherman = runner.getState().fisherman;
    const { position, yaw } = fisherman;
    ref.current?.position.set(position.x, position.y, position.z);
    ref.current?.rotation.set(0, yaw, 0);
    jacket.current?.color.set(isInvulnerable(fisherman) ? S.dodgeColor : S.color);
  });

  return (
    <group ref={ref}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * S.legSpacing, S.legHeight / 2, 0]}>
          <cylinderGeometry args={[S.legRadius, S.legRadius, S.legHeight]} />
          <meshStandardMaterial color={S.legColor} />
        </mesh>
      ))}
      <mesh position-y={TORSO_CENTER}>
        <capsuleGeometry args={[S.torsoRadius, S.torsoLength]} />
        <meshStandardMaterial ref={jacket} color={S.color} />
      </mesh>
      <mesh position-y={HEAD_CENTER}>
        <sphereGeometry args={[S.headRadius]} />
        <meshStandardMaterial color={S.skinColor} />
      </mesh>
      <mesh position-y={BRIM_Y}>
        <cylinderGeometry args={[S.hatBrimRadius, S.hatBrimRadius, S.hatBrimHeight]} />
        <meshStandardMaterial color={S.hatColor} />
      </mesh>
      <mesh position-y={CROWN_Y}>
        <cylinderGeometry args={[S.hatCrownRadius, S.hatCrownRadius, S.hatCrownHeight]} />
        <meshStandardMaterial color={S.hatColor} />
      </mesh>
    </group>
  );
}
