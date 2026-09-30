import {
  ROLES,
  type ClientMessage,
  type FishermanInput,
  type FishInput,
  type HorizontalVec,
  type MatchState,
  type Role,
  type ServerMessage,
} from "@fishwar/game-types";

import { clamp } from "./math";

/**
 * Pure wire-message parsers. They never throw: anything malformed becomes
 * null. Parsed values are rebuilt from known fields only, so extra fields a
 * client adds are dropped, and client intent is clamped to legal ranges.
 */

type UnknownRecord = Readonly<Record<string, unknown>>;

const MATCH_PHASES: ReadonlyArray<MatchState["phase"]> = ["countdown", "playing", "ended"];

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isSeq(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isRole(value: unknown): value is Role {
  return ROLES.some((role) => role === value);
}

/** A horizontal direction, clamped to length 1. */
function parseMove(value: unknown): HorizontalVec | null {
  if (!isRecord(value) || !isFiniteNumber(value.x) || !isFiniteNumber(value.z)) return null;
  const length = Math.hypot(value.x, value.z);
  const scale = length > 1 ? 1 / length : 1;
  return { x: value.x * scale, z: value.z * scale };
}

function parseFlags<K extends string>(
  value: UnknownRecord,
  keys: readonly K[],
): Record<K, boolean> | null {
  const flags = {} as Record<K, boolean>;
  for (const key of keys) {
    const flag = value[key];
    if (typeof flag !== "boolean") return null;
    flags[key] = flag;
  }
  return flags;
}

const FISH_FLAGS = ["dive", "sprint", "dash", "shoot"] as const;
const FISHERMAN_FLAGS = ["cast", "dodge", "net"] as const;

function parseFishInput(value: unknown): FishInput | null {
  if (!isRecord(value)) return null;
  const move = parseMove(value.move);
  const flags = parseFlags(value, FISH_FLAGS);
  return move && flags ? { move, ...flags } : null;
}

function parseFishermanInput(value: unknown): FishermanInput | null {
  if (!isRecord(value) || !isFiniteNumber(value.dragChange)) return null;
  const move = parseMove(value.move);
  const flags = parseFlags(value, FISHERMAN_FLAGS);
  if (!move || !flags) return null;
  return { move, dragChange: clamp(value.dragChange, -1, 1), ...flags };
}

/** Parse a client message; `role` is the sender's seat, which fixes the input shape. */
export function parseClientMessage(raw: string, role: Role): ClientMessage | null {
  const message = parseJson(raw);
  if (!isRecord(message)) return null;

  switch (message.type) {
    case "rematch":
      return { type: "rematch" };
    case "input": {
      if (!isSeq(message.seq)) return null;
      const input =
        role === "fish" ? parseFishInput(message.input) : parseFishermanInput(message.input);
      return input ? { type: "input", seq: message.seq, input } : null;
    }
    default:
      return null;
  }
}

/**
 * Shallow shape check of a snapshot's state. The server is authoritative and
 * trusted; this only guards the client against garbage or protocol drift.
 */
function isMatchState(value: unknown): value is MatchState {
  return (
    isRecord(value) &&
    isFiniteNumber(value.tick) &&
    MATCH_PHASES.some((phase) => phase === value.phase) &&
    isRecord(value.fish) &&
    isRecord(value.fisherman) &&
    isRecord(value.line) &&
    Array.isArray(value.projectiles)
  );
}

/** Parse a server message on the client. */
export function parseServerMessage(raw: string): ServerMessage | null {
  const message = parseJson(raw);
  if (!isRecord(message)) return null;

  switch (message.type) {
    case "welcome":
      return isRole(message.role) ? { type: "welcome", role: message.role } : null;
    case "waiting":
    case "room-full":
    case "opponent-left":
      return { type: message.type };
    case "snapshot":
      return isMatchState(message.state) && isSeq(message.ackSeq)
        ? { type: "snapshot", state: message.state, ackSeq: message.ackSeq }
        : null;
    default:
      return null;
  }
}
