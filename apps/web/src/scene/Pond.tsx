import { POND } from "./sceneConfig";

const FLAT = -Math.PI / 2;

/** Water surface at y = 0 plus a pond floor at -depth. */
export function Pond() {
  return (
    <group>
      <mesh rotation-x={FLAT} position-y={-POND.depth}>
        <planeGeometry args={[POND.width, POND.length]} />
        <meshStandardMaterial color={POND.floorColor} />
      </mesh>
      <mesh rotation-x={FLAT}>
        <planeGeometry args={[POND.width, POND.length]} />
        <meshStandardMaterial color={POND.waterColor} transparent opacity={POND.waterOpacity} />
      </mesh>
    </group>
  );
}
