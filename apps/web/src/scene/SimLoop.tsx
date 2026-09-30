import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";

import { createKeyboard, readMatchInputs, type Keyboard } from "../input/keyboard";
import type { SimRunner } from "../sim/simRunner";
import { selectHud, useHudStore } from "../state/hudStore";

/** HUD updates are throttled so React re-renders ~10x/s, not every frame. */
const HUD_PUBLISH_INTERVAL_SECONDS = 0.1;

/** App control, not a gameplay input: start a new match once one has ended. */
const RESTART_KEY = "KeyR";

/**
 * Drives the simulation from the render loop with keyboard input, mirrors HUD
 * values into the HUD store, and restarts a finished match on R. Renders nothing.
 */
export function SimLoop({ runner }: { runner: SimRunner }) {
  const keyboard = useRef<Keyboard | null>(null);
  const sinceHudPublish = useRef(0);

  useEffect(() => {
    const kb = createKeyboard(window);
    keyboard.current = kb;
    return () => {
      kb.dispose();
      keyboard.current = null;
    };
  }, []);

  useFrame((_, delta) => {
    if (!keyboard.current) return;
    if (runner.getState().phase === "ended" && keyboard.current.isDown(RESTART_KEY)) {
      runner.restart();
    }
    runner.advance(delta, readMatchInputs(keyboard.current));

    sinceHudPublish.current += delta;
    if (sinceHudPublish.current >= HUD_PUBLISH_INTERVAL_SECONDS) {
      sinceHudPublish.current = 0;
      useHudStore.setState(selectHud(runner.getState(), runner.config));
    }
  });

  return null;
}
