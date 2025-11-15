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
}

export const useWebSocket = (
  url: string,
  options?: {
    debug?: boolean;
    autoConnect?: boolean;
    onMessage?: (message: WebSocketMessage) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
  }
): UseWebSocketReturn => {
  const wsRef = useRef<WebSocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<Event | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    wsRef.current = new WebSocketService(url, {
      autoConnect: options?.autoConnect ?? true,
      debug: options?.debug ?? false,
    });

    const unsubscribeConnected = wsRef.current.on("connected", () => {
      setIsConnected(true);
      setError(null);
      options?.onConnected?.();
    });

    const unsubscribeDisconnected = wsRef.current.on("disconnected", () => {
      setIsConnected(false);
      options?.onDisconnected?.();
    });

    const unsubscribeError = wsRef.current.on("error", (message) => {
      // Fix: Handle message that might not have data property
      let errorEvent: Event | null = null;
      
      if (message && typeof message === 'object' && 'data' in message) {
        // If message has data property, try to extract event
        const messageWithData = message as { data?: { event?: unknown } };
        errorEvent = (messageWithData.data?.event as Event) || (message as unknown as Event);
      } else {
        // If no data property, use message directly
        errorEvent = message as unknown as Event;
      }
      
      setError(errorEvent);
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
      wsRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, options?.debug, options?.autoConnect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    wsRef.current?.send(message);
  }, []);

  const connect = useCallback(() => {
    wsRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
  }, []);

  return {
    isConnected,
    lastMessage,
    error,
    sendMessage,
    connect,
    disconnect,
  };
};