import { FISH } from "./sceneConfig";

/** Placeholder fish: a capsule lying along the Z axis. */
export function FishMesh() {
  return (
    <mesh position={FISH.position} rotation-x={Math.PI / 2}>
      <capsuleGeometry args={[FISH.bodyRadius, FISH.bodyLength]} />
      <meshStandardMaterial color={FISH.color} />
    </mesh>
  );
}
