"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
} from "lucide-react";

export type FeedEntry = {
  id: string;
  timestamp: string;
  label: string;
  detail?: string;
  status: "ok" | "warn" | "error" | "pending";
  metric?: { label: string; value: string };
  href?: string;
};

type ActivityFeedProps = {
  title: string;
  fetchUrl: string;
  /** Transform raw API response into FeedEntry[]. */
  transform: (data: unknown) => FeedEntry[];
  emptyMessage?: string;
  maxItems?: number;
};

const STATUS_ICON = {
  ok: <CheckCircle2 className="h-3 w-3 text-emerald-500" />,
  warn: <AlertTriangle className="h-3 w-3 text-amber-500" />,
  error: <XCircle className="h-3 w-3 text-red-400" />,
  pending: <Clock className="h-3 w-3 text-white/30" />,
};

/**
 * Reusable admin activity feed.
 *
 * Fetches from any API endpoint and renders a vertical timeline
 * of typed entries with status icons, metrics, and optional
 * drill-through links.
 *
 * Usage:
 *   <ActivityFeed
 *     title="Proof Queue"
 *     fetchUrl="/api/admin/proof/evidence"
 *     transform={(data) => (data as any).items?.map(...) ?? []}
 *   />
 */
export default function ActivityFeed({
  title,
  fetchUrl,
  transform,
  emptyMessage = "No activity yet.",
  maxItems = 8,
}: ActivityFeedProps) {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(fetchUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setEntries(transform(data).slice(0, maxItems));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchUrl, maxItems, transform]);

  return (
    <div className="border border-white/5 bg-zinc-900/20 p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
        <span className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/40">
          {title}
        </span>
        {loading && (
          <span className="text-[8px] font-mono text-white/20 animate-pulse">
            loading...
          </span>
        )}
      </div>

      {!loading && entries.length === 0 && (
        <p className="text-[11px] text-white/25 py-4">{emptyMessage}</p>
      )}

      <div className="space-y-2">
        {entries.map((entry) => {
          const Wrapper = entry.href ? "a" : "div";
          const wrapperProps = entry.href
            ? { href: entry.href, className: "block" }
            : {};

          return (
            <Wrapper
              key={entry.id}
              {...(wrapperProps as any)}
              className="group border border-white/5 bg-black/20 p-3 transition-all hover:border-amber-500/20"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {STATUS_ICON[entry.status]}
                  <span className="text-[11px] text-white/80 leading-tight">
                    {entry.label}
                  </span>
                </div>
                <span className="text-[8px] font-mono text-white/20 shrink-0">
                  {formatTimestamp(entry.timestamp)}
                </span>
              </div>

              {entry.detail && (
                <p className="mt-1.5 text-[10px] text-white/35 leading-relaxed line-clamp-2 pl-5">
                  {entry.detail}
                </p>
              )}

              <div className="mt-2 flex items-center justify-between pl-5">
                {entry.metric && (
                  <span className="text-[8px] font-mono text-white/25">
                    {entry.metric.label}: <span className="text-white/50">{entry.metric.value}</span>
                  </span>
                )}
                {entry.href && (
                  <span className="flex items-center gap-1 text-[8px] font-mono text-amber-500/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    View <ChevronRight className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return "—";
  }
}
