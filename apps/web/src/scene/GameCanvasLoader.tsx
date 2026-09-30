"use client";

import dynamic from "next/dynamic";

// WebGL needs the browser, so the canvas is never server-rendered.
const GameCanvas = dynamic(() => import("./GameCanvas"), { ssr: false });

export function GameCanvasLoader() {
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <GameCanvas />
    </div>
  );
}
