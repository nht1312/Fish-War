import { DEFAULT_CONFIG } from "@fishwar/game-core";

import { resolveServerUrl } from "../net/serverUrl";
import { createRemoteSession } from "../net/remoteSession";
import { createSimRunner, type SimRunner } from "./simRunner";

/** Offline: two players on one keyboard. Online: one player per client, via the server. */
export type GameMode = "offline" | "online";

/** Create the session for the chosen mode. Browser-only. */
export function createSession(mode: GameMode): SimRunner {
  if (mode === "offline") return createSimRunner(DEFAULT_CONFIG);
  const url = resolveServerUrl(process.env.NEXT_PUBLIC_GAME_SERVER_URL, window.location);
  return createRemoteSession(DEFAULT_CONFIG, url);
}
