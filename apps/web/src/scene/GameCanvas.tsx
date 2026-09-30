"use client";

import { Canvas } from "@react-three/fiber";
import { Dock } from "./Dock";
import { FishermanMesh } from "./FishermanMesh";
import { FishMesh } from "./FishMesh";
import { Pond } from "./Pond";
import { CAMERA, LIGHTING } from "./sceneConfig";

/** The WebGL scene. Rendering only — no gameplay logic lives here. */
export default function GameCanvas() {
  return (
    <Canvas camera={{ position: CAMERA.position, fov: CAMERA.fov }}>
      <color attach="background" args={[LIGHTING.skyColor]} />
      <ambientLight intensity={LIGHTING.ambientIntensity} />
      <directionalLight position={LIGHTING.sunPosition} intensity={LIGHTING.sunIntensity} />
      <Pond />
      <Dock />
      <FishMesh />
      <FishermanMesh />
    </Canvas>
  );
}
