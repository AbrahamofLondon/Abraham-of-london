// src/lib/websocket-service.ts
import { useEffect, useState } from "react";

export type WebSocketEvent =
  | "connected"
  | "disconnected"
  | "error"
  | "tick"
  | "pong"
  | "message";

/**
 * Widened so it can carry any domain-specific event:
 * - "price_update"
 * - "chat_message"
 * - "user_joined"
 * - "subscribe"/"unsubscribe"
 * - etc.
 */
export type WebSocketMessage = {
  type: string;
  data?: Record<string, unknown>;
};

type Subscriber = (data: WebSocketMessage) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private isOpen = false;
  // was: new Map<WebSocketEvent | "price_update", Subscriber[]>();
  private subscribers = new Map<string, Subscriber[]>();

  constructor(
    private url: string,
    private opts: { debug?: boolean; autoConnect?: boolean } = {}
  ) {
    if (opts.autoConnect) this.connect();
  }

  connect() {
    if (this.isOpen || this.socket) return;
    this.socket = new WebSocket(this.url);

    this.socket.addEventListener("open", () => {
      this.isOpen = true;
      this.emit({ type: "connected", data: {} });
    });

    this.socket.addEventListener("close", () => {
      this.isOpen = false;
      this.emit({ type: "disconnected", data: {} });
    });

    this.socket.addEventListener("error", (ev) => {
      this.emit({ type: "error", data: { event: ev } });
    });

    this.socket.addEventListener("message", (ev) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(ev.data));
      } catch {
        // non-JSON payloads
      }

      if (parsed && typeof parsed === "object" && "type" in (parsed as any)) {
        const msg = parsed as WebSocketMessage;
        // Emit the specific event and also generic "message"
        this.emit(msg);
        this.emit({ type: "message", data: msg.data ?? {} });
      } else {
        this.emit({ type: "message", data: { raw: ev.data } });
      }
    });
  }

  disconnect() {
    try {
      this.socket?.close();
    } catch {
      // ignore
    }
    this.socket = null;
    this.isOpen = false;
  }

  on(event: WebSocketEvent | string, cb: Subscriber): () => void {
    const key = event as string;
    const list = this.subscribers.get(key) ?? [];
    list.push(cb);
    this.subscribers.set(key, list);
    return () => {
      const arr = this.subscribers.get(key) ?? [];
      const idx = arr.indexOf(cb);
      if (idx >= 0) arr.splice(idx, 1);
      this.subscribers.set(key, arr);
    };
  }

  // Convenience wrapper matching your component’s call-site
  onMessage(cb: Subscriber): () => void {
    return this.on("message", cb);
  }

  send(message: WebSocketMessage) {
    if (this.isOpen && this.socket) {
      try {
        this.socket.send(JSON.stringify(message));
      } catch (err) {
        this.emit({ type: "error", data: { error: err } });
      }
    }
  }

  private emit(message: WebSocketMessage) {
    const list = this.subscribers.get(message.type) ?? [];
    for (const cb of list) {
      try {
        cb(message);
      } catch {
        // isolate bad subscribers
      }
    }
  }
}

// Optional singleton if you need a shared bus elsewhere
export const ws = new WebSocketService(
  process.env.NEXT_PUBLIC_WS_URL || "wss://example.com/ws"
);

export function useWebSocketStatus() {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const offC = ws.on("connected", () => setConnected(true));
    const offD = ws.on("disconnected", () => setConnected(false));
    ws.connect();
    return () => {
      offC();
      offD();
      ws.disconnect();
    };
  }, []);
  return connected;
}