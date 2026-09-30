import type { EscapeZoneConfig } from "@fishwar/game-core";

import { ESCAPE_ZONE_STYLE } from "./sceneConfig";

const FLAT = -Math.PI / 2;

/** The strip at the far edge of the pond where a free fish escapes. */
export function EscapeZone({ zone }: { zone: EscapeZoneConfig }) {
  return (
    <mesh
      rotation-x={FLAT}
      position={[zone.center.x, ESCAPE_ZONE_STYLE.heightAboveWater, zone.center.z]}
    >
      <planeGeometry args={[zone.halfWidth * 2, zone.halfLength * 2]} />
      <meshBasicMaterial
        color={ESCAPE_ZONE_STYLE.color}
        transparent
        opacity={ESCAPE_ZONE_STYLE.opacity}
      />
    </mesh>
  );
}
