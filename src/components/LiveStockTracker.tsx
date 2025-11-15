// components/stocks/LiveStockTracker.tsx
"use client";

import * as React from "react";

export default function LiveStockTracker(): JSX.Element {
  const socketRef = React.useRef<WebSocket | null>(null);

  React.useEffect(() => {
    // Extra hardening: never run on server / edge without WebSocket
    if (typeof window === "undefined" || typeof WebSocket === "undefined") {
      return;
    }

    const ws = new WebSocket("wss://example.invalid"); // placeholder / disabled
    socketRef.current = ws;

    // No-op handlers for now (keeps runtime quiet)
    ws.onopen = () => undefined;
    ws.onmessage = () => undefined;
    ws.onerror = () => undefined;

    return () => {
      const current = socketRef.current;
      if (current && current.readyState === WebSocket.OPEN) {
        current.close();
      }
      socketRef.current = null;
    };
  }, []);

  return (
    <div
      data-live-stocks
      className="text-sm text-gray-600"
    >
      Live stocks disabled.
    </div>
  );
}