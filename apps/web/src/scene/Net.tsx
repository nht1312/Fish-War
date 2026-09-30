import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

import type { SimRunner } from "../sim/simRunner";
import { NET_STYLE } from "./sceneConfig";

const FLAT = -Math.PI / 2;
const RING_SEGMENTS = 48;
const TUBE_SEGMENTS = 6;

/** While the net swings, a ring on the water shows its reach around the fisherman. */
export function Net({ runner }: { runner: SimRunner }) {
  const ref = useRef<Mesh>(null);

  useFrame(() => {
    const { position, netSwingTime } = runner.getState().fisherman;
    if (!ref.current) return;
    ref.current.visible = netSwingTime > 0;
    ref.current.position.set(position.x, NET_STYLE.heightAboveWater, position.z);
  });

  return (
    <mesh ref={ref} rotation-x={FLAT} visible={false}>
      <torusGeometry args={[runner.config.net.range, NET_STYLE.tube, TUBE_SEGMENTS, RING_SEGMENTS]} />
      <meshBasicMaterial color={NET_STYLE.color} />
    </mesh>
  );
}
