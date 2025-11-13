"use client";
import * as React from "react";

export default function LiveStockTracker(): JSX.Element {
  const socketsRef = React.useRef<WebSocket | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof WebSocket === "undefined") return;
    const ws = new WebSocket("wss://example.invalid");
    socketsRef.current = ws;

    ws.onopen = () => void 0;
    ws.onmessage = () => void 0;

    return () => {
      const current = socketsRef.current; // capture stable ref
      if (current && current.readyState === 1) current.close();
      socketsRef.current = null;
    };
  }, []);

  return <div data-live-stocks className="text-sm text-gray-600">Live stocks disabled.</div>;
}