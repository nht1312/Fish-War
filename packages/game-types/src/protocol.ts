import type { FishermanInput, FishInput, MatchState, Role } from "./index";

/**
 * Wire protocol between the browser and the authoritative game server. JSON
 * over WebSocket. The client only ever sends its own intent; the server sends
 * the authoritative match state.
 */

/** Client → server. */
export type ClientMessage =
  | {
      readonly type: "input";
      /** Increases with every input the client sends; lets the server drop stale ones. */
      readonly seq: number;
      readonly input: FishInput | FishermanInput;
    }
  /** After a match has ended: start a new one. */
  | { readonly type: "rematch" };

/** Server → client. */
export type ServerMessage =
  /** You have a seat and play this role. */
  | { readonly type: "welcome"; readonly role: Role }
  /** You have a seat; the other one is still empty. */
  | { readonly type: "waiting" }
  /** Both seats are taken. */
  | { readonly type: "room-full" }
  | {
      readonly type: "snapshot";
      readonly state: MatchState;
      /** Highest input seq from you that the server has applied. */
      readonly ackSeq: number;
    }
  /** The other player disconnected; the match was discarded. */
  | { readonly type: "opponent-left" };
