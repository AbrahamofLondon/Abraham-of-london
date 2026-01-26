// context/WebSocketContext.tsx
"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { WebSocketService } from "@/lib/websocket/WebSocketService";

const WebSocketContext = createContext<WebSocketService | null>(null);

interface WebSocketProviderProps {
  url: string;
  children: ReactNode;
  options?: { debug?: boolean };
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  url,
  children,
  options,
}) => {
  // Create WebSocket instance only on client-side
  const wsInstance = React.useMemo(() => {
    if (typeof window === "undefined") return null;
    return new WebSocketService(url, { autoConnect: true, ...options });
  }, [url, options]);

  React.useEffect(() => {
    return () => {
      wsInstance?.disconnect();
    };
  }, [wsInstance]);

  return (
    <WebSocketContext.Provider value={wsInstance}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within WebSocketProvider"
    );
  }
  return context;
};

