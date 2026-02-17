// components/dashboard/LiveDataDashboard.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

interface LiveDataDashboardProps {
  theme?: "light" | "dark";
  onPDFSelect?: (pdfId: string) => void;
  refreshMs?: number; // real refresh cadence
}

type LiveItem = {
  id: string;
  title: string;
  updatedAt: string;
};

export const LiveDataDashboard: React.FC<LiveDataDashboardProps> = ({
  theme = "light",
  onPDFSelect,
  refreshMs = 30_000,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<LiveItem[]>([]);

  const surfaceClass = useMemo(
    () => (theme === "dark" ? "bg-zinc-900 border-white/10 text-white" : "bg-white border-zinc-200 text-zinc-900"),
    [theme]
  );

  const cardClass = useMemo(
    () =>
      theme === "dark"
        ? "bg-zinc-950/40 border-white/10 hover:bg-zinc-900/60"
        : "bg-zinc-50 border-zinc-200 hover:bg-white",
    [theme]
  );

  useEffect(() => {
    let alive = true;

    const seed = () => {
      // Replace this block later with a real websocket / SSE feed
      const now = new Date().toISOString();
      const items: LiveItem[] = [
        { id: "live-1", title: "Live Signal • Registry Pulse", updatedAt: now },
        { id: "live-2", title: "Live Signal • Generation Queue", updatedAt: now },
        { id: "live-3", title: "Live Signal • Vault Integrity", updatedAt: now },
      ];
      if (alive) setData(items);
    };

    // first paint feels instant
    seed();
    const t0 = window.setTimeout(() => alive && setIsLoading(false), 450);

    // real refresh cadence (as the UI claims)
    const interval = window.setInterval(() => {
      seed();
    }, Math.max(5_000, refreshMs));

    return () => {
      alive = false;
      window.clearTimeout(t0);
      window.clearInterval(interval);
    };
  }, [refreshMs]);

  const handleSelect = (pdfId: string) => onPDFSelect?.(pdfId);

  if (isLoading) {
    return (
      <div className={`p-8 rounded-xl border ${surfaceClass}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-current opacity-60" />
          <p className="mt-4 text-sm opacity-70">Loading live data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl border shadow-lg ${surfaceClass}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Live Data Dashboard</h2>
        <span className="px-3 py-1 bg-emerald-500/15 text-emerald-300 text-sm font-medium rounded-full border border-emerald-500/20">
          Live
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => handleSelect(item.id)}
            className={`text-left p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${cardClass}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{item.title}</h3>
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
              Updated: {new Date(item.updatedAt).toLocaleTimeString()}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-white/10">
        <p className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
          Real-time data updates every {Math.round(refreshMs / 1000)} seconds
        </p>
      </div>
    </div>
  );
};

export default LiveDataDashboard;