import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

import type { SimRunner } from "../sim/simRunner";
import { SHOT_STYLE } from "./sceneConfig";

const POOL = Array.from({ length: SHOT_STYLE.maxVisible }, (_, i) => i);

/** Water gun shots in flight, drawn from a fixed pool of spheres. */
export function Projectiles({ runner }: { runner: SimRunner }) {
  const pool = useRef<Group>(null);

  useFrame(() => {
    const shots = runner.getState().projectiles;
    pool.current?.children.forEach((mesh, i) => {
      const shot = shots[i];
      mesh.visible = shot !== undefined;
      if (shot) mesh.position.set(shot.position.x, shot.position.y, shot.position.z);
    });
  });

  return (
    <group ref={pool}>
      {POOL.map((i) => (
        <mesh key={i} visible={false}>
          <sphereGeometry args={[SHOT_STYLE.radius]} />
          <meshStandardMaterial color={SHOT_STYLE.color} />
        </mesh>
      ))}
    </group>
  );
}
