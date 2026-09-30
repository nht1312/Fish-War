import { rodTipPosition } from "@fishwar/game-core";
import type { MatchState } from "@fishwar/game-types";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferGeometry, Float32BufferAttribute, Line, LineBasicMaterial, type Mesh } from "three";

import type { SimRunner } from "../sim/simRunner";
import { sagCurvePoints } from "./lineCurve";
import { LINE_STYLE } from "./sceneConfig";

const XYZ = 3;

/** How much the line hangs: more over a longer span, none at breaking tension. */
function lineSag(state: MatchState, span: number, breakStrength: number): number {
  const tensionRatio = state.line.phase === "hooked" ? state.line.tension / breakStrength : 0;
  const slack = Math.max(1 - tensionRatio, 0);
  return Math.min(span * LINE_STYLE.sagPerMeter, LINE_STYLE.maxSag) * slack;
}

/**
 * The line from the rod tip to the bobber (cast) or the fish (hooked), drawn
 * as a hanging curve that straightens as tension rises. Rendering only.
 */
export function FishingLine({ runner }: { runner: SimRunner }) {
  const bobber = useRef<Mesh>(null);
  const line = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(new Float32Array((LINE_STYLE.segments + 1) * XYZ), XYZ),
    );
    const curve = new Line(geometry, new LineBasicMaterial({ color: LINE_STYLE.color }));
    // Points move every frame; skip bounding-sphere upkeep.
    curve.frustumCulled = false;
    return curve;
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
    line.visible = state.line.phase !== "idle";
    if (bobber.current) bobber.current.visible = state.line.phase === "cast";
    if (state.line.phase === "idle") return;

    // Cast: the line ends at the bobber. Hooked: it ends at the fish.
    const end = state.line.phase === "cast" ? state.line.hookPosition : state.fish.position;
    const tip = rodTipPosition(state.fisherman, runner.config);
    const span = Math.hypot(end.x - tip.x, end.y - tip.y, end.z - tip.z);
    const sag = lineSag(state, span, runner.config.tension.breakStrength);

    const positions = line.geometry.getAttribute("position");
    sagCurvePoints(tip, end, sag, LINE_STYLE.segments).forEach((p, i) => {
      positions.setXYZ(i, p.x, p.y, p.z);
    });
    positions.needsUpdate = true;
    bobber.current?.position.set(end.x, end.y, end.z);
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
