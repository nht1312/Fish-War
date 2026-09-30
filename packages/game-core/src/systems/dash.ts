import type { FishInput, FishState, LineState } from "@fishwar/game-types";

import type { MatchConfig } from "../config";

export interface DashStep {
  readonly fish: FishState;
  readonly dashed: boolean;
}

/**
 * Dash: with the button held, the cooldown elapsed and enough stamina, the fish
 * gets a velocity burst along its facing, pays dashCost, and starts the
 * cooldown. Normal swimming then eases the burst back down to swim speed.
 * The cooldown counts down in sim time every tick.
 */
export function stepDash(fish: FishState, input: FishInput, config: MatchConfig, dt: number): DashStep {
  const { dashImpulse, dashCost, dashCooldown } = config.fish;
  const cooldown = Math.max(fish.dashCooldown - dt, 0);
  const canDash = input.dash && fish.dashCooldown <= 0 && fish.stamina >= dashCost;
  if (!canDash) return { fish: { ...fish, dashCooldown: cooldown }, dashed: false };

  return {
    fish: {
      ...fish,
      velocity: {
        x: fish.velocity.x + Math.sin(fish.yaw) * dashImpulse,
        y: fish.velocity.y,
        z: fish.velocity.z + Math.cos(fish.yaw) * dashImpulse,
      },
      stamina: fish.stamina - dashCost,
      dashCooldown,
    },
    dashed: true,
  };
}

/** A dash yanks on a hooked line: tension jumps by dashTensionSpike. */
export function applyTensionSpike(line: LineState, config: MatchConfig): LineState {
  if (line.phase !== "hooked") return line;
  const tension = Math.min(line.tension + config.fish.dashTensionSpike, config.tension.breakStrength);
  return { ...line, tension };
}
