// src/lib/websocket-service.ts
import { useEffect, useState } from "react";

export type WebSocketEvent =
  | "connected"
  | "disconnected"
  | "error"
  | "tick"
  | "pong"
  | "message";

export type WebSocketMessage = {
  type: string;
  data?: Record<string, unknown>;
};

type Subscriber = (data: WebSocketMessage) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private isOpen = false;
  private subscribers = new Map<string, Subscriber[]>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 seconds

  constructor(
    private url: string,
    private opts: {
      debug?: boolean;
      autoConnect?: boolean;
      maxReconnectAttempts?: number;
    } = {}
  ) {
    if (opts.maxReconnectAttempts) {
      this.maxReconnectAttempts = opts.maxReconnectAttempts;
    }
    if (opts.autoConnect) this.connect();
  }

  connect() {
    if (this.isOpen || this.socket) return;

    try {
      this.socket = new WebSocket(this.url);

      this.socket.addEventListener("open", () => {
        this.isOpen = true;
        this.reconnectAttempts = 0; // Reset on successful connection
        this.emit({ type: "connected", data: {} });
        if (this.opts.debug) console.log("WebSocket connected");
      });

      this.socket.addEventListener("close", () => {
        this.isOpen = false;
        this.emit({ type: "disconnected", data: {} });

        // Auto-reconnect logic
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, this.reconnectInterval);
        }
      });

      this.socket.addEventListener("error", (ev) => {
        this.emit({ type: "error", data: { event: ev } });
        if (this.opts.debug) console.error("WebSocket error:", ev);
      });

      this.socket.addEventListener("message", (ev) => {
        this.handleMessage(ev);
      });
    } catch (error) {
      this.emit({ type: "error", data: { error } });
    }
  }

  private handleMessage(ev: MessageEvent) {
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
  }

  disconnect() {
    this.reconnectAttempts = this.maxReconnectAttempts; // Stop reconnection
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

    // Return unsubscribe function
    return () => {
      const arr = this.subscribers.get(key) ?? [];
      const idx = arr.indexOf(cb);
      if (idx >= 0) arr.splice(idx, 1);
      this.subscribers.set(key, arr);
    };
  }

  // Convenience wrapper matching your component's call-site
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
    } else {
      if (this.opts.debug)
        console.warn("WebSocket not connected, cannot send message");
    }
  }

  getConnectionStatus(): boolean {
    return this.isOpen;
  }

  private emit(message: WebSocketMessage) {
    const list = this.subscribers.get(message.type) ?? [];
    for (const cb of list) {
      try {
        cb(message);
      } catch (err) {
        console.error("Error in WebSocket subscriber:", err);
        // isolate bad subscribers
      }
    }
  }
}

// Optional singleton if you need a shared bus elsewhere
export const ws = new WebSocketService(
  process.env.NEXT_PUBLIC_WS_URL || "wss://echo.websocket.org", // Using public echo server for demo
  {
    debug: process.env.NODE_ENV === "development",
    autoConnect: false, // Let components control when to connect
    maxReconnectAttempts: 5,
  }
);

// React hook for connection status
export function useWebSocketStatus(): boolean {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const unsubscribeConnected = ws.on("connected", () => {
      setConnected(true);
    });

    const unsubscribeDisconnected = ws.on("disconnected", () => {
      setConnected(false);
    });

    // Connect when component mounts
    if (!ws.getConnectionStatus()) {
      ws.connect();
    }

    // Cleanup on unmount
    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      // Note: We don't disconnect here to allow connection sharing
      // between components. Connection lifecycle should be managed
      // at the application level.
    };
  }, []);

  return connected;
}

// Additional utility hook for receiving messages
export function useWebSocketMessages(
  eventType?: string
): WebSocketMessage[] {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  useEffect(() => {
    const messageHandler = (message: WebSocketMessage) => {
      if (!eventType || message.type === eventType) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const unsubscribe = ws.onMessage(messageHandler);

    return unsubscribe;
  }, [eventType]);

  return messages;
}

// Create named export for the class
const WebSocketServiceClass = WebSocketService;

export default WebSocketServiceClass; 