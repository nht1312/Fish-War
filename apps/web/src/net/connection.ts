import type { Role, ServerMessage } from "@fishwar/game-types";

/** Where an online client stands with the server. */
export type ConnectionPhase =
  | "connecting"
  | "waiting"
  | "in-match"
  | "room-full"
  | "opponent-left"
  | "disconnected";

export interface ConnectionStatus {
  readonly phase: ConnectionPhase;
  /** The seat the server gave us; null until welcomed. */
  readonly role: Role | null;
}

export const INITIAL_CONNECTION: ConnectionStatus = { phase: "connecting", role: null };

/** Fold one server message into the connection status. */
export function reduceConnection(status: ConnectionStatus, message: ServerMessage): ConnectionStatus {
  switch (message.type) {
    case "welcome":
      return { ...status, role: message.role };
    case "waiting":
      // The server follows "opponent-left" with "waiting"; keep telling the player why.
      return status.phase === "opponent-left" ? status : { ...status, phase: "waiting" };
    case "snapshot":
      return { ...status, phase: "in-match" };
    case "room-full":
      return { ...status, phase: "room-full" };
    case "opponent-left":
      return { ...status, phase: "opponent-left" };
  }
}

/** The socket closed. A full room closes on purpose, so that stays the reason shown. */
export function reduceConnectionClosed(status: ConnectionStatus): ConnectionStatus {
  return status.phase === "room-full" ? status : { ...status, phase: "disconnected" };
}
