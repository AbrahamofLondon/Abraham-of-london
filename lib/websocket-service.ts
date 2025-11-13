type MessageHandler = (data: unknown) => void;

export class WebSocketService {
  private url: string;
  private ws: WebSocket | null = null;
  private onMessage: MessageHandler | null = null;

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    if (typeof window === "undefined" || typeof WebSocket === "undefined") return;
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (ev) => {
      const data = (() => {
        try { return JSON.parse(String(ev.data)); } catch { return ev.data; }
      })();
      if (this.onMessage) this.onMessage(data);
    };
  }

  send(payload: unknown): void {
    if (!this.ws || this.ws.readyState !== 1) return;
    this.ws.send(typeof payload === "string" ? payload : JSON.stringify(payload));
  }

  subscribe(handler: MessageHandler): void {
    this.onMessage = handler;
  }

  close(): void {
    if (this.ws) this.ws.close();
    this.ws = null;
  }
}