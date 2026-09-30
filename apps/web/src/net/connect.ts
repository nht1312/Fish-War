/** Callbacks from a server connection. */
export interface ConnectionHandlers {
  onMessage(data: string): void;
  onClose(): void;
}

export interface Connection {
  send(data: string): void;
  close(): void;
}

/** Opens a connection. Injected so session logic can be tested without sockets. */
export type Connect = (url: string, handlers: ConnectionHandlers) => Connection;

/** The real thing: a browser WebSocket. Messages sent before it opens are dropped. */
export const browserConnect: Connect = (url, handlers) => {
  const socket = new WebSocket(url);
  socket.onmessage = (event) => {
    if (typeof event.data === "string") handlers.onMessage(event.data);
  };
  socket.onclose = () => handlers.onClose();
  return {
    send(data) {
      if (socket.readyState === WebSocket.OPEN) socket.send(data);
    },
    close: () => socket.close(),
  };
};
