"use client";

import type { Role } from "@fishwar/game-types";

import type { ConnectionPhase } from "../net/connection";
import { useHudStore } from "../state/hudStore";

const ROLE_LABEL: Record<Role, string> = { fish: "Fish", fisherman: "Fisherman" };

const PHASE_LABEL: Record<ConnectionPhase, string> = {
  connecting: "Connecting to the game server…",
  waiting: "Waiting for an opponent…",
  "in-match": "",
  "room-full": "The room is full. Try again later.",
  "opponent-left": "Your opponent left. Waiting for a new one…",
  disconnected: "Disconnected from the game server.",
};

/** Online only: which role you play and what the connection is doing. Display only. */
export function ConnectionStatus() {
  const connection = useHudStore((s) => s.connection);
  if (!connection) return null;

  const role = connection.role ? `You are the ${ROLE_LABEL[connection.role]}` : "";
  const phase = PHASE_LABEL[connection.phase];

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 64,
        left: "50%",
        transform: "translateX(-50%)",
        fontFamily: "system-ui, sans-serif",
        fontSize: 16,
        color: "#fff",
        textShadow: "0 1px 2px #000",
        textAlign: "center",
      }}
    >
      {role && <div style={{ fontWeight: 700 }}>{role}</div>}
      {phase && <div>{phase}</div>}
    </div>
  );
}
