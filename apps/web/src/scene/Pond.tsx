import type { PondConfig } from "@fishwar/game-core";

import { POND_STYLE } from "./sceneConfig";

const FLAT = -Math.PI / 2;

/** Water surface at y = 0 plus a pond floor at -depth. */
export function Pond({ pond }: { pond: PondConfig }) {
  return (
    <group>
      <mesh rotation-x={FLAT} position-y={-pond.depth}>
        <planeGeometry args={[pond.width, pond.length]} />
        <meshStandardMaterial color={POND_STYLE.floorColor} />
      </mesh>
      <mesh rotation-x={FLAT}>
        <planeGeometry args={[pond.width, pond.length]} />
        <meshStandardMaterial
          color={POND_STYLE.waterColor}
          transparent
          opacity={POND_STYLE.waterOpacity}
        />
      </mesh>
    </group>
  );
}
