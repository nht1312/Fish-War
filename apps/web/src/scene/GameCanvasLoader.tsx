"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { APP_KEYS } from "../input/bindings";
import type { GameMode } from "../sim/createSession";
import { HUD_DEFAULTS, useHudStore } from "../state/hudStore";
import { BalanceBar } from "../ui/BalanceBar";
import { ConnectionStatus } from "../ui/ConnectionStatus";
import { MatchTimer } from "../ui/MatchTimer";
import { ResultOverlay } from "../ui/ResultOverlay";
import { StaminaBar } from "../ui/StaminaBar";
import { StartMenu } from "../ui/StartMenu";
import { TensionBar } from "../ui/TensionBar";

// WebGL needs the browser, so the canvas is never server-rendered.
const GameCanvas = dynamic(() => import("./GameCanvas"), { ssr: false });

/**
 * The app shell: the start menu, or a game in the chosen mode with its HUD.
 * Esc returns to the menu (unmounting the game closes its session).
 */
export function GameCanvasLoader() {
  const [mode, setMode] = useState<GameMode | null>(null);

  useEffect(() => {
    // A fresh HUD for every session, and none left over on the menu.
    useHudStore.setState(HUD_DEFAULTS);
    if (!mode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === APP_KEYS.menu) setMode(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode]);

  if (!mode) return <StartMenu onSelect={setMode} />;

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <GameCanvas mode={mode} />
      <TensionBar />
      <StaminaBar />
      <BalanceBar />
      <MatchTimer />
      <ResultOverlay />
      <ConnectionStatus />
    </div>
  );
}
