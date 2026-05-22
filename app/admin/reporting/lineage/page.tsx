export const dynamic = "force-dynamic";
// Guard: auth enforced by app/admin/layout.tsx → requireAdminServer().

import { getPrisma } from "@/lib/prisma.server";
import { GitBranch, Clock, User, FileText, AlertCircle, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Report Lineage & Audit — Admin",
};

type LineageRow = {
  id: string;
  action: string;
  resourceId: string | null;
  resourceName: string | null;
  actorEmail: string | null;
  metadata: string | null;
  createdAt: Date;
};

function eventTypeBadgeClass(eventType: string): string {
  if (eventType === "REVOKED") return "bg-red-950/60 text-red-400 border-red-800/40";
  if (eventType === "ESCALATED") return "bg-amber-950/60 text-amber-400 border-amber-800/40";
  if (eventType === "CREATED" || eventType === "GENERATED") return "bg-emerald-950/60 text-emerald-400 border-emerald-800/40";
  if (eventType === "EXPORTED" || eventType === "SHARED") return "bg-blue-950/60 text-blue-400 border-blue-800/40";
  if (eventType === "SUPERSEDED" || eventType === "ARCHIVED") return "bg-zinc-800/60 text-zinc-400 border-zinc-700/40";
  return "bg-zinc-900/60 text-zinc-400 border-zinc-700/40";
}

function parseVersion(metaRaw: string | null): string | null {
  if (!metaRaw) return null;
  try {
    const m = JSON.parse(metaRaw);
    return m.version ?? null;
  } catch {
    return null;
  }
}

function parseReportType(metaRaw: string | null, action: string): string {
  if (metaRaw) {
    try {
      const m = JSON.parse(metaRaw);
      if (m.reportType) return m.reportType as string;
    } catch { /* fall through */ }
  }
  return action.replace(/^REPORT_/, "").replace(/_/g, " ");
}

