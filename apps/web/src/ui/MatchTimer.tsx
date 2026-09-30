"use client";

import { useHudStore } from "../state/hudStore";

const SECONDS_PER_MINUTE = 60;

function formatClock(seconds: number): string {
  const whole = Math.ceil(seconds);
  const minutes = Math.floor(whole / SECONDS_PER_MINUTE);
  const rest = String(whole % SECONDS_PER_MINUTE).padStart(2, "0");
  return `${minutes}:${rest}`;
}

/** Big 3-2-1 during the countdown, then the match clock. Display only. */
export function MatchTimer() {
  const phase = useHudStore((s) => s.phase);
  const countdown = useHudStore((s) => s.countdown);
  const timeLeft = useHudStore((s) => s.timeLeft);
  const counting = phase === "countdown";

  return (
    <div
      role="timer"
      style={{
        position: "fixed",
        top: counting ? "40%" : 16,
        left: "50%",
        transform: "translateX(-50%)",
        fontFamily: "system-ui, sans-serif",
        fontWeight: 700,
        fontSize: counting ? 96 : 28,
        color: "#fff",
        textShadow: "0 2px 4px #000",
      }}
    >
      {counting ? Math.ceil(countdown) : formatClock(timeLeft)}
    </div>
  );
}
