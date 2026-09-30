import { opponentOf } from "@fishwar/game-core";
import type { Role } from "@fishwar/game-types";
import { WebSocketServer } from "ws";

// Authoritative game server (see CLAUDE.md section 8). For project init this is
// only a bootable WebSocket endpoint that exercises the workspace wiring; real
// intent handling and the authoritative simulation land in later steps.

const PORT = Number(process.env.PORT ?? 8080);

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (socket) => {
  console.log("[game-server] client connected");

  socket.on("message", (data) => {
    // Placeholder echo. The client is never trusted for game state; this will
    // be replaced by validated intent handling.
    socket.send(data.toString());
  });

  socket.on("close", () => {
    console.log("[game-server] client disconnected");
  });
});

// Touch shared gameplay code so the cross-package build is exercised.
const sanityRole: Role = "fish";
console.log(
  `[game-server] listening on ws://localhost:${PORT} ` +
    `(sanity: opponent of ${sanityRole} is ${opponentOf(sanityRole)})`,
);
