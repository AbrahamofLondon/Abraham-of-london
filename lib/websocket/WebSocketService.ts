// lib/websocket/WebSocketService.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface WebSocketOptions {
  debug?: boolean;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
}

export type WebSocketMessage = {
  type: string;
  data?: any;
  timestamp?: string;
};

export type WebSocketEvent = 
  | 'connected' 
  | 'disconnected' 
  | 'error' 
  | 'message' 
  | 'reconnecting';

export class WebSocketService {
  private url: string;
  private ws: WebSocket | null = null;
  private options: Required<WebSocketOptions>;
  private reconnectCount = 0;
  private heartbeatIntervalId?: NodeJS.Timeout;
  private eventListeners: Map<WebSocketEvent, Set<(data?: any) => void>> = new Map();
  private messageHandlers: Set<(message: WebSocketMessage) => void> = new Set();
  private isManualClose = false;

  constructor(url: string, options: WebSocketOptions = {}) {
    this.url = url;
    this.options = {
      debug: options.debug ?? false,
      autoConnect: options.autoConnect ?? true,
      reconnectAttempts: options.reconnectAttempts ?? 5,
      reconnectInterval: options.reconnectInterval ?? 3000,
      heartbeatInterval: options.heartbeatInterval ?? 30000,
    };

    if (this.options.autoConnect) {
      this.connect();
    }
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log('WebSocket already connected');
      return;
    }

    this.isManualClose = false;
    
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (error) {
      this.handleError('Failed to create WebSocket connection:', error);
    }
  }

  disconnect(): void {
    this.isManualClose = true;
    this.clearHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.reconnectCount = 0;
  }

  send(message: WebSocketMessage): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        const messageWithTimestamp = {
          ...message,
          timestamp: new Date().toISOString(),
        };
        this.ws.send(JSON.stringify(messageWithTimestamp));
        return true;
      } catch (error) {
        this.handleError('Failed to send message:', error);
        return false;
      }
    } else {
      this.log('WebSocket not connected, cannot send message');
      return false;
    }
  }

  onMessage(handler: (message: WebSocketMessage) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  on(event: WebSocketEvent, handler: (data?: any) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
    return () => this.eventListeners.get(event)?.delete(handler);
  }

  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = (event) => {
      this.log('WebSocket connected');
      this.reconnectCount = 0;
      this.startHeartbeat();
      this.emit('connected', event);
    };

    this.ws.onclose = (event) => {
      this.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
      this.clearHeartbeat();
      this.emit('disconnected', event);

      if (!this.isManualClose && this.reconnectCount < this.options.reconnectAttempts) {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = (event) => {
      this.handleError('WebSocket error:', event);
      this.emit('error', event);
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.log('Received message:', message);
        
        // Handle heartbeat response
        if (message.type === 'pong') {
          this.log('Heartbeat received');
          return;
        }

        // Call all message handlers
        this.messageHandlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error('Error in message handler:', error);
          }
        });

        this.emit('message', message);
      } catch (error) {
        this.handleError('Failed to parse message:', error, event.data);
      }
    };
  }

  private attemptReconnect(): void {
    this.reconnectCount++;
    this.log(`Attempting to reconnect (${this.reconnectCount}/${this.options.reconnectAttempts})...`);
    
    this.emit('reconnecting', {
      attempt: this.reconnectCount,
      maxAttempts: this.options.reconnectAttempts,
    });

    setTimeout(() => {
      if (!this.isManualClose) {
        this.connect();
      }
    }, this.options.reconnectInterval);
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    
    this.heartbeatIntervalId = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
      }
    }, this.options.heartbeatInterval);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = undefined;
    }
  }

  private emit(event: WebSocketEvent, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in ${event} event listener:`, error);
        }
      });
    }
  }

  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log(`[WebSocketService]`, ...args);
    }
  }

  private handleError(message: string, ...args: any[]): void {
    console.error(`[WebSocketService] ${message}`, ...args);
  }
}

export default WebSocketService;