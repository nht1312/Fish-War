"use client";

import { useHudStore } from "../state/hudStore";

const BAR_WIDTH_PX = 240;
const BAR_HEIGHT_PX = 14;
const MARKER_WIDTH_PX = 2;
/** Above this fraction of breaking strength the bar turns red. */
const DANGER_RATIO = 0.8;

const toPercent = (ratio: number) => `${Math.round(ratio * 100)}%`;

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
        fontFamily: "system-ui, sans-serif",
        color: "#fff",
        textShadow: "0 1px 2px #000",
        textAlign: "center",
        opacity: lineHooked ? 1 : 0.6,
      }}
    >
      <div style={{ fontSize: 12, marginBottom: 4 }}>
        Line tension · Drag {toPercent(dragRatio)}
      </div>
      <div
        role="meter"
        aria-label="Line tension"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(tensionRatio * 100)}
        style={{
          position: "relative",
          width: BAR_WIDTH_PX,
          height: BAR_HEIGHT_PX,
          background: "rgba(0, 0, 0, 0.5)",
          border: "1px solid #fff",
        }}
      >
        <div
          style={{
            width: toPercent(tensionRatio),
            height: "100%",
            background: tensionRatio >= DANGER_RATIO ? "#e63946" : "#f4a261",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: toPercent(dragRatio),
            width: MARKER_WIDTH_PX,
            height: "100%",
            background: "#fff",
          }}
        />
      </div>
    </div>
  );
}
