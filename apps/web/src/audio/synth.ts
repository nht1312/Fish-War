/**
 * Tiny Web Audio synthesiser: every game sound is a tone or a noise burst with
 * a quick fade, so the game needs no audio files and no audio library.
 */

/** Gain can't ramp exponentially to exactly zero; fade to this instead. */
const SILENT_GAIN = 0.0001;

export interface ToneSpec {
  readonly kind: "tone";
  readonly type: OscillatorType;
  /** Start frequency (Hz), optionally sliding to `toFreq` over the sound. */
  readonly freq: number;
  readonly toFreq?: number;
  readonly duration: number;
  readonly volume: number;
  /** Seconds after "now" to start. */
  readonly delay?: number;
}

export interface NoiseSpec {
  readonly kind: "noise";
  /** Low-pass cutoff (Hz): low for splashes, high for hisses. */
  readonly filterFreq: number;
  readonly duration: number;
  readonly volume: number;
  readonly delay?: number;
}

export type SoundSpec = ToneSpec | NoiseSpec;

function envelope(ctx: AudioContext, volume: number, start: number, duration: number): GainNode {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(SILENT_GAIN, start + duration);
  return gain;
}

function playTone(ctx: AudioContext, out: AudioNode, spec: ToneSpec): void {
  const start = ctx.currentTime + (spec.delay ?? 0);
  const osc = ctx.createOscillator();
  osc.type = spec.type;
  osc.frequency.setValueAtTime(spec.freq, start);
  if (spec.toFreq) osc.frequency.exponentialRampToValueAtTime(spec.toFreq, start + spec.duration);
  osc.connect(envelope(ctx, spec.volume, start, spec.duration)).connect(out);
  osc.start(start);
  osc.stop(start + spec.duration);
}

function playNoise(ctx: AudioContext, out: AudioNode, spec: NoiseSpec): void {
  const start = ctx.currentTime + (spec.delay ?? 0);
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * spec.duration), ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = spec.filterFreq;
  source.connect(filter).connect(envelope(ctx, spec.volume, start, spec.duration)).connect(out);
  source.start(start);
  source.stop(start + spec.duration);
}

export function playSpec(ctx: AudioContext, out: AudioNode, spec: SoundSpec): void {
  if (spec.kind === "tone") playTone(ctx, out, spec);
  else playNoise(ctx, out, spec);
}
