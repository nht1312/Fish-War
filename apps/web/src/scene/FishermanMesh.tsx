import { FISHERMAN } from "./sceneConfig";

/** Placeholder fisherman: an upright capsule on the dock. */
export function FishermanMesh() {
  return (
    <mesh position={FISHERMAN.position}>
      <capsuleGeometry args={[FISHERMAN.radius, FISHERMAN.bodyHeight]} />
      <meshStandardMaterial color={FISHERMAN.color} />
    </mesh>
  );
}
