/* app/admin/command/page.tsx — INSTITUTIONAL COMMAND SURFACE
 *
 * Phase 2 of the £50k recovery plan.
 * Single consolidated view. No new models. No new API routes.
 * Queries existing data through existing endpoints.
 *
 * Surfaces:
 *   - Active institutional decisions
 *   - Recurring patterns
 *   - Cost exposure
 *   - Irreversibility movement
 *   - Boardroom archive
 *   - Counsel history
 *   - Cadence breaches
 *   - Organisation divergence
 *   - Oversight cycle status
 *   - What would be lost if oversight stopped
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { isAuthorizedAdminSession } from "@/lib/auth/admin-authority";
import { prisma } from "@/lib/prisma.server";

export const dynamic = "force-dynamic";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type CommandSummary = {
  // Active decisions
  activeDecisions: number;
  monitoredDecisions: number;
  resolvedDecisions: number;
  decisionsByPriority: Record<string, number>;
  decisionsByStatus: Record<string, number>;

  // Enforcement
  totalEnforcementCycles: number;
  latestOutcomeDeltas: number[];
  averageOutcomeDelta: number | null;
  cycleCountByDecision: number[];

  // Escalations
  totalEscalations: number;
  escalationsByTrigger: Record<string, number>;
  unresolvedEscalations: number;

  // Patterns
  recurringPatterns: Array<{
    label: string;
    count: number;
    trend: string;
  }>;

  // Cost exposure
  costExposure: {
    totalAtRisk: number;
    byPriority: Record<string, number>;
    averageTimePenalty: number;
    averageFailurePenalty: number;
  };

  // Irreversibility
  irreversibility: {
    criticalCount: number;
    escalatingCount: number;
    stableCount: number;
    byLabel: Record<string, number>;
  };

  // Cadence
  cadenceBreaches: number;
  overdueDecisions: number;

  // Organisation divergence
  divergentOrganisations: number;

  // Oversight cycles
  activeOversightCycles: number;
  completedOversightCycles: number;

  // Governance
  governanceLogCount: number;
  recentGovernanceActions: Array<{
    action: string;
    performedBy: string;
    target: string | null;
    createdAt: Date;
  }>;

  // What would be lost
  counterfactual: {
    totalDecisionsWithoutOversight: number;
    estimatedDegradationPercent: number;
    mostImpactedAreas: string[];
  };
};

/* ─── Data Fetching ──────────────────────────────────────────────────────── */

