import { DEFAULT_CONFIG } from "@fishwar/game-core";

import { resolveServerUrl } from "../net/serverUrl";
import { createRemoteSession } from "../net/remoteSession";
import { createSimRunner, type SimRunner } from "./simRunner";

/** `/?online` plays through the game server; plain `/` is offline hot-seat. */
const ONLINE_QUERY_FLAG = "online";

/** Pick the session for this page: online or offline. Browser-only. */
export function createSession(): SimRunner {
  const online = new URLSearchParams(window.location.search).has(ONLINE_QUERY_FLAG);
  if (!online) return createSimRunner(DEFAULT_CONFIG);
  const url = resolveServerUrl(process.env.NEXT_PUBLIC_GAME_SERVER_URL, window.location);
  return createRemoteSession(DEFAULT_CONFIG, url);
}
