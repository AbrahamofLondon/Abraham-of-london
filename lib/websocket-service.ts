// lib/websocket-service.ts
type MessageHandler = (data: unknown) => void;
type EventType = 'connected' | 'disconnected' | 'error' | 'message';

export class WebSocketService {
  private url: string;
  private ws: WebSocket | null = null;
  private handlers: Map<EventType, MessageHandler[]> = new Map();
  private autoConnect: boolean;
  private debug: boolean;

  constructor(url: string, options: { autoConnect?: boolean; debug?: boolean } = {}) {
    this.url = url;
    this.autoConnect = options.autoConnect ?? true;
    this.debug = options.debug ?? false;
    
    if (this.autoConnect) {
      this.connect();
    }
  }

  connect(): void {
    if (typeof window === "undefined" || typeof WebSocket === "undefined") return;
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        if (this.debug) console.log('WebSocket connected');
        this.emit('connected', null);
      };

      this.ws.onmessage = (ev) => {
        const data = (() => {
          try { return JSON.parse(String(ev.data)); } catch { return ev.data; }
        })();
        if (this.debug) console.log('WebSocket message:', data);
        this.emit('message', data);
      };

      this.ws.onerror = (error) => {
        if (this.debug) console.error('WebSocket error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        if (this.debug) console.log('WebSocket disconnected');
        this.emit('disconnected', null);
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.emit('error', error);
    }
  }

  send(payload: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }
    this.ws.send(typeof payload === "string" ? payload : JSON.stringify(payload));
  }

  on(event: EventType, handler: MessageHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  private emit(event: EventType, data: unknown): void {
    const handlers = this.handlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in WebSocket ${event} handler:`, error);
      }
    });
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export type WebSocketMessage = {
  type: string;
  data?: Record<string, unknown>;
};