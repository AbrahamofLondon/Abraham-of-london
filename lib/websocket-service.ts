/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-anonymous-default-export */
// lib/websocket-service.ts

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface WebSocketConfig {
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  timeout?: number;
  debug?: boolean;
  autoConnect?: boolean;
}

export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
  timestamp: number;
  id?: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  lastMessageTime: number;
  timeSinceLastMessage: number;
  connectionQuality: "excellent" | "good" | "poor" | "disconnected";
}

export type WebSocketEvent =
  | "connected"
  | "disconnected"
  | "message"
  | "error"
  | "reconnecting"
  | "heartbeat";

export type WebSocketEventListener<T = any> = (data: T) => void;

// =============================================================================
// WEB SOCKET SERVICE
// =============================================================================

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private heartbeatInterval: number;
  private timeout: number;
  private debug: boolean;
  private autoConnect: boolean;

  private eventListeners: Map<WebSocketEvent, WebSocketEventListener[]> =
    new Map();
  private messageCallbacks: Map<string, WebSocketEventListener[]> = new Map();

  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionTimer: NodeJS.Timeout | null = null;

  private isConnected = false;
  private isConnecting = false;
  private lastMessageTime = 0;
  private connectionStartTime = 0;

  constructor(
    private url: string,
    config: WebSocketConfig = {},
  ) {
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? 5;
    this.reconnectDelay = config.reconnectDelay ?? 1000;
    this.heartbeatInterval = config.heartbeatInterval ?? 30000;
    this.timeout = config.timeout ?? 5000;
    this.debug = config.debug ?? false;
    this.autoConnect = config.autoConnect ?? true;

    if (this.autoConnect) {
      setTimeout(() => this.connect(), 0);
    }
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  async connect(): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      this.debugLog("Connection already established or in progress");
      return;
    }

    this.isConnecting = true;
    this.connectionStartTime = Date.now();

    this.debugLog(`Connecting to ${this.url}...`);

    return new Promise((resolve, reject) => {
      try {
        this.cleanup();

        this.ws = new WebSocket(this.url);

        // Setup connection timeout
        this.connectionTimer = setTimeout(() => {
          if (!this.isConnected) {
            this.handleConnectionError(new Error("Connection timeout"));
            reject(new Error("Connection timeout"));
          }
        }, this.timeout);

        this.ws.onopen = () => {
          this.debugLog("WebSocket connected");
          this.handleConnectionSuccess();
          resolve();
        };

        this.ws.onerror = (event) => {
          this.debugLog("WebSocket error:", event);
          this.handleConnectionError(new Error("WebSocket connection error"));
          reject(new Error("WebSocket connection error"));
        };

        this.ws.onclose = (event) => {
          this.debugLog("WebSocket disconnected:", event.code, event.reason);
          this.handleDisconnection(event);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };
      } catch (error) {
        this.isConnecting = false;
        this.handleConnectionError(error as Error);
        reject(error);
      }
    });
  }

  send<T = any>(message: T): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const messageStr =
        typeof message === "string" ? message : JSON.stringify(message);
      this.ws.send(messageStr);
      this.debugLog("Message sent:", message);
    } else {
      throw new Error("WebSocket is not connected");
    }
  }

  sendTyped<T = any>(type: string, data: T): void {
    const message: WebSocketMessage<T> = {
      type,
      data,
      timestamp: Date.now(),
      id: this.generateMessageId(),
    };
    this.send(message);
  }

  onMessage<T = any>(
    callback: (data: WebSocketMessage<T>) => void,
  ): () => void {
    return this.addEventListener("message", callback);
  }

  onMessageType<T = any>(
    type: string,
    callback: (data: T) => void,
  ): () => void {
    if (!this.messageCallbacks.has(type)) {
      this.messageCallbacks.set(type, []);
    }

    const callbacks = this.messageCallbacks.get(type)!;
    callbacks.push(callback);

    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  on<T = any>(
    event: WebSocketEvent,
    callback: WebSocketEventListener<T>,
  ): () => void {
    return this.addEventListener(event, callback);
  }

  private addEventListener<T = any>(
    event: WebSocketEvent,
    callback: WebSocketEventListener<T>,
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    const listeners = this.eventListeners.get(event)!;
    listeners.push(callback as WebSocketEventListener);

    return () => {
      const index = listeners.indexOf(callback as WebSocketEventListener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  private emitEvent<T = any>(event: WebSocketEvent, data: T): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in WebSocket event listener for ${event}:`, error);
      }
    });
  }

  disconnect(code?: number, reason?: string): void {
    this.debugLog("Disconnecting WebSocket...");

    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    this.cleanup();

    if (this.ws) {
      this.ws.close(code || 1000, reason || "Normal closure");
      this.ws = null;
    }

    this.emitEvent("disconnected", this.getStatus());
  }

  getStatus(): ConnectionStatus {
    const timeSinceLastMessage = Date.now() - this.lastMessageTime;

    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      lastMessageTime: this.lastMessageTime,
      timeSinceLastMessage,
      connectionQuality: this.calculateConnectionQuality(timeSinceLastMessage),
    };
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private handleConnectionSuccess(): void {
    this.isConnecting = false;
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.lastMessageTime = Date.now();

    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }

    this.startHeartbeat();
    this.emitEvent("connected", this.getStatus());
  }

  private handleConnectionError(error: Error): void {
    this.debugLog("Connection error:", error.message);

    this.isConnected = false;
    this.isConnecting = false;

    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }

    this.emitEvent("error", error);
    this.handleReconnection();
  }

  private handleDisconnection(event: CloseEvent): void {
    this.isConnected = false;
    this.isConnecting = false;

    // Don't reconnect if it was a normal closure
    if (event.code !== 1000) {
      this.handleReconnection();
    }

    this.emitEvent("disconnected", this.getStatus());
  }

  private handleMessage(event: MessageEvent): void {
    this.lastMessageTime = Date.now();

    try {
      const data =
        typeof event.data === "string" ? JSON.parse(event.data) : event.data;

      // Emit generic message event
      this.emitEvent("message", data);

      // Emit type-specific callbacks if message has a type
      if (data.type && this.messageCallbacks.has(data.type)) {
        const callbacks = this.messageCallbacks.get(data.type)!;
        callbacks.forEach((callback) => {
          try {
            callback(data.data || data);
          } catch (error) {
            console.error(
              `Error in message callback for type ${data.type}:`,
              error,
            );
          }
        });
      }

      this.debugLog("Message received:", data);
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
      this.emitEvent("error", new Error("Failed to parse WebSocket message"));
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.calculateReconnectDelay();

      this.debugLog(
        `Attempting to reconnect in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      );

      this.emitEvent("reconnecting", {
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
        delay,
      });

      this.reconnectTimer = setTimeout(() => {
        if (!this.isConnected) {
          this.connect().catch(() => {
            // Reconnection will be handled by the exponential backoff
          });
        }
      }, delay);
    } else {
      const error = new Error("Max reconnection attempts reached");
      this.debugLog(error.message);
      this.emitEvent("error", error);
    }
  }

  private calculateReconnectDelay(): number {
    // Exponential backoff with jitter
    const baseDelay =
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    const jitter = baseDelay * 0.1 * Math.random();
    return Math.min(baseDelay + jitter, 30000); // Cap at 30 seconds
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval <= 0) return;

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        const timeSinceLastMessage = Date.now() - this.lastMessageTime;

        // Check if we haven't received messages for too long
        if (timeSinceLastMessage > this.heartbeatInterval * 2) {
          this.handleConnectionError(new Error("Heartbeat timeout"));
          return;
        }

        // Send heartbeat if needed (optional - depends on your server)
        // this.send({ type: 'heartbeat', timestamp: Date.now() });

        this.emitEvent("heartbeat", {
          timeSinceLastMessage,
          connectionQuality:
            this.calculateConnectionQuality(timeSinceLastMessage),
        });

        this.debugLog("Heartbeat check", {
          timeSinceLastMessage,
          quality: this.calculateConnectionQuality(timeSinceLastMessage),
        });
      }
    }, this.heartbeatInterval);
  }

  private calculateConnectionQuality(
    timeSinceLastMessage: number,
  ): ConnectionStatus["connectionQuality"] {
    if (timeSinceLastMessage < 5000) return "excellent";
    if (timeSinceLastMessage < 15000) return "good";
    if (timeSinceLastMessage < 30000) return "poor";
    return "disconnected";
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanup(): void {
    // Clear all timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  private debugLog(...args: unknown[]): void {
    if (this.debug) {
      console.log(`[WebSocket]`, ...args);
    }
  }
}

