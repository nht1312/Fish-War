"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";

import type { SoundPlayer } from "../audio/soundPlayer";
import { createSession, type GameMode } from "../sim/createSession";
import type { SimRunner } from "../sim/simRunner";
import { Dock } from "./Dock";
import { EscapeZone } from "./EscapeZone";
import { FishermanMesh } from "./FishermanMesh";
import { FishingLine } from "./FishingLine";
import { FishMesh } from "./FishMesh";
import { Net } from "./Net";
import { Pond } from "./Pond";
import { Projectiles } from "./Projectiles";
import { Rod } from "./Rod";
import { CAMERA, LIGHTING } from "./sceneConfig";
import { SimLoop } from "./SimLoop";

/**
 * The WebGL scene. Rendering only: gameplay runs in the session (offline sim or
 * the online server). The session is created in an effect, not a state
 * initializer, so React dev double-invocation cannot open two connections.
 */
export default function GameCanvas({ mode, sound }: { mode: GameMode; sound: SoundPlayer }) {
  const [runner, setRunner] = useState<SimRunner | null>(null);

  useEffect(() => {
    const session = createSession(mode);
    setRunner(session);
    return () => session.dispose();
  }, [mode]);

  if (!runner) return null;

  return (
    <Canvas camera={{ position: CAMERA.position, fov: CAMERA.fov }}>
      <color attach="background" args={[LIGHTING.skyColor]} />
      <ambientLight intensity={LIGHTING.ambientIntensity} />
      <directionalLight position={LIGHTING.sunPosition} intensity={LIGHTING.sunIntensity} />
      <SimLoop runner={runner} sound={sound} />
      <Pond pond={runner.config.pond} />
      <Dock dock={runner.config.dock} />
      <EscapeZone zone={runner.config.escapeZone} />
      <FishMesh runner={runner} />
      <FishermanMesh runner={runner} />
      <Rod runner={runner} />
      <FishingLine runner={runner} />
      <Projectiles runner={runner} />
      <Net runner={runner} />
    </Canvas>
  );
}
