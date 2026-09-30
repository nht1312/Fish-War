import { DOCK, DOCK_POSITION } from "./sceneConfig";

/** The strip of land the fisherman stands on. */
export function Dock() {
  return (
    <mesh position={DOCK_POSITION}>
      <boxGeometry args={[DOCK.width, DOCK.height, DOCK.length]} />
      <meshStandardMaterial color={DOCK.color} />
    </mesh>
  );
}
