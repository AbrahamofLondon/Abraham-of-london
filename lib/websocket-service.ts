// lib/websocket-service.ts
import { useEffect, useState } from "react";

export type WebSocketEvent =
  | "connected"
  | "disconnected"
  | "error"
  | "tick"
  | "pong"
  | "message"
  | "subscribe"   
  | "unsubscribe";

export type WebSocketMessage = {
  type: WebSocketEvent | "price_update";
  data?: Record<string, unknown>;
};

type Subscriber = (data: WebSocketMessage) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private isOpen = false;
  private subscribers = new Map<WebSocketEvent | "price_update" | "message", Subscriber[]>();

  constructor(
    private url: string,
    private opts: { debug?: boolean; autoConnect?: boolean } = {}
  ) {
    if (opts.autoConnect) this.connect();
  }

  connect(): void {
    if (typeof window === "undefined") return;
    if (this.isOpen || this.socket) return;

    const ws = new WebSocket(this.url);
    this.socket = ws;

    ws.addEventListener("open", () => {
      this.isOpen = true;
      if (this.opts.debug) console.log("[WebSocket] connected");
      this.emit({ type: "connected", data: {} });
    });

    ws.addEventListener("close", () => {
      this.isOpen = false;
      if (this.opts.debug) console.log("[WebSocket] disconnected");
      this.emit({ type: "disconnected", data: {} });
    });

    ws.addEventListener("error", (ev) => {
      if (this.opts.debug) console.error("[WebSocket] error", ev);
      this.emit({ type: "error", data: { event: ev } });
    });

    ws.addEventListener("message", (ev) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(ev.data));
      } catch {
        // non-JSON payloads
      }

      if (parsed && typeof parsed === "object" && "type" in (parsed as any)) {
        const msg = parsed as WebSocketMessage;
        this.emit(msg);
        this.emit({ type: "message", data: msg.data ?? {} });
      } else {
        this.emit({ type: "message", data: { raw: ev.data } });
      }
    });
  }

  disconnect(): void {
    try {
      this.socket?.close();
    } catch {
      // ignore
    }
    this.socket = null;
    this.isOpen = false;
  }

  on(event: WebSocketEvent | "price_update" | "message", cb: Subscriber): () => void {
    const list = this.subscribers.get(event) ?? [];
    list.push(cb);
    this.subscribers.set(event, list);

    return () => {
      const arr = this.subscribers.get(event) ?? [];
      const idx = arr.indexOf(cb);
      if (idx >= 0) arr.splice(idx, 1);
      this.subscribers.set(event, arr);
    };
  }

  onMessage(cb: Subscriber): () => void {
    return this.on("message", cb);
  }

  send(message: WebSocketMessage): boolean {
    if (this.isOpen && this.socket) {
      try {
        this.socket.send(JSON.stringify(message));
        return true;
      } catch (err) {
        if (this.opts.debug) console.error("[WebSocket] send error", err);
        this.emit({ type: "error", data: { error: err } });
        return false;
      }
    }
    return false;
  }

  private emit(message: WebSocketMessage): void {
    const list = this.subscribers.get(message.type) ?? [];
    for (const cb of list) {
      try {
        cb(message);
      } catch (err) {
        if (this.opts.debug) console.error("[WebSocket] subscriber error", err);
      }
    }
  }
}

export const ws = new WebSocketService(
  process.env.NEXT_PUBLIC_WS_URL || "wss://example.com/ws",
  { autoConnect: false, debug: process.env.NODE_ENV === "development" }
);

export function useWebSocketStatus(): boolean {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const offConnected = ws.on("connected", () => setConnected(true));
    const offDisconnected = ws.on("disconnected", () => setConnected(false));

    ws.connect();

    return () => {
      offConnected();
      offDisconnected();
      ws.disconnect();
    };
  }, []);

  return connected;
}