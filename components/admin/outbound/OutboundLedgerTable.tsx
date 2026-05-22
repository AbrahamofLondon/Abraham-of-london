/**
 * components/admin/outbound/OutboundLedgerTable.tsx
 *
 * Reusable table component for OutboundPublishLedger entries.
 *
 * Shows: provider, item ID, campaign, status, source, actor, scheduled,
 *        idempotency key (shortened), post URL, error, timestamps.
 *
 * Renders safely with empty/null data. Server-rendered data only — no
 * client-side fetching. Tokens never present in ledger entries.
 */

import * as React from "react";
import { AdminStatusBadge, type AdminBadgeTone } from "@/components/admin/AdminStatusBadge";
import { ExternalLink } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LedgerEntry = {
  id: string;
  provider: string;
  outboundItemId: string;
  campaign: string | null;
  assetSlug: string;
  status: string; // IN_PROGRESS | DRY_RUN | PUBLISHED | FAILED | BLOCKED | SKIPPED
  source: string; // manual | scheduler
  idempotencyKey: string;
  actorEmail: string | null;
  providerPostUrl: string | null;
  errorCode: string | null;
  safeMessage: string | null;
  forceRepublish: boolean;
  createdAt: string;
  completedAt: string | null;
};

type Props = {
  entries: LedgerEntry[];
  title?: string;
  emptyMessage?: string;
  maxRows?: number;
  /** Mark the old LinkedInPublishAttempt source */
  legacyLabel?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusTone(status: string): AdminBadgeTone {
  if (status === "PUBLISHED") return "success";
  if (status === "FAILED" || status === "BLOCKED") return "danger";
  if (status === "DRY_RUN") return "info";
  if (status === "IN_PROGRESS") return "warning";
  return "muted";
}

function shortenKey(key: string, chars = 14): string {
  if (key.length <= chars) return key;
  return key.slice(0, chars) + "…";
}

function formatTs(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OutboundLedgerTable({
  entries,
  title = "Publish Ledger",
  emptyMessage = "No ledger entries recorded yet.",
  maxRows,
  legacyLabel,
}: Props) {
  const rows = maxRows ? entries.slice(0, maxRows) : entries;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h3 className="font-serif text-xl text-white">{title}</h3>
        {legacyLabel && (
          <span className="text-[9px] font-mono uppercase tracking-wider text-amber-200/50 border border-amber-400/20 px-2 py-0.5">
            {legacyLabel}
          </span>
        )}
        {entries.length > 0 && (
          <span className="text-[9px] font-mono text-white/30">{entries.length} entries</span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-white/45">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                {[
                  "Provider", "Item / Campaign", "Status", "Source",
                  "Idempotency key", "Actor", "Scheduled", "Post", "Created",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-2 pr-4 text-left font-mono text-[9px] uppercase tracking-wider text-white/30"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr key={entry.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-2 pr-4">
                    <span className="font-mono text-white/60">{entry.provider}</span>
                  </td>
                  <td className="py-2 pr-4 max-w-[180px]">
                    <p className="truncate text-white/70">{entry.outboundItemId}</p>
                    {entry.campaign && (
                      <p className="truncate text-white/30 text-[9px]">{entry.campaign}</p>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex flex-col gap-1">
                      <AdminStatusBadge label={entry.status} tone={statusTone(entry.status)} />
                      {entry.forceRepublish && (
                        <span className="text-[8px] font-mono text-amber-300/70">force</span>
                      )}
                      {entry.errorCode && (
                        <span className="text-[8px] text-rose-300/70 truncate max-w-[100px]">
                          {entry.errorCode}
                        </span>
                      )}
                      {entry.safeMessage && (
                        <span className="text-[8px] text-rose-200/60 max-w-[120px] line-clamp-2">
                          {entry.safeMessage}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-4">
                    <AdminStatusBadge
                      label={entry.source}
                      tone={entry.source === "scheduler" ? "info" : "muted"}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <span className="font-mono text-white/40 text-[9px]">
                      {shortenKey(entry.idempotencyKey)}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className="text-white/45 truncate max-w-[100px] block">
                      {entry.actorEmail ?? "system"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap text-white/40">
                    {formatTs(entry.createdAt)}
                  </td>
                  <td className="py-2 pr-4">
                    {entry.providerPostUrl ? (
                      <a
                        href={entry.providerPostUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sky-300/70 hover:text-sky-200"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </a>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap text-white/40">
                    {formatTs(entry.completedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
