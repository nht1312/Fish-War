"use client";

import { useHudStore } from "../state/hudStore";
import { Meter } from "./Meter";

/** Below this fraction the bar warns that the fish is close to exhausted. */
const LOW_RATIO = 0.25;

/** The fish's stamina. Display only. */
export function StaminaBar() {
  const staminaRatio = useHudStore((s) => s.staminaRatio);

  return (
    <div style={{ position: "fixed", top: 16, left: 16 }}>
      <Meter
        label="Fish stamina"
        ratio={staminaRatio}
        color={staminaRatio <= LOW_RATIO ? "#e63946" : "#2a9d8f"}
      />
    </div>
  );
}
