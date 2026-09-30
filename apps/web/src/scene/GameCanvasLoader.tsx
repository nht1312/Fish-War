"use client";

import dynamic from "next/dynamic";

import { BalanceBar } from "../ui/BalanceBar";
import { MatchTimer } from "../ui/MatchTimer";
import { ResultOverlay } from "../ui/ResultOverlay";
import { StaminaBar } from "../ui/StaminaBar";
import { TensionBar } from "../ui/TensionBar";

// WebGL needs the browser, so the canvas is never server-rendered.
const GameCanvas = dynamic(() => import("./GameCanvas"), { ssr: false });

export function GameCanvasLoader() {
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <GameCanvas />
      <TensionBar />
      <StaminaBar />
      <BalanceBar />
      <MatchTimer />
      <ResultOverlay />
    </div>
  );
}
