/**
 * components/admin/outbound/OutboundAttemptHistory.tsx
 *
 * Shared publish attempt history table used by all three outbound consoles.
 * Shows: status, title, timestamp, post URL (if any), sync badges, error.
 * Adapts to provider-specific field names via a normalised AttemptRow type.
 */

import * as React from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AttemptStatus = "succeeded" | "failed" | "blocked" | "pending" | "dry_run";

export type AttemptRow = {
  requestId: string;
  assetTitle: string;
  assetSlug: string;
  status: AttemptStatus;
  postUrl?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
  dryRun?: boolean;
  /** Sync badges — e.g. "synced to X", "synced from Facebook" */
  syncBadges?: string[];
};

export type OutboundAttemptHistoryProps = {
  attempts: AttemptRow[];
  emptyLabel?: string;
  maxRows?: number;
};

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusTone(status: AttemptStatus) {
  switch (status) {
    case "succeeded": return "success" as const;
    case "failed": return "danger" as const;
    case "blocked": return "warning" as const;
    case "pending": return "info" as const;
    case "dry_run": return "muted" as const;
  }
}

function statusLabel(status: AttemptStatus, dryRun?: boolean): string {
  if (dryRun && status === "succeeded") return "dry run";
  switch (status) {
    case "succeeded": return "published";
    case "failed": return "failed";
    case "blocked": return "blocked";
    case "pending": return "pending";
    case "dry_run": return "dry run";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OutboundAttemptHistory({
  attempts,
  emptyLabel = "No publish attempts yet.",
  maxRows = 20,
}: OutboundAttemptHistoryProps) {
  if (attempts.length === 0) {
    return (
      <div className="rounded-lg border border-white/8 bg-white/[0.02] p-6 text-center text-[11px] text-white/25">
        {emptyLabel}
      </div>
    );
  }

  const displayed = attempts.slice(0, maxRows);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/8 bg-white/[0.02]">
            <th className="px-4 py-2.5 text-[9px] font-medium uppercase tracking-widest text-white/30">Status</th>
            <th className="px-4 py-2.5 text-[9px] font-medium uppercase tracking-widest text-white/30">Asset</th>
            <th className="px-4 py-2.5 text-[9px] font-medium uppercase tracking-widest text-white/30">When</th>
            <th className="px-4 py-2.5 text-[9px] font-medium uppercase tracking-widest text-white/30">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {displayed.map((attempt) => (
            <tr key={attempt.requestId} className="group hover:bg-white/[0.015] transition-colors">
              {/* Status */}
              <td className="px-4 py-3">
                <AdminStatusBadge
                  label={statusLabel(attempt.status, attempt.dryRun)}
                  tone={statusTone(attempt.status)}
                  pill
                />
              </td>

              {/* Asset */}
              <td className="px-4 py-3">
                <p className="text-[11px] text-white/70 truncate max-w-[200px]">{attempt.assetTitle}</p>
                {attempt.syncBadges && attempt.syncBadges.length > 0 && (
                  <div className="mt-1 flex gap-1 flex-wrap">
                    {attempt.syncBadges.map((badge, i) => (
                      <AdminStatusBadge key={i} label={badge} tone="info" size="sm" />
                    ))}
                  </div>
                )}
              </td>

              {/* When */}
              <td className="px-4 py-3">
                <p className="font-mono text-[10px] text-white/30">
                  {formatDate(attempt.completedAt ?? attempt.createdAt)}
                </p>
                <p className="font-mono text-[9px] text-white/15">{attempt.requestId}</p>
              </td>

              {/* Result */}
              <td className="px-4 py-3">
                {attempt.postUrl ? (
                  <a
                    href={attempt.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View post <ExternalLink className="h-3 w-3" />
                  </a>
                ) : attempt.errorCode ? (
                  <div>
                    <p className="font-mono text-[9px] text-rose-400/60">{attempt.errorCode}</p>
                    {attempt.errorMessage && (
                      <p className="mt-0.5 text-[10px] text-rose-300/60 max-w-[180px] truncate">
                        {attempt.errorMessage}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-white/20">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {attempts.length > maxRows && (
        <div className="border-t border-white/8 bg-white/[0.02] px-4 py-2.5 text-center text-[10px] text-white/25">
          Showing {maxRows} of {attempts.length} attempts
        </div>
      )}
    </div>
  );
}
