"use client";

import { DEFAULT_CONFIG } from "@fishwar/game-core";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";

import { createSimRunner } from "../sim/simRunner";
import { Dock } from "./Dock";
import { FishermanMesh } from "./FishermanMesh";
import { FishingLine } from "./FishingLine";
import { FishMesh } from "./FishMesh";
import { Net } from "./Net";
import { Pond } from "./Pond";
import { Projectiles } from "./Projectiles";
import { Rod } from "./Rod";
import { CAMERA, LIGHTING } from "./sceneConfig";
import { SimLoop } from "./SimLoop";

/** The WebGL scene. Rendering only — gameplay runs in the sim runner. */
export default function GameCanvas() {
  const [runner] = useState(() => createSimRunner(DEFAULT_CONFIG));

  return (
    <Canvas camera={{ position: CAMERA.position, fov: CAMERA.fov }}>
      <color attach="background" args={[LIGHTING.skyColor]} />
      <ambientLight intensity={LIGHTING.ambientIntensity} />
      <directionalLight position={LIGHTING.sunPosition} intensity={LIGHTING.sunIntensity} />
      <SimLoop runner={runner} />
      <Pond pond={runner.config.pond} />
      <Dock dock={runner.config.dock} />
      <FishMesh runner={runner} />
      <FishermanMesh runner={runner} />
      <Rod runner={runner} />
      <FishingLine runner={runner} />
      <Projectiles runner={runner} />
      <Net runner={runner} />
    </Canvas>
  );
}
