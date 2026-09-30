"use client";

import type { Role } from "@fishwar/game-types";

import type { ConnectionPhase } from "../net/connection";
import { useHudStore } from "../state/hudStore";

const ROLE_LABEL: Record<Role, string> = { fish: "Fish", fisherman: "Fisherman" };

/** Phases that block play get a centred card; "in-match" only shows the role label. */
const CARD_TEXT: Record<Exclude<ConnectionPhase, "in-match">, string> = {
  connecting: "Connecting to the game server…",
  waiting: "Waiting for an opponent… Open the game in another window or on another PC.",
  "room-full": "The room is full. Press Esc to go back.",
  "opponent-left": "Your opponent left. Waiting for a new one…",
  disconnected: "Disconnected from the game server. Is it running? Press Esc to go back.",
};

const TEXT_STYLE = {
  fontFamily: "system-ui, sans-serif",
  color: "#fff",
  textShadow: "0 1px 2px #000",
  textAlign: "center",
} as const;

/** Online only: your role, and what the connection is doing when not in a match. Display only. */
export function ConnectionStatus() {
  const connection = useHudStore((s) => s.connection);
  if (!connection) return null;

  const role = connection.role ? `You are the ${ROLE_LABEL[connection.role]}` : null;

  if (connection.phase === "in-match") {
    return (
      <div
        role="status"
        style={{
          ...TEXT_STYLE,
          position: "fixed",
          top: 56,
          left: "50%",
          transform: "translateX(-50%)",
          fontWeight: 700,
        }}
      >
        {role}
      </div>
    );
  }

  return (
    <div
      role="status"
      style={{
        ...TEXT_STYLE,
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: "rgba(0, 0, 0, 0.35)",
      }}
    >
      {role && <div style={{ fontSize: 28, fontWeight: 700 }}>{role}</div>}
      <div style={{ fontSize: 18, maxWidth: 480 }}>{CARD_TEXT[connection.phase]}</div>
    </div>
  );
}
