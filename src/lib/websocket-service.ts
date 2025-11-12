// lib/websocket-service.ts
"use client";

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
  useRealWebSocket?: boolean;
  endpoint?: string;
}

export interface WebSocketMessage {
  type:
    | "price_update"
    | "heartbeat"
    | "connection_status"
    | "error"
    | "trade"
    | "order_book";
  symbol?: string;
  data: unknown;
  timestamp: number;
  id?: string;
  version?: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  symbol: string;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  lastMessageTime: number;
  timeSinceLastMessage: number;
  connectionQuality: "excellent" | "good" | "poor" | "disconnected";
  latency?: number;
}

export interface WebSocketEventMap {
  message: WebSocketMessage;
  connected: ConnectionStatus;
  disconnected: ConnectionStatus;
  error: Error;
  reconnecting: { attempt: number; maxAttempts: number; delay: number };
}

export type WebSocketEvent = keyof WebSocketEventMap;
export type WebSocketEventListener<T extends WebSocketEvent> = (
  data: WebSocketEventMap[T],
) => void;

// =============================================================================
// CONSTANTS & UTILITIES
// =============================================================================

const DEFAULT_CONFIG: Required<Omit<WebSocketConfig, "endpoint">> & {
  endpoint: string;
} = {
  maxReconnectAttempts: 10,
  reconnectDelay: 2000,
  heartbeatInterval: 30000,
  timeout: 5000,
  debug: false,
  autoConnect: true,
  useRealWebSocket: false,
  endpoint: "/api/stocks",
};

