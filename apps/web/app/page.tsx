import { ROLES } from "@fishwar/game-types";

export default function HomePage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>Fish War</h1>
      <p>1v1 asymmetric multiplayer fishing battle.</p>
      <p>Roles: {ROLES.join(" vs ")}</p>
    </main>
  );
}
