"use client";

import { useHudStore } from "../state/hudStore";

const BAR_WIDTH_PX = 240;
const BAR_HEIGHT_PX = 14;
/** Above this fraction of breaking strength the bar turns red. */
const DANGER_RATIO = 0.8;

/** Line tension gauge, shown while a fish is hooked. Display only. */
export function TensionBar() {
  const lineHooked = useHudStore((s) => s.lineHooked);
  const tensionRatio = useHudStore((s) => s.tensionRatio);
  if (!lineHooked) return null;

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
      }}
    >
      <div style={{ fontSize: 12, marginBottom: 4 }}>Line tension</div>
      <div
        role="meter"
        aria-label="Line tension"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(tensionRatio * 100)}
        style={{
          width: BAR_WIDTH_PX,
          height: BAR_HEIGHT_PX,
          background: "rgba(0, 0, 0, 0.5)",
          border: "1px solid #fff",
        }}
      >
        <div
          style={{
            width: `${tensionRatio * 100}%`,
            height: "100%",
            background: tensionRatio >= DANGER_RATIO ? "#e63946" : "#f4a261",
          }}
        />
      </div>
    </div>
  );
}