const CONNECTION_QUALITY_THRESHOLDS = {
  excellent: 5000,
  good: 15000,
  poor: 30000,
} as const;

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
  private useRealWebSocket: boolean;
  private endpoint: string;

  private subscribers: Map<string, ((data: unknown) => void)[]> = new Map();
  private eventListeners: Map<
    WebSocketEvent,
    WebSocketEventListener<WebSocketEvent>[]
  > = new Map();

  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private dataFetchTimer: NodeJS.Timeout | null = null;

  private isConnected = false;
  private isConnecting = false;
  private lastMessageTime = 0;
  private connectionStartTime = 0;
  private lastLatency = 0;

  constructor(
    private symbol: string,
    config: WebSocketConfig = {},
  ) {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };

    this.maxReconnectAttempts = fullConfig.maxReconnectAttempts;
    this.reconnectDelay = fullConfig.reconnectDelay;
    this.heartbeatInterval = fullConfig.heartbeatInterval;
    this.timeout = fullConfig.timeout;
    this.debug = fullConfig.debug;
    this.autoConnect = fullConfig.autoConnect;
    this.useRealWebSocket = fullConfig.useRealWebSocket;
    this.endpoint = fullConfig.endpoint;

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

    this.debugLog(`Connecting to ${this.symbol}...`);

    try {
      this.cleanup();

      if (this.useRealWebSocket) {
        await this.setupRealWebSocket();
      } else {
        await this.setupEnhancedConnection();
      }

      this.isConnecting = false;
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.lastMessageTime = Date.now();

      this.emitEvent("connected", this.getStatus());
      this.startHeartbeat();

      this.debugLog(`Successfully connected to ${this.symbol}`);
    } catch (error) {
      this.isConnecting = false;
      this.handleConnectionError(error as Error);
      throw error;
    }
  }

  subscribe(
    callback: (data: WebSocketMessage) => void,
    messageType?: string,
  ): () => void {
    const key = messageType || "all";

    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }

    this.subscribers.get(key)!.push(callback);

    return () => {
      const subscribers = this.subscribers.get(key);
      if (subscribers) {
        const index = subscribers.indexOf(callback);
        if (index > -1) {
          subscribers.splice(index, 1);
        }
      }
    };
  }

  on<T extends WebSocketEvent>(
    event: T,
    listener: WebSocketEventListener<T>,
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    this.eventListeners
      .get(event)!
      .push(listener as WebSocketEventListener<WebSocketEvent>);

    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(
          listener as WebSocketEventListener<WebSocketEvent>,
        );
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  async send(message: unknown): Promise<void> {
    if (!this.isConnected) {
      throw new Error("WebSocket not connected");
    }

    if (this.useRealWebSocket && this.ws) {
      this.ws.send(JSON.stringify(message));
    }

    this.debugLog(`Sent message for ${this.symbol}:`, message);
  }

  getStatus(): ConnectionStatus {
    const timeSinceLastMessage = Date.now() - this.lastMessageTime;

    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      symbol: this.symbol,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      lastMessageTime: this.lastMessageTime,
      timeSinceLastMessage,
      connectionQuality: this.calculateConnectionQuality(timeSinceLastMessage),
      latency: this.lastLatency,
    };
  }

  disconnect(): void {
    this.debugLog(`Disconnecting ${this.symbol}`);

    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    this.cleanup();

    this.emitEvent("disconnected", this.getStatus());
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private async setupRealWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // This would be your actual WebSocket endpoint
        const wsUrl = `wss://api.example.com/ws/${this.symbol}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.debugLog(`Real WebSocket connected to ${this.symbol}`);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            this.handleIncomingMessage(message);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onclose = (event) => {
          this.debugLog(
            `WebSocket closed for ${this.symbol}:`,
            event.code,
            event.reason,
          );
          this.handleConnectionError(
            new Error(`WebSocket closed: ${event.code} - ${event.reason}`),
          );
        };

        this.ws.onerror = (error) => {
          this.debugLog(`WebSocket error for ${this.symbol}:`, error);
          reject(new Error("WebSocket connection failed"));
        };

        // Setup connection timeout
        this.connectionTimer = setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error("WebSocket connection timeout"));
          }
        }, this.timeout);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async setupEnhancedConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.debugLog(`Setting up enhanced connection for ${this.symbol}`);

        // Initial data fetch
        this.fetchRealTimeData();

        // Setup periodic data fetching with jitter
        const baseInterval = 2000;
        const jitter = Math.random() * 3000;
        this.dataFetchTimer = setInterval(() => {
          if (this.isConnected) {
            this.fetchRealTimeData();
          }
        }, baseInterval + jitter);

        // Setup connection timeout
        this.connectionTimer = setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error("Connection timeout"));
          }
        }, this.timeout);

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async fetchRealTimeData(): Promise<void> {
    try {
      const startTime = Date.now();
      const response = await fetch(
        `${this.endpoint}/${this.symbol}?_t=${startTime}&_r=${Math.random()}`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.lastMessageTime = Date.now();
      this.lastLatency = Date.now() - startTime;

      const message: WebSocketMessage = {
        type: "price_update",
        symbol: this.symbol,
        data: {
          ...data,
          latency: this.lastLatency,
          serverTimestamp: Date.now(),
          source: "http-fallback",
        },
        timestamp: Date.now(),
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: "1.0",
      };

      this.handleIncomingMessage(message);
    } catch (error) {
      console.error(`Failed to fetch data for ${this.symbol}:`, error);

      const errorMessage: WebSocketMessage = {
        type: "error",
        symbol: this.symbol,
        data: {
          error: error instanceof Error ? error.message : "Unknown error",
          symbol: this.symbol,
          fatal: false,
        },
        timestamp: Date.now(),
      };

      this.notifySubscribers(errorMessage);
      this.emitEvent("error", error as Error);
    }
  }

  private handleIncomingMessage(message: WebSocketMessage): void {
    this.lastMessageTime = Date.now();

    // Update latency if provided
    if (message.data?.latency) {
      this.lastLatency = message.data.latency;
    }

    this.notifySubscribers(message);

    if (this.debug) {
      console.log(
        `📨 [WebSocket] ${this.symbol} ${message.type}:`,
        message.data,
      );
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        const timeSinceLastMessage = Date.now() - this.lastMessageTime;

        if (timeSinceLastMessage > this.heartbeatInterval * 2) {
          this.handleConnectionError(new Error("Heartbeat timeout"));
          return;
        }

        const heartbeatMessage: WebSocketMessage = {
          type: "heartbeat",
          data: {
            symbol: this.symbol,
            timeSinceLastMessage,
            connectionQuality:
              this.calculateConnectionQuality(timeSinceLastMessage),
            uptime: Date.now() - this.connectionStartTime,
          },
          timestamp: Date.now(),
        };

        this.notifySubscribers(heartbeatMessage);

        if (this.debug && timeSinceLastMessage > 10000) {
          console.log(`💓 [WebSocket] Heartbeat for ${this.symbol}`, {
            timeSinceLastMessage,
            quality: this.calculateConnectionQuality(timeSinceLastMessage),
          });
        }
      }
    }, this.heartbeatInterval);
  }

  private calculateConnectionQuality(
    timeSinceLastMessage: number,
  ): ConnectionStatus["connectionQuality"] {
    if (timeSinceLastMessage < CONNECTION_QUALITY_THRESHOLDS.excellent)
      return "excellent";
    if (timeSinceLastMessage < CONNECTION_QUALITY_THRESHOLDS.good)
      return "good";
    if (timeSinceLastMessage < CONNECTION_QUALITY_THRESHOLDS.poor)
      return "poor";
    return "disconnected";
  }

  private notifySubscribers(message: WebSocketMessage): void {
    // Notify all subscribers
    const allSubscribers = this.subscribers.get("all") || [];
    allSubscribers.forEach((callback) => {
      this.safeCallback(() => callback(message), "all-subscriber");
    });

    // Notify type-specific subscribers
    const typeSubscribers = this.subscribers.get(message.type) || [];
    typeSubscribers.forEach((callback) => {
      this.safeCallback(() => callback(message), `${message.type}-subscriber`);
    });
  }

  private safeCallback(callback: () => void, context: string): void {
    try {
      if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(() => callback());
      } else {
        callback();
      }
    } catch (error) {
      console.error(`Error in WebSocket ${context}:`, error);
    }
  }

  private emitEvent<T extends WebSocketEvent>(
    event: T,
    data: WebSocketEventMap[T],
  ): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in WebSocket event listener for ${event}:`, error);
      }
    });
  }

  private handleConnectionError(error: Error): void {
    this.debugLog(`Connection error for ${this.symbol}:`, error.message);

    this.isConnected = false;
    this.isConnecting = false;

    this.emitEvent("error", error);
    this.handleReconnection();
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.calculateReconnectDelay();

      this.debugLog(
        `Reconnecting ${this.symbol} in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      );

      this.emitEvent("reconnecting", {
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
        delay,
      });

      this.reconnectTimer = setTimeout(() => {
        if (!this.isConnected) {
          this.connect().catch(() => {
            // Reconnection will be handled by exponential backoff
          });
        }
      }, delay);
    } else {
      const error = new Error(
        `Max reconnection attempts reached for ${this.symbol}`,
      );
      this.debugLog(error.message);

      this.emitEvent("error", error);
    }
  }

  private calculateReconnectDelay(): number {
    // Exponential backoff with jitter
    const baseDelay =
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    const jitter = baseDelay * 0.1 * Math.random();
    return Math.min(baseDelay + jitter, 30000); // Cap at 30 seconds
  }

  private cleanup(): void {
    // Clear all timers
    [
      this.heartbeatTimer,
      this.connectionTimer,
      this.reconnectTimer,
      this.dataFetchTimer,
    ].forEach((timer) => {
      if (timer) {
        clearTimeout(timer);
      }
    });

    this.heartbeatTimer = null;
    this.connectionTimer = null;
    this.reconnectTimer = null;
    this.dataFetchTimer = null;

    // Close WebSocket if it exists
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private debugLog(...args: unknown[]): void {
    if (this.debug) {
      console.log(`[WebSocket:${this.symbol}]`, ...args);
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

  getConnection(symbol: string): WebSocketService {
    const normalizedSymbol = symbol.toUpperCase();

    if (!this.connections.has(normalizedSymbol)) {
      const connection = new WebSocketService(normalizedSymbol, {
        ...this.config,
        debug: this.config.debug ?? process.env.NODE_ENV === "development",
      });

      this.connections.set(normalizedSymbol, connection);
    }

    return this.connections.get(normalizedSymbol)!;
  }

  disconnect(symbol: string): void {
    const normalizedSymbol = symbol.toUpperCase();
    const connection = this.connections.get(normalizedSymbol);

    if (connection) {
      connection.disconnect();
      this.connections.delete(normalizedSymbol);
    }
  }

  disconnectAll(): void {
    this.connections.forEach((connection, symbol) => {
      connection.disconnect();
    });
    this.connections.clear();
  }

  getStatus(): { [symbol: string]: ConnectionStatus } {
    const status: { [symbol: string]: ConnectionStatus } = {};

    this.connections.forEach((connection, symbol) => {
      status[symbol] = connection.getStatus();
    });

    return status;
  }

  getActiveConnections(): string[] {
    return Array.from(this.connections.keys());
  }

  getTotalConnections(): number {
    return this.connections.size;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const webSocketManager = new WebSocketManager({
  maxReconnectAttempts: 8,
  reconnectDelay: 1000,
  heartbeatInterval: 15000,
  timeout: 8000,
  debug: process.env.NODE_ENV === "development",
  autoConnect: true,
  useRealWebSocket: false,
  endpoint: "/api/stocks",
});

// =============================================================================
// REACT HOOK
// =============================================================================

import { useEffect, useRef, useState } from '...';

export function useWebSocket(symbol: string, config?: WebSocketConfig) {
  const [data, setData] = useState<WebSocketMessage | null>(null);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const serviceRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    const service = webSocketManager.getConnection(symbol);
    serviceRef.current = service;

    // Subscribe to messages
    const unsubscribeMessage = service.subscribe((message) => {
      setData(message);
    });

    // Subscribe to status changes
    const unsubscribeStatus = service.on("connected", (newStatus) => {
      setStatus(newStatus);
      setError(null);
    });

    const unsubscribeDisconnected = service.on("disconnected", (newStatus) => {
      setStatus(newStatus);
    });

    // Subscribe to errors
    const unsubscribeError = service.on("error", (error) => {
      setError(error);
    });

    // Get initial status
    setStatus(service.getStatus());

    return () => {
      unsubscribeMessage();
      unsubscribeStatus();
      unsubscribeDisconnected();
      unsubscribeError();
    };
  }, [symbol]);

  const send = (message: unknown) => {
    if (serviceRef.current) {
      return serviceRef.current.send(message);
    }
    throw new Error("WebSocket service not initialized");
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
    connect,
    disconnect,
    isConnected: status?.isConnected ?? false,
    isConnecting: status?.isConnecting ?? false,
  };
}
