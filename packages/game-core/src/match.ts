import type { MatchInputs, MatchOutcome, MatchState } from "@fishwar/game-types";

import type { MatchConfig } from "./config";
import { stepFishermanMovement } from "./systems/fishermanMovement";
import { stepFishMovement } from "./systems/fishMovement";
import { applyTensionSpike, stepDash } from "./systems/dash";
import { stepDodge } from "./systems/dodge";
import { stepHookedFight } from "./systems/fight";
import { rodTipPosition, stepLine } from "./systems/line";
import { stepNet } from "./systems/net";
import { stepDrag } from "./systems/reel";
import { isSprinting, stepStamina } from "./systems/stamina";
import { stepWaterGun } from "./systems/waterGun";

const AT_REST = { x: 0, y: 0, z: 0 } as const;

/** Build the initial state of a match from its config. */
export function createMatch(config: MatchConfig): MatchState {
  return {
    tick: 0,
    time: 0,
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

const FISH_EXHAUSTED: MatchOutcome = { winner: "fisherman", reason: "fish-exhausted" };
const FISHERMAN_KNOCKED_OUT: MatchOutcome = { winner: "fish", reason: "fisherman-knocked-out" };
const CAPTURED: MatchOutcome = { winner: "fisherman", reason: "captured" };

/**
 * Advance the match by one fixed tick of `dt` seconds. Pure: returns a new
 * state and never mutates its input. Gameplay systems are composed in here.
 */
export function stepMatch(
  state: MatchState,
  inputs: MatchInputs,
  config: MatchConfig,
  dt: number,
): MatchState {
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
      : { line: castLine, fish: swum, outcome: null };

  const line = dash.dashed ? applyTensionSpike(fight.line, config) : fight.line;
  const stamina = stepStamina(
    fight.fish.stamina,
    {
      sprinting: isSprinting(state.fish, inputs.fish),
      tension: line.phase === "hooked" ? line.tension : 0,
    },
    config,
    dt,
  );
  const exhausted = line.phase === "hooked" && stamina === 0 ? FISH_EXHAUSTED : null;
  const knockedOut = water.knockedOut ? FISHERMAN_KNOCKED_OUT : null;
  const net = stepNet(fisherman, fight.fish, inputs.fisherman, config, dt);
  const captured = net.captured ? CAPTURED : null;

  return {
    ...state,
    tick: state.tick + 1,
    time: state.time + dt,
    fish: { ...fight.fish, stamina },
    line,
    projectiles: water.projectiles,
    fisherman: { ...net.fisherman, castHeld: inputs.fisherman.cast },
    outcome: state.outcome ?? fight.outcome ?? exhausted ?? knockedOut ?? captured,
  };
}
