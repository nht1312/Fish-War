"use client";

import { CONTROLS_HELP } from "../input/bindings";
import type { GameMode } from "../sim/createSession";

const BUTTON_STYLE = {
  padding: "12px 28px",
  fontSize: 18,
  fontWeight: 700,
  borderRadius: 8,
  border: "2px solid #fff",
  background: "rgba(255, 255, 255, 0.15)",
  color: "#fff",
  cursor: "pointer",
} as const;

const HOW_TO_WIN = [
  "Fish wins by snapping the line, knocking out the Fisherman, reaching the green escape strip unhooked, or surviving the clock.",
  "Fisherman wins by exhausting the hooked Fish or netting it near the surface.",
];

/** Title screen: pick a mode, read the controls. */
export function StartMenu({ onSelect }: { onSelect: (mode: GameMode) => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 16px",
        gap: 24,
        background: "linear-gradient(#2f7fb8, #1c3b4a)",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 56, margin: 0 }}>Fish War</h1>
      <p style={{ margin: 0, opacity: 0.85 }}>
        1v1: the Fish tries to escape, the Fisherman tries to land it.
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <button type="button" style={BUTTON_STYLE} onClick={() => onSelect("offline")} autoFocus>
          Play offline · 2 players, 1 keyboard
        </button>
        <button type="button" style={BUTTON_STYLE} onClick={() => onSelect("online")}>
          Play online · 1 player per screen
        </button>
      </div>

      <div style={{ display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "center" }}>
        {CONTROLS_HELP.map((group) => (
          <section key={group.title}>
            <h2 style={{ fontSize: 20, margin: "0 0 8px" }}>{group.title}</h2>
            <table style={{ borderCollapse: "collapse", fontSize: 14 }}>
              <tbody>
                {group.rows.map((row) => (
                  <tr key={row.keys}>
                    <td style={{ padding: "2px 12px 2px 0", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {row.keys}
                    </td>
                    <td style={{ padding: "2px 0" }}>{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <div style={{ maxWidth: 640, fontSize: 14, opacity: 0.85, textAlign: "center" }}>
        {HOW_TO_WIN.map((line) => (
          <p key={line} style={{ margin: "4px 0" }}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
