"use client";

import dynamic from "next/dynamic";

import { TensionBar } from "../ui/TensionBar";

// WebGL needs the browser, so the canvas is never server-rendered.
const GameCanvas = dynamic(() => import("./GameCanvas"), { ssr: false });

export function GameCanvasLoader() {
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <GameCanvas />
      <TensionBar />
    </div>
  );
}
