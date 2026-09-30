import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";

import { createKeyboard, readMatchInputs, type Keyboard } from "../input/keyboard";
import type { SimRunner } from "../sim/simRunner";

/** Drives the simulation from the render loop with keyboard input. Renders nothing. */
export function SimLoop({ runner }: { runner: SimRunner }) {
  const keyboard = useRef<Keyboard | null>(null);

  useEffect(() => {
    const kb = createKeyboard(window);
    keyboard.current = kb;
    return () => {
      kb.dispose();
      keyboard.current = null;
    };
  }, []);

  useFrame((_, delta) => {
    if (keyboard.current) {
      runner.advance(delta, readMatchInputs(keyboard.current));
    }
  });

  return null;
}
