import type { MatchInputs, MatchState } from "@fishwar/game-types";

import type { MatchConfig } from "./config";
import { stepFishermanMovement } from "./systems/fishermanMovement";
import { stepFishMovement } from "./systems/fishMovement";
import { applyTensionSpike, stepDash } from "./systems/dash";
import { stepDodge } from "./systems/dodge";
import { stepHookedFight } from "./systems/fight";
import { rodTipPosition, stepLine } from "./systems/line";
import { stepNet } from "./systems/net";
import { isInEscapeZone, resolveOutcome, type OutcomeEvents } from "./systems/outcome";
import { stepDrag } from "./systems/reel";
import { isSprinting, stepStamina } from "./systems/stamina";
import { stepWaterGun } from "./systems/waterGun";

const AT_REST = { x: 0, y: 0, z: 0 } as const;

/** Build the initial state of a match from its config, at the start of the countdown. */
export function createMatch(config: MatchConfig): MatchState {
  return {
    tick: 0,
    time: 0,
    phase: "countdown",
    countdown: config.match.countdownSeconds,
    timeLeft: config.match.durationSeconds,
    fish: {
      position: config.fishSpawn,
      velocity: AT_REST,
      yaw: 0,
      stamina: config.fish.maxStamina,
      dashCooldown: 0,
      shotCooldown: 0,
    },
    fisherman: {
      position: config.fishermanSpawn,
      velocity: AT_REST,
      yaw: config.fisherman.spawnYaw,
      castHeld: false,
      drag: config.reel.initialDrag,
      balance: config.waterGun.maxBalance,
      staggerTime: 0,
      dodgeCooldown: 0,
      dodgeTime: 0,
      netCooldown: 0,
      netSwingTime: 0,
    },
    line: { phase: "idle" },
    projectiles: [],
    outcome: null,
  };
}

interface PlayStep {
  readonly world: Pick<MatchState, "fish" | "fisherman" | "line" | "projectiles">;
  readonly events: Omit<OutcomeEvents, "timeExpired">;
}

/** One tick of live play: every gameplay system, composed. Reports what happened. */
function stepPlay(state: MatchState, inputs: MatchInputs, config: MatchConfig, dt: number): PlayStep {
  const walked = stepDodge(
    stepFishermanMovement(state.fisherman, inputs.fisherman, config, dt),
    inputs.fisherman,
    config,
    dt,
  );
  const dash = stepDash(
    stepFishMovement(state.fish, inputs.fish, config, dt),
    inputs.fish,
    config,
    dt,
  );
  const water = stepWaterGun(dash.fish, walked, state.projectiles, inputs.fish, config, dt);
  const fisherman = {
    ...water.fisherman,
    drag: stepDrag(walked.drag, inputs.fisherman.dragChange, config, dt),
  };
  const swum = water.fish;
  const reeling = inputs.fisherman.cast && fisherman.staggerTime <= 0;
  const castLine = stepLine(state.line, fisherman, swum, inputs.fisherman, config);
  const fight =
    castLine.phase === "hooked"
      ? stepHookedFight(
          castLine,
          swum,
          inputs.fish,
          reeling,
          fisherman.drag,
          rodTipPosition(fisherman, config),
          config,
          dt,
        )
      : { line: castLine, fish: swum, lineBroken: false };

  const line = dash.dashed ? applyTensionSpike(fight.line, config) : fight.line;
  const hooked = line.phase === "hooked";
  const stamina = stepStamina(
    fight.fish.stamina,
    { sprinting: isSprinting(state.fish, inputs.fish), tension: hooked ? line.tension : 0 },
    config,
    dt,
  );
  const net = stepNet(fisherman, fight.fish, inputs.fisherman, config, dt);
  const fish = { ...fight.fish, stamina };

  return {
    world: {
      fish,
      line,
      projectiles: water.projectiles,
      fisherman: { ...net.fisherman, castHeld: inputs.fisherman.cast },
    },
    events: {
      captured: net.captured,
      fishExhausted: hooked && stamina === 0,
      lineBroken: fight.lineBroken,
      fishermanKnockedOut: water.knockedOut,
      fishEscaped: !hooked && isInEscapeZone(fish.position, config),
    },
  };
}

/**
 * Advance the match by one fixed tick of `dt` seconds. Pure: returns a new
 * state and never mutates its input. Countdown: only the clock runs and inputs
 * are ignored. Playing: every system runs, the timer counts down, and any win
 * condition ends the match. Ended: the state is frozen.
 */
export function stepMatch(
  state: MatchState,
  inputs: MatchInputs,
  config: MatchConfig,
  dt: number,
): MatchState {
  if (state.phase === "ended") return state;

  const clock = { tick: state.tick + 1, time: state.time + dt };
  if (state.phase === "countdown") {
    const countdown = Math.max(state.countdown - dt, 0);
    return { ...state, ...clock, countdown, phase: countdown > 0 ? "countdown" : "playing" };
  }

  const { world, events } = stepPlay(state, inputs, config, dt);
  const timeLeft = Math.max(state.timeLeft - dt, 0);
  const outcome = resolveOutcome({ ...events, timeExpired: timeLeft === 0 });
  return {
    ...state,
    ...clock,
    ...world,
    timeLeft,
    outcome,
    phase: outcome ? "ended" : "playing",
  };
}
