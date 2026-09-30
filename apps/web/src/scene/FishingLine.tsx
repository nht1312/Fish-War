import { rodTipPosition } from "@fishwar/game-core";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferGeometry, Float32BufferAttribute, Line, LineBasicMaterial, type Mesh } from "three";

import type { SimRunner } from "../sim/simRunner";
import { LINE_STYLE } from "./sceneConfig";

const SEGMENT_POINTS = 2;
const XYZ = 3;

/** A straight line from the rod tip to the hook, plus a bobber, while cast. */
export function FishingLine({ runner }: { runner: SimRunner }) {
  const bobber = useRef<Mesh>(null);
  const line = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(new Float32Array(SEGMENT_POINTS * XYZ), XYZ),
    );
    const segment = new Line(geometry, new LineBasicMaterial({ color: LINE_STYLE.color }));
    // Endpoints move every frame; skip bounding-sphere upkeep.
    segment.frustumCulled = false;
    return segment;
  }, []);

  useEffect(
    () => () => {
      line.geometry.dispose();
      line.material.dispose();
    },
    [line],
  );

  useFrame(() => {
    const state = runner.getState();
    const isCast = state.line.phase === "cast";
    line.visible = isCast;
    if (bobber.current) bobber.current.visible = isCast;
    if (state.line.phase !== "cast") return;

    const tip = rodTipPosition(state.fisherman, runner.config);
    const hook = state.line.hookPosition;
    const positions = line.geometry.getAttribute("position");
    positions.setXYZ(0, tip.x, tip.y, tip.z);
    positions.setXYZ(1, hook.x, hook.y, hook.z);
    positions.needsUpdate = true;
    bobber.current?.position.set(hook.x, hook.y, hook.z);
  });

  return (
    <>
      <primitive object={line} />
      <mesh ref={bobber} visible={false}>
        <sphereGeometry args={[LINE_STYLE.bobberRadius]} />
        <meshStandardMaterial color={LINE_STYLE.bobberColor} />
      </mesh>
    </>
  );
}
