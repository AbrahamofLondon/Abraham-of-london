// hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from "react";
import {
  WebSocketService,
  type WebSocketMessage,
} from "@/lib/websocket-service";

interface UseWebSocketOptions {
  debug?: boolean;
  autoConnect?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  error: unknown;
  sendMessage: (message: WebSocketMessage) => boolean;
  connect: () => void;
  disconnect: () => void;
}

export const useWebSocket = (
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  const wsRef = useRef<WebSocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<unknown>(null);

  const sendMessage = useCallback(
    (message: WebSocketMessage) => {
      return wsRef.current?.send(message) ?? false;
    },
    []
  );

  const connect = useCallback(() => {
    wsRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
  }, []);

  useEffect(() => {
    // SSR safety
    if (typeof window === "undefined") return;

    const service = new WebSocketService(url, {
      autoConnect: options.autoConnect ?? true,
      debug: options.debug ?? false,
    });

    wsRef.current = service;

    const offConnected = service.on("connected", () => {
      setIsConnected(true);
      setError(null);
      options.onConnected?.();
    });

    const offDisconnected = service.on("disconnected", () => {
      setIsConnected(false);
      options.onDisconnected?.();
    });

    const offError = service.on("error", (msg) => {
      setError(msg);
    });

    const offMessage = service.on("message", (msg) => {
      setLastMessage(msg);
      options.onMessage?.(msg);
    });

    return () => {
      offConnected();
      offDisconnected();
      offError();
      offMessage();
      service.disconnect();
      wsRef.current = null;
    };
  }, [
    url,
    options.autoConnect,
    options.debug,
    options.onConnected,
    options.onDisconnected,
    options.onMessage,
  ]);

  return {
    isConnected,
    lastMessage,
    error,
    sendMessage,
    connect,
    disconnect,
  };
};