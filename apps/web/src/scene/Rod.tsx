import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

import type { SimRunner } from "../sim/simRunner";
import { ROD_STYLE } from "./sceneConfig";

/**
 * The rod, from the fisherman's hand to the rod tip defined in game-core's
 * rod config. The group follows the fisherman; the rod leans along local +Z.
 */
export function Rod({ runner }: { runner: SimRunner }) {
  const ref = useRef<Group>(null);
  const { tipHeight, tipReach } = runner.config.rod;
  const rise = tipHeight - ROD_STYLE.handHeight;
  const length = Math.hypot(rise, tipReach);
  const tilt = Math.atan2(tipReach, rise);

  useFrame(() => {
    const { position, yaw } = runner.getState().fisherman;
    ref.current?.position.set(position.x, position.y, position.z);
    ref.current?.rotation.set(0, yaw, 0);
  });

  return (
    <group ref={ref}>
      <mesh position={[0, ROD_STYLE.handHeight + rise / 2, tipReach / 2]} rotation-x={tilt}>
        <cylinderGeometry args={[ROD_STYLE.tipRadius, ROD_STYLE.baseRadius, length]} />
        <meshStandardMaterial color={ROD_STYLE.color} />
      </mesh>
    </group>
  );
}
