// app/admin/intelligence-foundry/executive-summary/page.tsx
//
// Executive Summary — Top governance issues this week in business language.
// Server component. Operator-only. Admin auth enforced by layout.tsx.

export const dynamic = "force-dynamic";

import * as React from "react";
import Link from "next/link";
import { ResearchRunRepository } from "@/lib/research/research-run-repository";
import { getProductHealthOverview } from "@/lib/research/product-health/product-health-service";
import { listPromotions } from "@/lib/research/promotion/promotion-service";

// ─── Types ────────────────────────────────────────────────────────────────────

type Urgency = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

type ExecutiveIssue = {
  id: string;
  title: string;
  module: string;
  urgency: Urgency;
  businessConsequence: string;
  owner: string;
  fixPath: string;
  linkedRoute?: string | null;
  runId: string;
  daysOpen: number;
  status: string;
};

type HealthSnapshot = {
  red: number;
  amber: number;
  green: number;
  grey: number;
  total: number;
  releaseBlockers: number;
};

type ExecutiveSummary = {
  topIssues: ExecutiveIssue[];
  health: HealthSnapshot;
  totalOpenFindings: number;
  criticalCount: number;
  highCount: number;
  recentPromotionCount: number;
  rollbackCount: number;
  weekStart: string;
  weekEnd: string;
};

// ─── Consequence map ──────────────────────────────────────────────────────────
// Translate module/engine identifiers into business consequence language.

const MODULE_CONSEQUENCE: Record<string, string> = {
  "contradiction-scanner":        "A structural contradiction in this decision will cause execution to stall when the teams involved act on conflicting directives.",
  "constitutional-diagnostic":    "This decision lacks a named authority or evidence chain. It cannot be executed, reversed, or audited — increasing the governance liability on this surface.",
  "release-risk-scanner":         "This release has an unresolved governance gap. If shipped as-is, the gap becomes a post-release incident.",
  "market-signal-classifier":     "An unaddressed market signal is compounding. Each week without a governed response is a week of potential position loss.",
  "content-red-team":             "A product claim in this surface has not been validated. If it reaches analysts or regulators, it will require emergency remediation.",
  "security-red-team":            "An exposed route or auth gap creates liability that is always highest before it is publicly known.",
  "ci-gate":                      "The CI gate is blocking a release. Deployment is paused until this is resolved.",
  "strategy-room":                "An unresolved strategic decision is consuming execution budget. Every sprint run without resolution is a sprint partially wasted.",
  "boardroom-mode":               "The executive brief for this surface is incomplete or contradictory. Delivery will require additional review cycles.",
  "fast-diagnostic":              "This diagnostic has flagged governance issues that require resolution before this surface can advance in maturity.",
};

function getConsequence(module: string, title: string, assetAtRisk?: string | null): string {
  if (assetAtRisk) return `Asset at risk: ${assetAtRisk}.`;
  return MODULE_CONSEQUENCE[module]
    ?? `Unresolved ${module} finding: ${title} — requires operator review and remediation.`;
}

// ─── Fix path map ─────────────────────────────────────────────────────────────

const MODULE_FIX_PATH: Record<string, string> = {
  "contradiction-scanner":     "Review the decision statement. Resolve contradictions and issue a revised directive with named authority.",
  "constitutional-diagnostic": "Run a full Constitutional Diagnostic with evidence chain. Assign a named authority before proceeding.",
  "release-risk-scanner":      "Resolve all CRITICAL governance gaps before the next deployment. Review findings at /admin/intelligence-foundry/runs.",
  "market-signal-classifier":  "Assign a named owner and a governance response deadline. Classify the signal as THREAT, OPPORTUNITY, or NOISE.",
  "content-red-team":          "Validate or remove the contested claim. Update the product claim registry with evidence.",
  "security-red-team":         "Patch the identified route or auth gap. Re-run the security gate after remediation.",
  "ci-gate":                   "Resolve the blocking finding in the Foundry admin panel, then re-run the CI gate.",
  "strategy-room":             "Issue a governance directive. Name the authority. Set a decision deadline.",
  "boardroom-mode":            "Review the executive brief. Resolve contradictions and obtain sign-off from the named authority.",
  "fast-diagnostic":           "Review diagnostic findings. Resolve CRITICAL items before the next sprint cycle.",
};

function getFixPath(module: string, recommendation?: string | null): string {
  if (recommendation && recommendation.trim().length > 20) return recommendation.trim();
  return MODULE_FIX_PATH[module] ?? "Review the finding and resolve via the Foundry admin panel.";
}

// ─── Urgency label ────────────────────────────────────────────────────────────

