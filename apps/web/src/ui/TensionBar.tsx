"use client";

import { useHudStore } from "../state/hudStore";
import { Meter } from "./Meter";

/** Above this fraction of breaking strength the bar turns red. */
const DANGER_RATIO = 0.8;

/**
 * Line tension gauge with a marker at the drag setting: tension that reaches
 * the marker makes the reel let line out. Display only.
 */
export function TensionBar() {
  const lineHooked = useHudStore((s) => s.lineHooked);
  const tensionRatio = useHudStore((s) => s.tensionRatio);
  const dragRatio = useHudStore((s) => s.dragRatio);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        opacity: lineHooked ? 1 : 0.6,
      }}
    >
      <Meter
        label={`Line tension · Drag ${Math.round(dragRatio * 100)}%`}
        ratio={tensionRatio}
        color={tensionRatio >= DANGER_RATIO ? "#e63946" : "#f4a261"}
        markerRatio={dragRatio}
      />
    </div>
  );
}
