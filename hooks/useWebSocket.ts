// hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { WebSocketService } from "@/lib/websocket-service";

export type WebSocketMessage = {
  type: string;
  data?: Record<string, unknown>;
};

interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  error: Event | null;
  sendMessage: (message: WebSocketMessage) => void;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

export const useWebSocket = (
  url: string,
  options?: {
    debug?: boolean;
    autoConnect?: boolean;
    onMessage?: (message: WebSocketMessage) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
    onError?: (error: Event) => void;
    reconnectAttempts?: number;
    reconnectInterval?: number;
  }
): UseWebSocketReturn => {
  const wsRef = useRef<WebSocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<Event | null>(null);
  const reconnectCountRef = useRef(0);

  const maxReconnectAttempts = options?.reconnectAttempts ?? 5;
  const reconnectInterval = options?.reconnectInterval ?? 3000;

  const handleReconnect = useCallback(() => {
    if (reconnectCountRef.current < maxReconnectAttempts) {
      reconnectCountRef.current += 1;
      setTimeout(() => {
        if (wsRef.current) {
          wsRef.current.connect();
        }
      }, reconnectInterval);
    }
  }, [maxReconnectAttempts, reconnectInterval]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    wsRef.current = new WebSocketService(url, {
      autoConnect: options?.autoConnect ?? true,
      debug: options?.debug ?? false,
    });

    const unsubscribeConnected = wsRef.current.on("connected", () => {
      setIsConnected(true);
      setError(null);
      reconnectCountRef.current = 0;
      options?.onConnected?.();
    });

    const unsubscribeDisconnected = wsRef.current.on("disconnected", () => {
      setIsConnected(false);
      options?.onDisconnected?.();
      handleReconnect();
    });

    const unsubscribeError = wsRef.current.on("error", (message) => {
      let errorEvent: Event | null = null;
      
      if (message && typeof message === 'object' && 'data' in message) {
        const messageWithData = message as { data?: { event?: unknown } };
        errorEvent = (messageWithData.data?.event as Event) || (message as unknown as Event);
      } else {
        errorEvent = message as unknown as Event;
      }
      
      setError(errorEvent);
      options?.onError?.(errorEvent);
    });

    const unsubscribeMessage = wsRef.current.on("message", (message) => {
      const wsMessage = message as WebSocketMessage;
      setLastMessage(wsMessage);
      options?.onMessage?.(wsMessage);
    });

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeError();
      unsubscribeMessage();
      wsRef.current?.close();
    };
  }, [url, options?.debug, options?.autoConnect, handleReconnect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    wsRef.current?.send(message);
  }, []);

  const connect = useCallback(() => {
    wsRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    reconnectCountRef.current = maxReconnectAttempts; // Stop reconnecting
    wsRef.current?.close();
  }, [maxReconnectAttempts]);

  const reconnect = useCallback(() => {
    reconnectCountRef.current = 0;
    wsRef.current?.close();
    setTimeout(() => {
      wsRef.current?.connect();
    }, 1000);
  }, []);

  return {
    isConnected,
    lastMessage,
    error,
    sendMessage,
    connect,
    disconnect,
    reconnect,
  };
};