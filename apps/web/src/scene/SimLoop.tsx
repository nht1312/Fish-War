import type { MatchState } from "@fishwar/game-types";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";

import { detectSoundEvents } from "../audio/soundEvents";
import type { SoundPlayer } from "../audio/soundPlayer";
import { APP_KEYS } from "../input/bindings";
import { createKeyboard, readMatchInputs, type Keyboard } from "../input/keyboard";
import type { SimRunner } from "../sim/simRunner";
import { selectHud, useHudStore } from "../state/hudStore";

/** HUD updates are throttled so React re-renders ~10x/s, not every frame. */
const HUD_PUBLISH_INTERVAL_SECONDS = 0.1;

/**
 * Drives the simulation from the render loop with keyboard input, mirrors HUD
 * values into the HUD store, plays sounds for what changed, and restarts a
 * finished match on R. Renders nothing.
 */
export function SimLoop({ runner, sound }: { runner: SimRunner; sound: SoundPlayer }) {
  const keyboard = useRef<Keyboard | null>(null);
  const lastState = useRef<MatchState | null>(null);
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
    if (runner.getState().phase === "ended" && keyboard.current.isDown(APP_KEYS.restart)) {
      runner.restart();
    }
    runner.advance(delta, readMatchInputs(keyboard.current));

    const state = runner.getState();
    if (lastState.current) sound.play(detectSoundEvents(lastState.current, state, runner.config));
    lastState.current = state;

    sinceHudPublish.current += delta;
    if (sinceHudPublish.current >= HUD_PUBLISH_INTERVAL_SECONDS) {
      sinceHudPublish.current = 0;
      useHudStore.setState(selectHud(runner.getState(), runner.config, runner.getConnection()));
    }
  });

  return null;
}