async function fetchCommandSummary(): Promise<CommandSummary> {
  const now = new Date();

  // 1. Retained decisions
  const retainedDecisions = await prisma.retainedDecision.findMany({
    select: {
      id: true,
      priorityLevel: true,
      status: true,
      createdAt: true,
      _count: { select: { enforcementCycles: true } },
    },
  });

  const activeDecisions = retainedDecisions.filter((d) => d.status === "ACTIVE").length;
  const monitoredDecisions = retainedDecisions.filter((d) => d.status === "MONITORED").length;
  const resolvedDecisions = retainedDecisions.filter((d) => d.status === "RESOLVED").length;

  const decisionsByPriority: Record<string, number> = {};
  const decisionsByStatus: Record<string, number> = {};
  for (const d of retainedDecisions) {
    decisionsByPriority[d.priorityLevel] = (decisionsByPriority[d.priorityLevel] || 0) + 1;
    decisionsByStatus[d.status] = (decisionsByStatus[d.status] || 0) + 1;
  }

  // 2. Enforcement cycles
  const enforcementCycles = await prisma.enforcementCycle.findMany({
    select: {
      id: true,
      retainedDecisionId: true,
      outcomeDelta: true,
      cycleDate: true,
    },
    orderBy: { cycleDate: "desc" },
    take: 200,
  });

  const outcomeDeltas = enforcementCycles
    .map((c) => c.outcomeDelta)
    .filter((d): d is number => d !== null);

  const averageOutcomeDelta =
    outcomeDeltas.length > 0
      ? outcomeDeltas.reduce((a, b) => a + b, 0) / outcomeDeltas.length
      : null;

  const decisionCycleCounts: Record<string, number> = {};
  for (const c of enforcementCycles) {
    decisionCycleCounts[c.retainedDecisionId] =
      (decisionCycleCounts[c.retainedDecisionId] || 0) + 1;
  }

  // 3. Escalations
  const escalations = await prisma.escalationEvent.findMany({
    select: { id: true, triggerType: true, resolvedAt: true },
  });

  const escalationsByTrigger: Record<string, number> = {};
  let unresolvedEscalations = 0;
  for (const e of escalations) {
    escalationsByTrigger[e.triggerType] = (escalationsByTrigger[e.triggerType] || 0) + 1;
    if (!e.resolvedAt) unresolvedEscalations++;
  }

  // 4. Consequence timeline (irreversibility + cost exposure)
  const consequences = await prisma.consequenceTimeline.findMany({
    select: { id: true, score: true, label: true, trend: true, baseRisk: true, timePenalty: true, failurePenalty: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const irreversibilityCounts: { critical: number; escalating: number; stable: number } = { critical: 0, escalating: 0, stable: 0 };
  const byLabel: Record<string, number> = {};
  let totalTimePenalty = 0;
  let totalFailurePenalty = 0;
  let totalBaseRisk = 0;

  for (const c of consequences) {
    if (c.trend === "CRITICAL") irreversibilityCounts.critical++;
    else if (c.trend === "ESCALATING") irreversibilityCounts.escalating++;
    else irreversibilityCounts.stable++;

    byLabel[c.label] = (byLabel[c.label] || 0) + 1;
    totalTimePenalty += c.timePenalty;
    totalFailurePenalty += c.failurePenalty;
    totalBaseRisk += c.baseRisk;
  }

  // 5. Governance log
  const governanceLogs = await prisma.governanceLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { action: true, performedBy: true, target: true, createdAt: true },
  });

  // 6. Pattern detection — look for repeated labels in consequence timeline
  const patternLabels = Object.entries(byLabel)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([label, count]) => ({
      label,
      count,
      trend: count > 5 ? "recurring" : count > 2 ? "emerging" : "sporadic",
    }));

  // 7. Calibration state (model accuracy)
  const calibrationStates = await prisma.calibrationState.findMany({
    where: { status: "ACTIVE" },
    select: { accuracyScore: true, outcomeCount: true },
  });

  // 8. Pattern breaker contracts (cadence breaches)
  const patternBreakers = await prisma.patternBreakerContract.findMany({
    where: { status: "active" },
    select: { id: true, breachCount: true, dueAt: true },
  });

  const cadenceBreaches = patternBreakers.filter((p) => p.breachCount > 0).length;
  const overdueDecisions = patternBreakers.filter((p) => p.dueAt && p.dueAt < now).length;

  // 9. Organisation divergence — count organisations with active campaigns not in ALIGNED band
  const divergentOrgs = await prisma.alignmentSnapshot.count({
    where: {
      campaign: {
        status: { not: "completed" },
      },
    },
  });

  // 10. Oversight cycles
  const oversightCycles = await prisma.enforcementCycle.groupBy({
    by: ["retainedDecisionId"],
    _count: { id: true },
  });

  const cycleCounts = oversightCycles.map((c) => c._count.id);

  // 11. Decision contact ledger (counsel history)
  const contactLedgerCount = await prisma.decisionContactLedger.count();

  // 12. Counterfactual: what would be lost
  const totalDecisionsWithoutOversight = retainedDecisions.length;
  const estimatedDegradationPercent = Math.min(
    100,
    Math.round(
      (unresolvedEscalations / Math.max(escalations.length, 1)) * 50 +
        (cadenceBreaches / Math.max(patternBreakers.length, 1)) * 30 +
        (consequences.filter((c) => c.trend === "CRITICAL").length /
          Math.max(consequences.length, 1)) *
          20
    )
  );

  // Most impacted areas — top labels from consequence timeline
  const mostImpactedAreas = patternLabels.slice(0, 5).map((p) => p.label);

  return {
    activeDecisions,
    monitoredDecisions,
    resolvedDecisions,
    decisionsByPriority,
    decisionsByStatus,
    totalEnforcementCycles: enforcementCycles.length,
    latestOutcomeDeltas: outcomeDeltas.slice(0, 20),
    averageOutcomeDelta,
    cycleCountByDecision: cycleCounts,
    totalEscalations: escalations.length,
    escalationsByTrigger,
    unresolvedEscalations,
    recurringPatterns: patternLabels,
    costExposure: {
      totalAtRisk: totalBaseRisk,
      byPriority: decisionsByPriority,
      averageTimePenalty:
        consequences.length > 0
          ? Math.round(totalTimePenalty / consequences.length)
          : 0,
      averageFailurePenalty:
        consequences.length > 0
          ? Math.round(totalFailurePenalty / consequences.length)
          : 0,
    },
    irreversibility: {
      criticalCount: irreversibilityCounts.critical,
      escalatingCount: irreversibilityCounts.escalating,
      stableCount: irreversibilityCounts.stable,
      byLabel,
    },
    cadenceBreaches,
    overdueDecisions,
    divergentOrganisations: divergentOrgs,
    activeOversightCycles: oversightCycles.length,
    completedOversightCycles: resolvedDecisions,
    governanceLogCount: governanceLogs.length,
    recentGovernanceActions: governanceLogs,
    counterfactual: {
      totalDecisionsWithoutOversight,
      estimatedDegradationPercent,
      mostImpactedAreas,
    },
  };
}

