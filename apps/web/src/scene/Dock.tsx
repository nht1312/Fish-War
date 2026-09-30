import type { DockConfig } from "@fishwar/game-core";

import { DOCK_STYLE } from "./sceneConfig";

/** The strip of land the fisherman stands on. */
export function Dock({ dock }: { dock: DockConfig }) {
  return (
    <mesh position={[dock.center.x, dock.height / 2, dock.center.z]}>
      <boxGeometry args={[dock.width, dock.height, dock.length]} />
      <meshStandardMaterial color={DOCK_STYLE.color} />
    </mesh>
  );
}
