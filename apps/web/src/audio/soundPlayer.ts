import type { SoundEvent } from "./soundEvents";
import { playSpec, type SoundSpec } from "./synth";

/** Overall loudness, applied on top of each recipe's own volume. */
const MASTER_VOLUME = 0.6;
/** Reeling produces an event every tick; click at most this often (s). */
const REEL_CLICK_INTERVAL = 0.12;

/** What each event sounds like. */
const RECIPES: Record<SoundEvent, readonly SoundSpec[]> = {
  countdown: [{ kind: "tone", type: "square", freq: 660, duration: 0.12, volume: 0.15 }],
  go: [{ kind: "tone", type: "square", freq: 990, duration: 0.3, volume: 0.15 }],
  cast: [
    { kind: "noise", filterFreq: 2500, duration: 0.25, volume: 0.15 },
    { kind: "tone", type: "sine", freq: 900, toFreq: 300, duration: 0.2, volume: 0.1 },
  ],
  hook: [
    { kind: "tone", type: "triangle", freq: 300, toFreq: 700, duration: 0.15, volume: 0.25 },
    { kind: "tone", type: "triangle", freq: 700, duration: 0.1, volume: 0.2, delay: 0.08 },
  ],
  reel: [{ kind: "tone", type: "square", freq: 1400, duration: 0.03, volume: 0.05 }],
  dive: [{ kind: "noise", filterFreq: 800, duration: 0.35, volume: 0.3 }],
  shoot: [
    { kind: "noise", filterFreq: 4000, duration: 0.15, volume: 0.12 },
    { kind: "tone", type: "sine", freq: 500, toFreq: 200, duration: 0.15, volume: 0.12 },
  ],
  hit: [
    { kind: "noise", filterFreq: 1500, duration: 0.2, volume: 0.3 },
    { kind: "tone", type: "sawtooth", freq: 180, duration: 0.15, volume: 0.1 },
  ],
  dash: [{ kind: "tone", type: "sine", freq: 200, toFreq: 600, duration: 0.15, volume: 0.2 }],
  net: [{ kind: "noise", filterFreq: 1200, duration: 0.3, volume: 0.15 }],
  snap: [{ kind: "tone", type: "sawtooth", freq: 1200, toFreq: 80, duration: 0.35, volume: 0.2 }],
  end: [
    { kind: "tone", type: "triangle", freq: 523, duration: 0.25, volume: 0.2 },
    { kind: "tone", type: "triangle", freq: 659, duration: 0.25, volume: 0.2, delay: 0.15 },
    { kind: "tone", type: "triangle", freq: 784, duration: 0.4, volume: 0.2, delay: 0.3 },
  ],
};

export interface SoundPlayer {
  play(events: readonly SoundEvent[]): void;
  setMuted(muted: boolean): void;
}

/**
 * Plays sound events. The AudioContext is created on the first sound (after the
 * player has clicked the menu, so the browser allows audio) and resumed if the
 * browser suspended it. A browser without Web Audio simply stays silent.
 */
export function createSoundPlayer(): SoundPlayer {
  let audio: { ctx: AudioContext; master: GainNode } | null = null;
  let muted = false;
  let lastReelAt = Number.NEGATIVE_INFINITY;

  function output() {
    if (!audio) {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = MASTER_VOLUME;
      master.connect(ctx.destination);
      audio = { ctx, master };
    }
    if (audio.ctx.state === "suspended") void audio.ctx.resume();
    return audio;
  }

  return {
    play(events) {
      if (muted || events.length === 0 || typeof AudioContext === "undefined") return;
      const { ctx, master } = output();
      for (const event of events) {
        if (event === "reel") {
          if (ctx.currentTime - lastReelAt < REEL_CLICK_INTERVAL) continue;
          lastReelAt = ctx.currentTime;
        }
        for (const spec of RECIPES[event]) playSpec(ctx, master, spec);
      }
    },
    setMuted(value) {
      muted = value;
    },
  };
}
