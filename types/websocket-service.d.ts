// types/websocket-service.d.ts
declare module "@/lib/websocket-service" {
  export interface WebSocketConfig {
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
    heartbeatInterval?: number;
    timeout?: number;
    debug?: boolean;
  }

  export interface WebSocketMessage {
    type: "price_update" | "heartbeat" | "connection_status" | "error";
    symbol?: string;
    data: unknown;
    timestamp: number;
  }

  export class WebSocketService {
    constructor(symbol: string, config?: WebSocketConfig);
    subscribe(callback: (data: unknown) => void): () => void;
    connect(): Promise<void>;
    disconnect(): void;
    send(message: unknown): Promise<void>;
    getStatus(): {
      isConnected: boolean;
      isConnecting: boolean;
      symbol: string;
      reconnectAttempts: number;
      maxReconnectAttempts: number;
      lastMessageTime: number;
      timeSinceLastMessage: number;
    };

    // Event handlers
    onConnectionChange: ((connected: boolean) => void) | null;
    onError: ((error: Error) => void) | null;
  }

  export class WebSocketManager {
    constructor(config?: WebSocketConfig);
    getConnection(symbol: string): WebSocketService;
    disconnect(symbol: string): void;
    disconnectAll(): void;
    getStatus(): { [symbol: string]: unknown };
  }

  export const webSocketManager: WebSocketManager;
}