export default async function ReportLineagePage() {
  let rows: LineageRow[] = [];
  let failureRows: LineageRow[] = [];
  let dbError: string | null = null;

  try {
    const prisma = await getPrisma();
    const isPrismaAvailable =
      prisma &&
      (prisma as any).systemAuditLog &&
      typeof (prisma as any).systemAuditLog.findMany === "function";

    if (isPrismaAvailable) {
      [rows, failureRows] = await Promise.all([
        (prisma as any).systemAuditLog.findMany({
          where: { action: { startsWith: "REPORT_" }, NOT: { action: "REPORT_LINEAGE_WRITE_FAILED" } },
          orderBy: { createdAt: "desc" },
          take: 200,
          select: {
            id: true,
            action: true,
            resourceId: true,
            resourceName: true,
            actorEmail: true,
            metadata: true,
            createdAt: true,
          },
        }),
        (prisma as any).systemAuditLog.findMany({
          where: { action: "REPORT_LINEAGE_WRITE_FAILED" },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            action: true,
            resourceId: true,
            resourceName: true,
            actorEmail: true,
            metadata: true,
            createdAt: true,
          },
        }),
      ]);
    } else {
      dbError = "Prisma client unavailable.";
    }
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-amber-500/70">
            Admin · Reporting · Lineage
          </p>
          <div className="mt-2 flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-amber-500/60" />
            <h1 className="font-serif text-2xl text-white">Report Lineage &amp; Audit</h1>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-white/50">
            Append-only chain-of-custody ledger. Every material event for every report —
            creation, viewing, export, escalation, revocation, and supersession — is recorded
            here. Records are never edited after write. This view shows the 200 most recent events
            across all reports and report types.
          </p>
        </div>

        {/* Lineage write failure alert */}
        {failureRows.length > 0 && (
          <div className="border border-red-900/40 bg-red-950/20 px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <p className="font-mono text-[9px] uppercase tracking-wider text-red-400">
                Lineage write failures detected — {failureRows.length} recent event{failureRows.length !== 1 ? "s" : ""}
              </p>
            </div>
            <p className="mb-3 text-xs text-red-300/70">
              These events indicate that a lineage write failed and was caught. The report
              pipeline was not affected, but chain-of-custody may be incomplete for the
              listed resources. Investigate database connectivity or Prisma errors.
            </p>
            <div className="space-y-1.5">
              {failureRows.map((row) => {
                const meta = (() => { try { return JSON.parse(row.metadata ?? "{}"); } catch { return {}; } })();
                return (
                  <div key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border border-red-900/30 bg-red-950/30 px-3 py-2">
                    <span className="font-mono text-[9px] text-red-300">{row.resourceId ?? "—"}</span>
                    <span className="font-mono text-[9px] text-red-300/60">{meta.reportType ?? "—"} / {meta.eventType ?? "—"}</span>
                    {meta.errorCategory && (
                      <span className="font-mono text-[9px] text-red-300/50">{meta.errorCategory}</span>
                    )}
                    <span className="font-mono text-[9px] text-white/30">
                      {new Date(row.createdAt).toISOString().replace("T", " ").slice(0, 19)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DB error state */}
        {dbError && (
          <div className="flex items-start gap-3 border border-amber-800/40 bg-amber-950/30 px-5 py-4 text-sm text-amber-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <span>Database unavailable: {dbError}</span>
          </div>
        )}

        {/* Empty state */}
        {!dbError && rows.length === 0 && (
          <div className="border border-white/10 px-6 py-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-white/20" />
            <p className="mt-3 text-sm text-white/40">No report lineage events recorded yet.</p>
            <p className="mt-1 text-xs text-white/25">
              Events are written when reports are created, viewed, exported, escalated, or revoked.
            </p>
          </div>
        )}

        {/* Ledger */}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-2 pr-4 text-left font-mono text-[9px] uppercase tracking-wider text-white/35">
                    Event
                  </th>
                  <th className="pb-2 pr-4 text-left font-mono text-[9px] uppercase tracking-wider text-white/35">
                    Report type
                  </th>
                  <th className="pb-2 pr-4 text-left font-mono text-[9px] uppercase tracking-wider text-white/35">
                    Resource
                  </th>
                  <th className="pb-2 pr-4 text-left font-mono text-[9px] uppercase tracking-wider text-white/35">
                    Version
                  </th>
                  <th className="pb-2 pr-4 text-left font-mono text-[9px] uppercase tracking-wider text-white/35">
                    Actor
                  </th>
                  <th className="pb-2 text-left font-mono text-[9px] uppercase tracking-wider text-white/35">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {rows.map((row) => {
                  const eventType = row.action.replace(/^REPORT_/, "");
                  const reportType = parseReportType(row.metadata, row.action);
                  const version = parseVersion(row.metadata);
                  const ts = new Date(row.createdAt);

                  return (
                    <tr key={row.id} className="group hover:bg-white/[0.02]">
                      <td className="py-2.5 pr-4">
                        <span
                          className={`inline-block border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${eventTypeBadgeClass(eventType)}`}
                        >
                          {eventType}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="font-mono text-[9px] text-white/50">{reportType}</span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <p className="font-mono text-[9px] text-white/70">
                          {row.resourceId ?? "—"}
                        </p>
                        {row.resourceName && (
                          <p className="mt-0.5 text-[9px] text-white/35">{row.resourceName}</p>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        {version ? (
                          <span className="font-mono text-[9px] text-white/50">{version}</span>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        {row.actorEmail ? (
                          <span className="flex items-center gap-1 font-mono text-[9px] text-white/55">
                            <User className="h-2.5 w-2.5 text-white/30" />
                            {row.actorEmail}
                          </span>
                        ) : (
                          <span className="font-mono text-[9px] text-white/25">system</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <span className="flex items-center gap-1 font-mono text-[9px] text-white/40">
                          <Clock className="h-2.5 w-2.5" />
                          {ts.toISOString().replace("T", " ").slice(0, 19)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-4 font-mono text-[8px] text-white/20">
              Showing {rows.length} most recent events · Ordered newest first · Admin view — full actor email visible
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
