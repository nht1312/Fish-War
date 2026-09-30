import { isAtSurface, type MatchConfig } from "@fishwar/game-core";
import type { MatchState } from "@fishwar/game-types";

/** Everything the game makes a sound for. */
export type SoundEvent =
  | "countdown"
  | "go"
  | "cast"
  | "hook"
  | "reel"
  | "dive"
  | "shoot"
  | "hit"
  | "dash"
  | "net"
  | "snap"
  | "end";

/**
 * The sounds to play for the change from one rendered state to the next.
 * Pure and presentation-only: it reads what the sim already decided (timers
 * restarting, line phase changes, the outcome) and never feeds back into it.
 */
export function detectSoundEvents(
  prev: MatchState,
  next: MatchState,
  config: MatchConfig,
): SoundEvent[] {
  const events: SoundEvent[] = [];
  const shownSecond = (state: MatchState) => Math.ceil(state.countdown);

  if (next.phase === "countdown" && shownSecond(next) < shownSecond(prev) && shownSecond(next) > 0) {
    events.push("countdown");
  }
  if (prev.phase === "countdown" && next.phase === "playing") events.push("go");

  if (prev.line.phase === "idle" && next.line.phase === "cast") events.push("cast");
  if (prev.line.phase === "cast" && next.line.phase === "hooked") events.push("hook");
  if (prev.line.phase === "hooked" && next.line.phase === "hooked" && next.line.length < prev.line.length) {
    events.push("reel");
  }

  if (isAtSurface(prev.fish, config) && !isAtSurface(next.fish, config)) events.push("dive");
  if (next.fish.shotCooldown > prev.fish.shotCooldown) events.push("shoot");
  if (next.fisherman.balance < prev.fisherman.balance) events.push("hit");
  if (next.fish.dashCooldown > prev.fish.dashCooldown) events.push("dash");
  if (next.fisherman.netSwingTime > prev.fisherman.netSwingTime) events.push("net");

  if (next.outcome && !prev.outcome) {
    if (next.outcome.reason === "line-broken") events.push("snap");
    events.push("end");
  }
  return events;
}