// =============================================================================
// WEB SOCKET MANAGER
// =============================================================================

export class WebSocketManager {
  private connections: Map<string, WebSocketService> = new Map();
  private config: WebSocketConfig;

  constructor(config: WebSocketConfig = {}) {
    this.config = config;
  }

  getConnection(url: string): WebSocketService {
    if (!this.connections.has(url)) {
      const connection = new WebSocketService(url, {
        ...this.config,
        debug: this.config.debug ?? process.env.NODE_ENV === "development",
      });

      this.connections.set(url, connection);
    }

    return this.connections.get(url)!;
  }

  disconnect(url: string): void {
    const connection = this.connections.get(url);

    if (connection) {
      connection.disconnect();
      this.connections.delete(url);
    }
  }

  disconnectAll(): void {
    this.connections.forEach((connection, url) => {
      connection.disconnect();
    });
    this.connections.clear();
  }

  getStatus(): { [url: string]: ConnectionStatus } {
    const status: { [url: string]: ConnectionStatus } = {};

    this.connections.forEach((connection, url) => {
      status[url] = connection.getStatus();
    });

    return status;
  }
}

// =============================================================================
// REACT HOOK
// =============================================================================

import { useEffect, useRef, useState } from '...';

export function useWebSocket(url: string, config?: WebSocketConfig) {
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const serviceRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    const service = new WebSocketService(url, {
      autoConnect: true,
      ...config,
    });
    serviceRef.current = service;

    // Subscribe to messages
    const unsubscribeMessage = service.onMessage((message) => {
      setData(message);
    });

    // Subscribe to status changes
    const unsubscribeConnected = service.on("connected", (newStatus) => {
      setStatus(newStatus);
      setError(null);
    });

    const unsubscribeDisconnected = service.on("disconnected", (newStatus) => {
      setStatus(newStatus);
    });

    // Subscribe to errors
    const unsubscribeError = service.on("error", (error) => {
      setError(error);
      setStatus(service.getStatus());
    });

    // Subscribe to reconnecting
    const unsubscribeReconnecting = service.on("reconnecting", () => {
      setStatus(service.getStatus());
    });

    // Get initial status
    setStatus(service.getStatus());

    return () => {
      unsubscribeMessage();
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeError();
      unsubscribeReconnecting();
      service.disconnect();
    };
  }, [url, config]);

  const send = (message: unknown) => {
    if (serviceRef.current) {
      serviceRef.current.send(message);
    } else {
      throw new Error("WebSocket service not initialized");
    }
  };

  const sendTyped = (type: string, data: unknown) => {
    if (serviceRef.current) {
      serviceRef.current.sendTyped(type, data);
    } else {
      throw new Error("WebSocket service not initialized");
    }
  };

  const connect = () => {
    if (serviceRef.current) {
      return serviceRef.current.connect();
    }
  };

  const disconnect = () => {
    if (serviceRef.current) {
      serviceRef.current.disconnect();
    }
  };

  return {
    data,
    status,
    error,
    send,
    sendTyped,
    connect,
    disconnect,
    isConnected: status?.isConnected ?? false,
    isConnecting: status?.isConnecting ?? false,
  };
}

// =============================================================================
// DEFAULT EXPORT & SINGLETON
// =============================================================================

export const webSocketManager = new WebSocketManager({
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  heartbeatInterval: 30000,
  timeout: 5000,
  debug: process.env.NODE_ENV === "development",
});

export default WebSocketService;
