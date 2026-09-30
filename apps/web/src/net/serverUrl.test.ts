import { describe, expect, it } from "vitest";

import { resolveServerUrl } from "./serverUrl";

describe("resolveServerUrl", () => {
  it("uses the configured URL when there is one", () => {
    expect(resolveServerUrl("ws://game.example:9000", { protocol: "http:", hostname: "x" })).toBe(
      "ws://game.example:9000",
    );
  });

  it("defaults to port 8080 on the host that served the page", () => {
    expect(resolveServerUrl(undefined, { protocol: "http:", hostname: "192.168.1.9" })).toBe(
      "ws://192.168.1.9:8080",
    );
  });

  it("uses wss for pages served over https", () => {
    expect(resolveServerUrl("", { protocol: "https:", hostname: "fish.war" })).toBe(
      "wss://fish.war:8080",
    );
  });
});
