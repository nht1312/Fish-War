"use client";

import { useHudStore } from "../state/hudStore";
import { Meter } from "./Meter";

/** Below this fraction the bar warns that the fisherman is close to a knockout. */
const LOW_RATIO = 0.25;

/** The fisherman's balance against water gun hits. Display only. */
export function BalanceBar() {
  const balanceRatio = useHudStore((s) => s.balanceRatio);

  return (
    <div style={{ position: "fixed", top: 16, right: 16 }}>
      <Meter
        label="Fisherman balance"
        ratio={balanceRatio}
        color={balanceRatio <= LOW_RATIO ? "#e63946" : "#e9c46a"}
      />
    </div>
  );
}
