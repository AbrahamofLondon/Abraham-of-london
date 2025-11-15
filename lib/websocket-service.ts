// lib/websocket-service.ts
import { useState, useEffect, useRef } from 'react';

type MessageHandler = (data: unknown) => void;
type EventType = 'connected' | 'disconnected' | 'error' | 'message';

export class WebSocketService {
  private url: string;
  private ws: WebSocket | null = null;
  private handlers: Map<EventType, MessageHandler[]> = new Map();
  private autoConnect: boolean;
  private debug: boolean;
  private connectionStatus: boolean = false;

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
        this.connectionStatus = true;
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
        this.connectionStatus = false;
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
      this.connectionStatus = false;
    }
  }

  isConnected(): boolean {
    return this.connectionStatus && this.ws?.readyState === WebSocket.OPEN;
  }
}

export type WebSocketMessage = {
  type: string;
  data?: Record<string, unknown>;
};

// React hook for WebSocket status
export function useWebSocketStatus(): boolean {
  const [isConnected, setIsConnected] = useState(false);
  const serviceRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    // This is a simplified hook that tracks connection status
    // In a real implementation, you'd want to connect to an actual WebSocketService instance
    // For now, it simulates connection status
    
    // Simulate connection status changes for demo purposes
    const interval = setInterval(() => {
      // Randomly change connection status for demo
      if (Math.random() > 0.7) {
        setIsConnected(prev => !prev);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return isConnected;
}

// Alternative hook that works with a specific WebSocketService instance
export function useWebSocketStatusForService(service: WebSocketService | null): boolean {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!service) {
      setIsConnected(false);
      return;
    }

    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);

    const unsubscribeConnected = service.on('connected', handleConnected);
    const unsubscribeDisconnected = service.on('disconnected', handleDisconnected);

    // Set initial state
    setIsConnected(service.isConnected());

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
    };
  }, [service]);

  return isConnected;
}