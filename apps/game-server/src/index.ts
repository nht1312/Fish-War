import { advanceClock, DEFAULT_CONFIG, parseClientMessage } from "@fishwar/game-core";
import type { Role, ServerMessage } from "@fishwar/game-types";
import { WebSocketServer, type WebSocket } from "ws";

import {
  createRoom,
  joinRoom,
  leaveRoom,
  receiveInput,
  requestRematch,
  snapshotFor,
  tickRoom,
} from "./room";

// Authoritative game server (CLAUDE.md section 8): clients send intent, the
// server runs stepMatch and sends every seat the resulting state each tick.
// All room rules live in room.ts; this file only wires sockets and the clock.

const DEFAULT_PORT = 8080;
const MS_PER_SECOND = 1000;

function send(socket: WebSocket | undefined, message: ServerMessage): void {
  if (socket && socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
}

function main(): void {
  const config = DEFAULT_CONFIG;
  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  const tickDt = 1 / config.tickRate;
  const sockets = new Map<Role, WebSocket>();
  let room = createRoom();

  const wss = new WebSocketServer({ port });

  wss.on("connection", (socket) => {
    const joined = joinRoom(room, config);
    if (joined.role === null) {
      send(socket, { type: "room-full" });
      socket.close();
      return;
    }
    const role = joined.role;
    room = joined.room;
    sockets.set(role, socket);
    send(socket, { type: "welcome", role });
    if (!room.match) send(socket, { type: "waiting" });
    console.log(`[game-server] ${role} joined`);

    socket.on("message", (data) => {
      const message = parseClientMessage(data.toString(), role);
      if (message?.type === "input") room = receiveInput(room, role, message.seq, message.input);
      if (message?.type === "rematch") room = requestRematch(room, config);
    });

    socket.on("close", () => {
      room = leaveRoom(room, role);
      sockets.delete(role);
      for (const other of sockets.values()) {
        send(other, { type: "opponent-left" });
        send(other, { type: "waiting" });
      }
      console.log(`[game-server] ${role} left`);
    });
  });

  // Fixed-timestep loop: the timer only wakes us up; advanceClock decides how
  // many ticks are due, so timer jitter does not change game speed.
  let accumulator = 0;
  let last = performance.now();
  setInterval(() => {
    const now = performance.now();
    const clock = advanceClock(
      accumulator,
      (now - last) / MS_PER_SECOND,
      tickDt,
      config.maxTicksPerFrame,
    );
    last = now;
    accumulator = clock.accumulator;
    if (clock.ticks === 0) return;

    for (let i = 0; i < clock.ticks; i++) room = tickRoom(room, config, tickDt);
    for (const [seat, socket] of sockets) {
      const snapshot = snapshotFor(room, seat);
      if (snapshot) send(socket, snapshot);
    }
  }, MS_PER_SECOND * tickDt);

  console.log(`[game-server] listening on ws://localhost:${port} at ${config.tickRate} ticks/s`);
}

main();
