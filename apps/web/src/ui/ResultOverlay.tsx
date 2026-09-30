"use client";

import type { OutcomeReason, Role } from "@fishwar/game-types";

import { useHudStore } from "../state/hudStore";

const WINNER_LABEL: Record<Role, string> = {
  fish: "Fish wins!",
  fisherman: "Fisherman wins!",
};

const REASON_LABEL: Record<OutcomeReason, string> = {
  "line-broken": "The line snapped.",
  "fish-exhausted": "The fish is worn out.",
  "fisherman-knocked-out": "The fisherman got knocked out.",
  captured: "Caught in the net.",
  "fish-escaped": "The fish escaped.",
  timeout: "The fish held out until time ran out.",
};

/** Who won and why, once the match has ended. Display only. */
export function ResultOverlay() {
  const outcome = useHudStore((s) => s.outcome);
  if (!outcome) return null;

  return (
    <div
      role="dialog"
      aria-label="Match result"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.45)",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        textShadow: "0 2px 4px #000",
      }}
    >
      <div style={{ fontSize: 56, fontWeight: 700 }}>{WINNER_LABEL[outcome.winner]}</div>
      <div style={{ fontSize: 22, marginTop: 8 }}>{REASON_LABEL[outcome.reason]}</div>
      <div style={{ fontSize: 16, marginTop: 24, opacity: 0.85 }}>Press R to play again</div>
    </div>
  );
}