const URGENCY_STYLES: Record<Urgency, { label: string; badge: string; dot: string; border: string; bg: string; text: string }> = {
  CRITICAL: { label: "Critical",  badge: "text-red-300 border-red-500/30 bg-red-500/10",     dot: "bg-red-500",     border: "border-red-500/20",  bg: "bg-red-500/5",   text: "text-red-300/80" },
  HIGH:     { label: "High",      badge: "text-orange-300 border-orange-500/30 bg-orange-500/10", dot: "bg-orange-400", border: "border-orange-500/20", bg: "bg-orange-500/5", text: "text-orange-300/80" },
  MEDIUM:   { label: "Medium",    badge: "text-amber-300 border-amber-500/30 bg-amber-500/10",  dot: "bg-amber-400",   border: "border-amber-500/20", bg: "bg-amber-500/5",  text: "text-amber-300/80" },
  LOW:      { label: "Low",       badge: "text-white/35 border-white/15 bg-white/5",          dot: "bg-white/20",    border: "border-white/8",     bg: "bg-white/[0.02]", text: "text-white/40" },
};

const GOLD = "#C9A96E";

// ─── Data aggregation ─────────────────────────────────────────────────────────

async function buildExecutiveSummary(): Promise<ExecutiveSummary> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Fetch in parallel
  const [recentRuns, healthOverview, recentPromotions] = await Promise.all([
    ResearchRunRepository.findMany({
      includeArchived: false,
      limit: 200,
    }),
    Promise.resolve(getProductHealthOverview()),
    listPromotions({ limit: 50 }),
  ]);

  // Filter to non-demo, action-required or high-severity runs
  const actionableRuns = recentRuns.filter((r) => {
    if (r.isDemo) return false;
    const isHighSeverity = r.severity === "CRITICAL" || r.severity === "HIGH";
    const isActionable = r.status === "ACTION_REQUIRED"
      || r.status === "OWNER_DECISION_REQUIRED"
      || r.status === "PENDING"
      || r.status === "IN_PROGRESS";
    return isHighSeverity && isActionable;
  });

  // Sort: CRITICAL first, then HIGH; within each group by age (oldest first)
  const sortedRuns = actionableRuns.sort((a, b) => {
    if (a.severity === "CRITICAL" && b.severity !== "CRITICAL") return -1;
    if (b.severity === "CRITICAL" && a.severity !== "CRITICAL") return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Build top issues (cap at 5 for executive focus)
  const topIssues: ExecutiveIssue[] = sortedRuns.slice(0, 5).map((r) => {
    const daysOpen = Math.floor(
      (now.getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    );
    return {
      id: r.id,
      title: r.title,
      module: r.module,
      urgency: (r.severity === "CRITICAL" ? "CRITICAL" : r.severity === "HIGH" ? "HIGH" : "MEDIUM") as Urgency,
      businessConsequence: getConsequence(r.module, r.title, r.assetAtRisk),
      owner: r.actorEmail ?? "No owner assigned",
      fixPath: getFixPath(r.module, r.recommendation),
      linkedRoute: r.linkedRoute,
      runId: r.id,
      daysOpen,
      status: r.status,
    };
  });

  // Promotion / rollback counts for the week
  const recentPromotionCount = recentPromotions.filter(
    (p) => new Date(p.approvedAt) >= weekAgo,
  ).length;
  const rollbackCount = recentPromotions.filter(
    (p) => p.rollbackAt && new Date(p.rollbackAt) >= weekAgo,
  ).length;

  const criticalCount = actionableRuns.filter((r) => r.severity === "CRITICAL").length;
  const highCount = actionableRuns.filter((r) => r.severity === "HIGH").length;

  return {
    topIssues,
    health: healthOverview.summary,
    totalOpenFindings: actionableRuns.length,
    criticalCount,
    highCount,
    recentPromotionCount,
    rollbackCount,
    weekStart: weekAgo.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    weekEnd: now.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default async function ExecutiveSummaryPage() {
  const summary = await buildExecutiveSummary();
  const { topIssues, health, criticalCount, highCount,
          totalOpenFindings, recentPromotionCount, rollbackCount,
          weekStart, weekEnd } = summary;

  const overallStatus = criticalCount > 0 ? "RED" : highCount > 0 ? "AMBER" : "GREEN";
  const statusStyles = {
    RED:   "text-red-300 bg-red-500/10 border-red-500/25",
    AMBER: "text-amber-300 bg-amber-500/10 border-amber-500/25",
    GREEN: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
  }[overallStatus];
  const statusLabel = { RED: "Attention Required", AMBER: "Elevated Risk", GREEN: "Governed" }[overallStatus];

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto mb-10">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/25 mb-2">
              Intelligence Foundry — Executive Summary
            </p>
            <h1 className="text-3xl font-semibold text-white/90">
              Governance Status
            </h1>
            <p className="text-sm text-white/40 mt-1">
              {weekStart} — {weekEnd} · {totalOpenFindings} open action-required finding{totalOpenFindings !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider ${statusStyles}`}>
              {statusLabel}
            </span>
            <Link
              href="/admin/intelligence-foundry"
              className="rounded border border-white/12 bg-white/3 px-3 py-1.5 font-mono text-[10px] text-white/35 hover:border-white/25 hover:text-white/55 transition-colors"
            >
              ← Command Centre
            </Link>
          </div>
        </div>

        {/* ── KPI strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Critical",        value: criticalCount,        color: criticalCount > 0 ? "text-red-400" : "text-white/40" },
            { label: "High",            value: highCount,            color: highCount > 0 ? "text-orange-400" : "text-white/40" },
            { label: "RED surfaces",    value: health.red,           color: health.red > 0 ? "text-red-400" : "text-white/40" },
            { label: "AMBER surfaces",  value: health.amber,         color: health.amber > 0 ? "text-amber-400" : "text-white/40" },
            { label: "Promotions/wk",   value: recentPromotionCount, color: "text-emerald-400" },
            { label: "Rollbacks/wk",    value: rollbackCount,        color: rollbackCount > 0 ? "text-orange-400" : "text-white/40" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
              <p className={`font-mono text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/30 mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top issues ──────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto">
        <p className="font-mono text-[10px] uppercase tracking-widest text-white/20 mb-4 px-1">
          Top issues requiring action
        </p>

        {topIssues.length === 0 ? (
          <div className="rounded-xl border border-white/8 bg-white/[0.02] px-6 py-12 text-center">
            <p className="text-sm text-white/30 mb-2">No open action-required CRITICAL or HIGH findings.</p>
            <p className="font-mono text-[10px] text-white/15 uppercase tracking-wider">Governance is clear this week.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topIssues.map((issue, i) => {
              const u = URGENCY_STYLES[issue.urgency];
              return (
                <div key={issue.id} className={`rounded-xl border ${u.border} ${u.bg} overflow-hidden`}>
                  {/* Issue header */}
                  <div className="px-5 py-4 border-b border-white/5 flex flex-wrap items-start gap-3">
                    <div className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${u.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white/85">{issue.title}</span>
                        <span className={`rounded border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider ${u.badge}`}>
                          {u.label}
                        </span>
                        <span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[8px] text-white/30 uppercase tracking-wider">
                          {issue.module}
                        </span>
                        {issue.daysOpen > 0 && (
                          <span className="font-mono text-[9px] text-white/25">
                            {issue.daysOpen}d open
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/admin/intelligence-foundry/runs/${issue.runId}`}
                      className="shrink-0 rounded border border-white/12 bg-white/3 px-2.5 py-1 font-mono text-[9px] text-white/35 hover:border-white/25 hover:text-white/55 transition-colors"
                    >
                      View run →
                    </Link>
                  </div>

                  {/* Issue body — the three buyer-language fields */}
                  <div className="px-5 py-4 grid sm:grid-cols-3 gap-5">
                    {/* Consequence */}
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-wider mb-2" style={{ color: `${GOLD}55` }}>
                        Business consequence
                      </p>
                      <p className={`text-xs leading-5 ${u.text}`}>{issue.businessConsequence}</p>
                    </div>

                    {/* Owner */}
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-white/20 mb-2">
                        Owner
                      </p>
                      <p className="font-mono text-xs text-white/55">{issue.owner}</p>
                      {issue.linkedRoute && (
                        <p className="font-mono text-[10px] text-white/25 mt-1 truncate">
                          → {issue.linkedRoute}
                        </p>
                      )}
                    </div>

                    {/* Fix path */}
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-white/20 mb-2">
                        Fix path
                      </p>
                      <p className="text-xs text-white/50 leading-5">{issue.fixPath}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Product surface health ───────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto mt-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-white/20 mb-4 px-1">
          Product surface health
        </p>
        <div className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
          <div className="grid grid-cols-5 border-b border-white/8 px-5 py-3">
            {[
              { label: "Green", value: health.green, color: "text-emerald-400" },
              { label: "Amber", value: health.amber, color: "text-amber-400" },
              { label: "Red",   value: health.red,   color: "text-red-400" },
              { label: "Grey",  value: health.grey,  color: "text-white/40" },
              { label: "Total", value: health.total, color: "text-white/60" },
            ].map((col) => (
              <div key={col.label} className="text-center">
                <p className={`font-mono text-xl font-bold ${col.color}`}>{col.value}</p>
                <p className="font-mono text-[9px] uppercase tracking-wider text-white/25 mt-0.5">{col.label}</p>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 flex items-center justify-between">
            <p className="text-xs text-white/35">
              {health.releaseBlockers > 0
                ? `${health.releaseBlockers} release blocker${health.releaseBlockers !== 1 ? "s" : ""} — deployment may be blocked.`
                : "No release blockers detected on any product surface."}
            </p>
            <Link
              href="/admin/intelligence-foundry/product-health"
              className="font-mono text-[10px] text-white/30 hover:text-white/55 transition-colors"
            >
              Full health view →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Quick actions ────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto mt-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-white/20 mb-4 px-1">
          Quick actions
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "All runs",           href: "/admin/intelligence-foundry/runs" },
            { label: "Product health",     href: "/admin/intelligence-foundry/product-health" },
            { label: "Promotion dashboard",href: "/admin/intelligence-foundry/promotion/dashboard" },
            { label: "CI gate status",     href: "/admin/intelligence-foundry/health" },
            { label: "Free demo →",        href: "/foundry/demo" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-lg border border-white/12 bg-white/[0.02] px-4 py-2 font-mono text-[11px] text-white/40 hover:border-white/25 hover:text-white/65 transition-colors"
            >
              {a.label}
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
