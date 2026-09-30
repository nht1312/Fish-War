import { createMatch, stepMatch, type MatchConfig } from "@fishwar/game-core";
import {
  ROLES,
  type FishermanInput,
  type FishInput,
  type MatchState,
  type Role,
  type ServerMessage,
} from "@fishwar/game-types";

/**
 * The single game room: two seats and, while both are filled, a match.
 * Pure data and functions (no sockets), so the rules are unit-testable.
 */

interface Seat<I> {
  /** Highest input seq applied from this seat; 0 before any input. */
  readonly lastSeq: number;
  /** Latest intent from this seat, applied every tick until replaced. */
  readonly input: I;
}

export interface Room {
  readonly seats: {
    readonly fish: Seat<FishInput> | null;
    readonly fisherman: Seat<FishermanInput> | null;
  };
  /** Exists only while both seats are filled. */
  readonly match: MatchState | null;
}

const STILL = { x: 0, z: 0 } as const;

const IDLE_FISH: FishInput = { move: STILL, dive: false, sprint: false, dash: false, shoot: false };

const IDLE_FISHERMAN: FishermanInput = {
  move: STILL,
  cast: false,
  dragChange: 0,
  dodge: false,
  net: false,
};

export function createRoom(): Room {
  return { seats: { fish: null, fisherman: null }, match: null };
}

function withMatchIfFull(room: Room, config: MatchConfig): Room {
  const full = room.seats.fish !== null && room.seats.fisherman !== null;
  return { ...room, match: full ? (room.match ?? createMatch(config)) : null };
}

export interface JoinResult {
  readonly room: Room;
  /** The seat taken, or null when the room is full. */
  readonly role: Role | null;
}

/** Take the first free seat (Fish, then Fisherman). A full room refuses. */
export function joinRoom(room: Room, config: MatchConfig): JoinResult {
  const role = ROLES.find((r) => room.seats[r] === null) ?? null;
  if (role === null) return { room, role };

  const seats =
    role === "fish"
      ? { ...room.seats, fish: { lastSeq: 0, input: IDLE_FISH } }
      : { ...room.seats, fisherman: { lastSeq: 0, input: IDLE_FISHERMAN } };
  return { room: withMatchIfFull({ ...room, seats }, config), role };
}

/** Free a seat. The match is discarded; the other player waits for a new opponent. */
export function leaveRoom(room: Room, role: Role): Room {
  return { seats: { ...room.seats, [role]: null }, match: null };
}

function isFishInput(input: FishInput | FishermanInput): input is FishInput {
  return "dive" in input;
}

/**
 * Store a seat's latest intent. Input for an empty seat, or shaped for the
 * other role, is ignored.
 */
export function receiveInput(
  room: Room,
  role: Role,
  seq: number,
  input: FishInput | FishermanInput,
): Room {
  const { fish, fisherman } = room.seats;
  if (role === "fish" && fish && isFishInput(input)) {
    return { ...room, seats: { ...room.seats, fish: { lastSeq: seq, input } } };
  }
  if (role === "fisherman" && fisherman && !isFishInput(input)) {
    return { ...room, seats: { ...room.seats, fisherman: { lastSeq: seq, input } } };
  }
  return room;
}

/** Once a match has ended, either player can start a fresh one. */
export function requestRematch(room: Room, config: MatchConfig): Room {
  if (room.match?.phase !== "ended") return room;
  return { ...room, match: createMatch(config) };
}

/** Advance the match one tick with each seat's latest input. */
export function tickRoom(room: Room, config: MatchConfig, dt: number): Room {
  const { fish, fisherman } = room.seats;
  if (!room.match || !fish || !fisherman) return room;
  const inputs = { fish: fish.input, fisherman: fisherman.input };
  return { ...room, match: stepMatch(room.match, inputs, config, dt) };
}

/** The snapshot to send to a seat, acknowledging its latest applied input. */
export function snapshotFor(room: Room, role: Role): ServerMessage | null {
  const seat = room.seats[role];
  if (!room.match || !seat) return null;
  return { type: "snapshot", state: room.match, ackSeq: seat.lastSeq };
}
