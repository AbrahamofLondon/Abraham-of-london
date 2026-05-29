// app/admin/intelligence-foundry/promotion/dashboard/page.tsx
// Promotion Dashboard — read-only aggregate view of all maturity stage promotions.
// Server component: data fetched at request time with no client-side hydration burden.

import Link from "next/link";
import { listPromotions } from "@/lib/research/promotion/promotion-service";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

type PromotionRecord = Awaited<ReturnType<typeof listPromotions>>[number];

const MATURITY_ORDER = [
  "RESERVED_CONCEPT",
  "SIMULATION_ONLY",
  "PILOT_READY",
  "LIVE_GOVERNED",
] as const;

const STAGE_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  RESERVED_CONCEPT: { label: "Reserved",      color: "text-white/35",       bg: "bg-white/5",       border: "border-white/8" },
  SIMULATION_ONLY:  { label: "Simulation",    color: "text-purple-400/70",  bg: "bg-purple-500/8",  border: "border-purple-500/15" },
  PILOT_READY:      { label: "Pilot Ready",   color: "text-violet-400/80",  bg: "bg-violet-500/8",  border: "border-violet-500/15" },
  LIVE_GOVERNED:    { label: "Live Governed", color: "text-emerald-400/85", bg: "bg-emerald-500/8", border: "border-emerald-500/15" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stageLabel(stage: string): string {
  return STAGE_STYLES[stage]?.label ?? stage;
}

function stageClasses(stage: string): string {
  const s = STAGE_STYLES[stage] ?? { color: "text-white/30", bg: "bg-white/5", border: "border-white/8" };
  return `${s.bg} ${s.color} border ${s.border}`;
}

function fmtDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Analytics helpers ────────────────────────────────────────────────────────

function computeDashboard(promotions: PromotionRecord[]) {
  const total      = promotions.length;
  const rollbacks  = promotions.filter((p) => !!p.rollbackAt).length;
  const withEvidence = promotions.filter((p) => !!p.researchRunId).length;
  const active     = total - rollbacks;

  // By toStage
  const byStage: Record<string, number> = {};
  for (const p of promotions) {
    byStage[p.toStage] = (byStage[p.toStage] ?? 0) + 1;
  }

  // By event type (top 10)
  const byEvent: Record<string, number> = {};
  for (const p of promotions) {
    byEvent[p.eventType] = (byEvent[p.eventType] ?? 0) + 1;
  }
  const topEvents = Object.entries(byEvent)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Blockers extraction
  const blockerCounts: Record<string, number> = {};
  for (const p of promotions) {
    if (p.blockersJson) {
      try {
        const arr = JSON.parse(p.blockersJson) as string[];
        for (const b of arr) {
          blockerCounts[b] = (blockerCounts[b] ?? 0) + 1;
        }
      } catch {}
    }
  }
  const topBlockers = Object.entries(blockerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Actors
  const actorCounts: Record<string, number> = {};
  for (const p of promotions) {
    actorCounts[p.approvedBy] = (actorCounts[p.approvedBy] ?? 0) + 1;
  }
  const topActors = Object.entries(actorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Rollback actors
  const rollbackActors: Record<string, number> = {};
  for (const p of promotions) {
    if (p.rollbackBy) {
      rollbackActors[p.rollbackBy] = (rollbackActors[p.rollbackBy] ?? 0) + 1;
    }
  }

  // Recent 10
  const recent = promotions.slice(0, 10);

  return {
    total, rollbacks, withEvidence, active,
    byStage, topEvents, topBlockers, topActors, rollbackActors, recent,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PromotionDashboardPage() {
  let promotions: PromotionRecord[] = [];
  let loadError: string | null = null;

  try {
    promotions = await listPromotions({ limit: 500 });
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Failed to load promotions";
  }

  const dash = computeDashboard(promotions);

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/admin/intelligence-foundry/promotion"
            className="text-[11px] text-white/25 hover:text-white/45 font-mono"
          >
            ← Promotion Workflow
          </Link>
          <span className="text-white/15 text-[11px]">/</span>
          <Link
            href="/admin/intelligence-foundry"
            className="text-[11px] text-white/25 hover:text-white/45 font-mono"
          >
            Foundry
          </Link>
        </div>
        <h1 className="text-lg font-semibold text-white/80">Promotion Dashboard</h1>
        <p className="text-sm text-white/35 mt-1">
          Aggregate view of all maturity stage promotions. Read-only. Data is fetched fresh on each
          request.
        </p>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
          {loadError}
        </div>
      )}

      {/* ── Summary stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-1">Total Promotions</p>
          <p className="text-2xl font-mono font-semibold text-white/70">{dash.total}</p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-1">Active</p>
          <p className="text-2xl font-mono font-semibold text-emerald-400/80">{dash.active}</p>
          <p className="text-[10px] text-white/25 font-mono mt-1">non-rolled-back</p>
        </div>
        <div className={`rounded-xl border p-4 ${dash.rollbacks > 0 ? "border-red-500/15 bg-red-500/[0.03]" : "border-white/8 bg-white/[0.02]"}`}>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-1">Rollbacks</p>
          <p className={`text-2xl font-mono font-semibold ${dash.rollbacks > 0 ? "text-red-400/80" : "text-white/70"}`}>
            {dash.rollbacks}
          </p>
          {dash.total > 0 && (
            <p className="text-[10px] text-white/25 font-mono mt-1">
              {((dash.rollbacks / dash.total) * 100).toFixed(1)}% rollback rate
            </p>
          )}
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-1">With Evidence</p>
          <p className="text-2xl font-mono font-semibold text-violet-400/80">{dash.withEvidence}</p>
          {dash.total > 0 && (
            <p className="text-[10px] text-white/25 font-mono mt-1">
              {((dash.withEvidence / dash.total) * 100).toFixed(0)}% have ResearchRun
            </p>
          )}
        </div>
      </div>

      {/* ── Stage distribution ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/8 bg-white/[0.015] p-5 space-y-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">
          Promotions by Target Stage
        </p>
        <div className="space-y-2">
          {MATURITY_ORDER.map((stage) => {
            const count   = dash.byStage[stage] ?? 0;
            const maxCount = Math.max(...Object.values(dash.byStage), 1);
            const pct     = (count / maxCount) * 100;
            const s       = STAGE_STYLES[stage];
            return (
              <div key={stage} className="flex items-center gap-3">
                <div className="w-32 shrink-0">
                  <span className={`rounded px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider ${stageClasses(stage)}`}>
                    {stageLabel(stage)}
                  </span>
                </div>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.bg.replace("bg-", "bg-")}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`w-8 text-right text-[11px] font-mono ${s.color}`}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Top events & blockers ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Most promoted event types */}
        <div className="rounded-xl border border-white/8 bg-white/[0.015] p-5 space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">
            Most Promoted Event Types
          </p>
          {dash.topEvents.length === 0 ? (
            <p className="text-[11px] text-white/20 italic">No promotions yet.</p>
          ) : (
            <div className="space-y-1.5">
              {dash.topEvents.map(([evt, count]) => (
                <div key={evt} className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-white/50 truncate">{evt}</span>
                  <span className="text-[11px] font-mono text-white/30 shrink-0">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most common blockers */}
        <div className="rounded-xl border border-white/8 bg-white/[0.015] p-5 space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">
            Most Common Blockers
          </p>
          {dash.topBlockers.length === 0 ? (
            <p className="text-[11px] text-white/20 italic">No blockers recorded.</p>
          ) : (
            <div className="space-y-1.5">
              {dash.topBlockers.map(([blocker, count]) => (
                <div key={blocker} className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-white/45 truncate">{blocker}</span>
                  <span className="text-[11px] font-mono text-amber-400/50 shrink-0">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Top actors ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/8 bg-white/[0.015] p-5 space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">
          Promotion Actors
        </p>
        {dash.topActors.length === 0 ? (
          <p className="text-[11px] text-white/20 italic">No actors recorded.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {dash.topActors.map(([actor, count]) => (
              <div
                key={actor}
                className="rounded-lg border border-white/8 bg-white/3 px-3 py-2"
              >
                <p className="text-[11px] font-mono text-white/50">{actor}</p>
                <p className="text-lg font-mono font-semibold text-white/60">{count}</p>
                <p className="text-[10px] text-white/25">promotion{count !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recent promotions ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/8 bg-white/[0.015] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">
            Recent Promotions
          </p>
          <Link
            href="/admin/intelligence-foundry/promotion"
            className="text-[10px] font-mono text-white/25 hover:text-white/45 transition-colors"
          >
            View all →
          </Link>
        </div>

        {dash.recent.length === 0 ? (
          <p className="text-[11px] text-white/20 italic">No promotions yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {dash.recent.map((p) => (
              <div key={p.id} className="py-3 flex items-start gap-4">
                {/* Stage transition */}
                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                  <span className={`rounded px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider ${stageClasses(p.fromStage)}`}>
                    {stageLabel(p.fromStage)}
                  </span>
                  <span className="text-white/20 text-[10px]">→</span>
                  <span className={`rounded px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider ${stageClasses(p.toStage)}`}>
                    {stageLabel(p.toStage)}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-mono text-white/55 truncate">{p.eventType}</p>
                    {p.rollbackAt && (
                      <span className="rounded px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider bg-red-500/8 text-red-400/60 border border-red-500/12">
                        rolled back
                      </span>
                    )}
                    {p.researchRunId && (
                      <Link
                        href={`/admin/intelligence-foundry/runs/${p.researchRunId}`}
                        className="text-[9px] font-mono text-violet-400/40 hover:text-violet-400/70 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        run →
                      </Link>
                    )}
                  </div>
                  <p className="text-[10px] text-white/30 mt-0.5 truncate">
                    {p.promotionReason}
                  </p>
                  <p className="text-[10px] font-mono text-white/20 mt-0.5">
                    {p.approvedBy} · {fmtDate(p.approvedAt)}
                    {p.rollbackAt && (
                      <span className="text-red-400/40">
                        {" "}· rolled back {fmtDate(p.rollbackAt)}
                        {p.rollbackBy ? ` by ${p.rollbackBy}` : ""}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <div className="flex gap-4 pt-2">
        <Link
          href="/admin/intelligence-foundry/promotion"
          className="text-xs text-violet-400/70 hover:text-violet-400 transition-colors"
        >
          ← Promotion Workflow
        </Link>
        <Link
          href="/admin/intelligence-foundry"
          className="text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          Foundry Hub
        </Link>
      </div>
    </div>
  );
}
