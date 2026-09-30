/** The game server's port when no URL is configured (matches the server's default). */
const DEFAULT_SERVER_PORT = 8080;

export interface PageLocation {
  readonly protocol: string;
  readonly hostname: string;
}

/**
 * The game server URL: the configured one if set, otherwise the default port on
 * the host that served the page (so a second machine on the LAN finds it too).
 */
export function resolveServerUrl(configured: string | undefined, page: PageLocation): string {
  if (configured) return configured;
  const scheme = page.protocol === "https:" ? "wss" : "ws";
  return `${scheme}://${page.hostname}:${DEFAULT_SERVER_PORT}`;
}