/* ─── UI Components ──────────────────────────────────────────────────────── */

function MetricCard({
  label,
  value,
  sub,
  accent = false,
  critical = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  critical?: boolean;
}) {
  return (
    <div
      className={`rounded border p-4 ${
        critical
          ? "border-red-500/30 bg-red-500/5"
          : accent
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-white/5 bg-zinc-900/20"
      }`}
    >
      <p className="text-[8px] font-mono uppercase tracking-[0.24em] text-white/40">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-light ${
          critical
            ? "text-red-400"
            : accent
              ? "text-amber-400"
              : "text-white"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-[9px] font-mono text-white/30">{sub}</p>}
    </div>
  );
}

function SectionHeading({
  children,
  badge,
}: {
  children: React.ReactNode;
  badge?: string | number;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
      <h3 className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/40">
        {children}
      </h3>
      {badge !== undefined && (
        <span className="text-[8px] font-mono uppercase tracking-wider text-white/20">
          {badge}
        </span>
      )}
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  color = "bg-amber-500/60",
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-[10px] font-mono text-white/50 truncate text-right">
        {label}
      </span>
      <div className="flex-1 h-4 bg-zinc-800 rounded-sm overflow-hidden">
        <div
          className={`h-full ${color} rounded-sm transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-[10px] font-mono text-white/60 text-right">
        {value}
      </span>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default async function InstitutionalCommandPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isAuthorizedAdminSession(session)) {
    redirect("/admin/login");
  }

  const data = await fetchCommandSummary();

  const maxPriority = Math.max(
    ...Object.values(data.decisionsByPriority),
    1
  );
  const maxEscalation = Math.max(
    ...Object.values(data.escalationsByTrigger),
    1
  );
  const maxPattern = Math.max(
    ...data.recurringPatterns.map((p) => p.count),
    1
  );

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="mb-8 border border-white/5 bg-zinc-900/20 p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block h-3 w-3 rounded-full bg-amber-500/60" />
          <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-amber-500/50">
            Governed Oversight Environment
          </span>
        </div>
        <h1 className="font-serif text-3xl font-light text-white">
          Institutional Command
        </h1>
        <p className="mt-1 text-xs text-white/30 font-mono">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* ── Row 1: Active decisions ─────────────────────── */}
      <div className="mb-8">
        <SectionHeading badge={`${data.activeDecisions + data.monitoredDecisions + data.resolvedDecisions} total`}>
          Active Institutional Decisions
        </SectionHeading>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard
            label="Active"
            value={data.activeDecisions}
            sub="Currently enforced"
            accent
          />
          <MetricCard
            label="Monitored"
            value={data.monitoredDecisions}
            sub="Under observation"
          />
          <MetricCard
            label="Resolved"
            value={data.resolvedDecisions}
            sub="Closed"
          />
          <MetricCard
            label="Enforcement Cycles"
            value={data.totalEnforcementCycles}
            sub={`Avg ${data.averageOutcomeDelta !== null ? data.averageOutcomeDelta.toFixed(1) : "—"} delta`}
          />
          <MetricCard
            label="Avg Outcome Delta"
            value={data.averageOutcomeDelta !== null ? data.averageOutcomeDelta.toFixed(2) : "—"}
            sub="Per enforcement cycle"
            accent={data.averageOutcomeDelta !== null && data.averageOutcomeDelta < 0}
            critical={data.averageOutcomeDelta !== null && data.averageOutcomeDelta < -5}
          />
        </div>
        <div className="mt-3 space-y-1">
          {Object.entries(data.decisionsByPriority).map(([k, v]) => (
            <Bar key={k} label={k} value={v} max={maxPriority} />
          ))}
        </div>
      </div>

      {/* ── Row 2: Cost exposure + Irreversibility ──────── */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cost exposure */}
        <div className="border border-white/5 bg-zinc-900/20 p-4">
          <SectionHeading>Cost Exposure</SectionHeading>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MetricCard
              label="Total at Risk"
              value={data.costExposure.totalAtRisk}
              sub="Aggregate base risk"
              accent={data.costExposure.totalAtRisk > 100}
              critical={data.costExposure.totalAtRisk > 500}
            />
            <MetricCard
              label="Avg Time Penalty"
              value={data.costExposure.averageTimePenalty}
              sub="Per consequence"
            />
            <MetricCard
              label="Avg Failure Penalty"
              value={data.costExposure.averageFailurePenalty}
              sub="Per consequence"
            />
          </div>
          <div className="space-y-1">
            {Object.entries(data.costExposure.byPriority).map(([k, v]) => (
              <Bar key={k} label={k} value={v} max={maxPriority} />
            ))}
          </div>
        </div>

        {/* Irreversibility */}
        <div className="border border-white/5 bg-zinc-900/20 p-4">
          <SectionHeading>Irreversibility Movement</SectionHeading>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MetricCard
              label="Critical"
              value={data.irreversibility.criticalCount}
              sub="Hardening"
              critical={data.irreversibility.criticalCount > 0}
            />
            <MetricCard
              label="Escalating"
              value={data.irreversibility.escalatingCount}
              sub="Worsening"
              accent={data.irreversibility.escalatingCount > 0}
            />
            <MetricCard
              label="Stable"
              value={data.irreversibility.stableCount}
              sub="Contained"
            />
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {Object.entries(data.irreversibility.byLabel)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([k, v]) => (
                <Bar
                  key={k}
                  label={k}
                  value={v}
                  max={Math.max(...Object.values(data.irreversibility.byLabel), 1)}
                />
              ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Escalations + Patterns ───────────────── */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Escalations */}
        <div className="border border-white/5 bg-zinc-900/20 p-4">
          <SectionHeading badge={`${data.unresolvedEscalations} unresolved`}>
            Escalation History
          </SectionHeading>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <MetricCard
              label="Total Escalations"
              value={data.totalEscalations}
              sub="All time"
            />
            <MetricCard
              label="Unresolved"
              value={data.unresolvedEscalations}
              sub="Still open"
              critical={data.unresolvedEscalations > 0}
            />
          </div>
          <div className="space-y-1">
            {Object.entries(data.escalationsByTrigger).map(([k, v]) => (
              <Bar key={k} label={k} value={v} max={maxEscalation} />
            ))}
          </div>
        </div>

        {/* Recurring patterns */}
        <div className="border border-white/5 bg-zinc-900/20 p-4">
          <SectionHeading>Recurring Patterns</SectionHeading>
          {data.recurringPatterns.length === 0 ? (
            <p className="text-xs text-white/30 font-mono">No recurring patterns detected.</p>
          ) : (
            <div className="space-y-1">
              {data.recurringPatterns.map((p) => (
                <Bar
                  key={p.label}
                  label={p.label}
                  value={p.count}
                  max={maxPattern}
                  color={
                    p.trend === "recurring"
                      ? "bg-red-500/50"
                      : p.trend === "emerging"
                        ? "bg-amber-500/50"
                        : "bg-zinc-600/50"
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Cadence + Oversight + Divergence ─────── */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Cadence Breaches"
          value={data.cadenceBreaches}
          sub="Contracts with missed cycles"
          critical={data.cadenceBreaches > 0}
        />
        <MetricCard
          label="Overdue Decisions"
          value={data.overdueDecisions}
          sub="Past deadline"
          critical={data.overdueDecisions > 0}
        />
        <MetricCard
          label="Organisation Divergence"
          value={data.divergentOrganisations}
          sub="Active campaigns not aligned"
          accent={data.divergentOrganisations > 0}
        />
      </div>

      {/* ── Row 5: Oversight cycles + Governance ────────── */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Oversight */}
        <div className="border border-white/5 bg-zinc-900/20 p-4">
          <SectionHeading>Oversight Cycle Status</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Active Cycles"
              value={data.activeOversightCycles}
              sub="Currently running"
              accent
            />
            <MetricCard
              label="Completed"
              value={data.completedOversightCycles}
              sub="Resolved decisions"
            />
          </div>
          {data.cycleCountByDecision.length > 0 && (
            <div className="mt-4">
              <p className="text-[8px] font-mono uppercase tracking-[0.24em] text-white/30 mb-2">
                Cycles per Decision
              </p>
              <div className="flex items-end gap-1 h-16">
                {data.cycleCountByDecision.slice(0, 20).map((count, i) => {
                  const max = Math.max(...data.cycleCountByDecision, 1);
                  const height = (count / max) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-amber-500/40 rounded-t"
                      style={{ height: `${height}%` }}
                      title={`Decision ${i + 1}: ${count} cycles`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Governance log */}
        <div className="border border-white/5 bg-zinc-900/20 p-4">
          <SectionHeading badge={`${data.governanceLogCount} recent`}>
            Boardroom & Counsel History
          </SectionHeading>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {data.recentGovernanceActions.length === 0 ? (
              <p className="text-xs text-white/30 font-mono">No governance actions recorded.</p>
            ) : (
              data.recentGovernanceActions.map((log) => (
                <div
                  key={`${log.createdAt.toISOString()}-${log.action}`}
                  className="border-l-2 border-amber-500/20 pl-3 py-1"
                >
                  <p className="text-[9px] font-mono text-white/60">
                    {log.action}
                  </p>
                  <p className="text-[8px] font-mono text-white/30 mt-0.5">
                    {log.performedBy}
                    {log.target ? ` → ${log.target}` : ""}
                  </p>
                  <p className="text-[7px] font-mono text-white/20">
                    {log.createdAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Row 6: Counterfactual ───────────────────────── */}
      <div className="border border-red-500/20 bg-red-500/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500/60 animate-pulse" />
          <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-red-400/60">
            What Would Be Lost If Oversight Stopped
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            label="Decisions at Risk"
            value={data.counterfactual.totalDecisionsWithoutOversight}
            sub="Would lose governance"
            critical
          />
          <MetricCard
            label="Estimated Degradation"
            value={`${data.counterfactual.estimatedDegradationPercent}%`}
            sub="Projected decline"
            critical={data.counterfactual.estimatedDegradationPercent > 30}
          />
          <div className="border border-white/5 bg-zinc-900/20 p-4">
            <p className="text-[8px] font-mono uppercase tracking-[0.24em] text-white/40 mb-2">
              Most Impacted Areas
            </p>
            {data.counterfactual.mostImpactedAreas.length === 0 ? (
              <p className="text-xs text-white/30 font-mono">Insufficient data.</p>
            ) : (
              <ul className="space-y-1">
                {data.counterfactual.mostImpactedAreas.map((area) => (
                  <li
                    key={area}
                    className="text-[10px] font-mono text-red-400/70 flex items-center gap-2"
                  >
                    <span className="inline-block h-1 w-1 rounded-full bg-red-500/50" />
                    {area}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────── */}
      <div className="mt-8 border-t border-white/5 pt-4">
        <p className="text-[7px] font-mono uppercase tracking-[0.4em] text-white/20 text-center">
          Governed Oversight Environment — Internal Use Only
        </p>
      </div>
    </div>
  );
}
