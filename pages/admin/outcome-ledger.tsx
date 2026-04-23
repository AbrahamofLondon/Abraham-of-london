import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Layout from "@/components/Layout";
import { requireAdminPage } from "@/lib/access/server";
import { prisma } from "@/lib/prisma.server";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type LedgerEntry = {
  id: string;
  // Decision
  decisionText: string;
  sourceStage: string;
  decisionKey: string | null;
  aiExposureLevel: string;
  aiRiskClassification: string;
  // Contradiction
  contradictions: Array<{ label: string; severity: string; confidence: number }>;
  // Enforcement
  enforcementStatus: string | null;
  avoidanceCount: number;
  deadline: string | null;
  executedAt: string | null;
  escalatedAt: string | null;
  // Outcome
  outcomeClassification: string | null;
  magnitudeOfChange: number | null;
  effectivenessScore: number | null;
  decisionVelocityDelta: number | null;
  aiCapabilityShift: number | null;
  // Cost
  costOfDelay: string | null;
  constraintText: string | null;
  // Timeline
  createdAt: string;
  // Retainer
  retainer: {
    contractId: string;
    tier: string;
    status: string;
    priorityLevel: string;
    retainedDecisionStatus: string;
    cycleCount: number;
    latestOutcomeDelta: number | null;
  } | null;
};

type PageProps = {
  entries: LedgerEntry[];
  stats: {
    total: number;
    resolved: number;
    improved: number;
    stable: number;
    deteriorated: number;
    avgEffectiveness: number;
    avgMagnitude: number;
  };
};

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.20)" }}>—</span>;
  const colors: Record<string, string> = {
    executed: "rgba(110,231,183,0.70)",
    resolved: "rgba(110,231,183,0.70)",
    improved: `${GOLD}CC`,
    pending: "rgba(255,255,255,0.40)",
    stable: "rgba(255,255,255,0.40)",
    blocked: "rgba(253,186,116,0.70)",
    escalated: "rgba(252,165,165,0.70)",
    deteriorated: "rgba(252,165,165,0.70)",
    failed: "rgba(252,165,165,0.70)",
  };
  return (
    <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: colors[status.toLowerCase()] ?? "rgba(255,255,255,0.30)" }}>
      {status}
    </span>
  );
}

const OutcomeLedgerPage: NextPage<PageProps> = ({ entries, stats }) => {
  return (
    <Layout title="Outcome Ledger" description="Decision authority track record" fullWidth>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-7xl">
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}80` }}>
            Decision authority system
          </p>
          <h1 className="mt-4" style={{ ...serif, fontSize: "clamp(2rem, 4vw, 3rem)", color: "rgba(255,255,255,0.90)" }}>
            Outcome Ledger
          </h1>
          <p className="mt-3 max-w-2xl" style={{ ...serif, fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.40)" }}>
            Every decision traced from identification through enforcement to verified outcome.
            This is the system&apos;s track record — provable, not claimed.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { label: "All AI risk", href: "/admin/outcome-ledger" },
              { label: "High AI exposure", href: "/admin/outcome-ledger?aiRisk=HIGH" },
              { label: "Critical AI exposure", href: "/admin/outcome-ledger?aiRisk=CRITICAL" },
              { label: "Velocity improved", href: "/admin/outcome-ledger?velocityImproved=true" },
            ].map((filter) => (
              <a key={filter.href} href={filter.href} style={{ ...mono, border: "1px solid rgba(255,255,255,0.08)", padding: "0.45rem 0.65rem", fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(147,197,253,0.66)", textDecoration: "none" }}>
                {filter.label}
              </a>
            ))}
          </div>

          {/* Stats strip */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[
              { label: "Total decisions", value: String(stats.total) },
              { label: "Resolved", value: String(stats.resolved), color: "rgba(110,231,183,0.60)" },
              { label: "Improved", value: String(stats.improved), color: `${GOLD}BB` },
              { label: "Stable", value: String(stats.stable) },
              { label: "Deteriorated", value: String(stats.deteriorated), color: "rgba(252,165,165,0.60)" },
              { label: "Avg effectiveness", value: `${Math.round(stats.avgEffectiveness)}%` },
              { label: "Avg magnitude", value: stats.avgMagnitude > 0 ? `+${stats.avgMagnitude.toFixed(1)}` : stats.avgMagnitude.toFixed(1) },
            ].map((s) => (
              <div key={s.label} style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem" }}>
                <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>{s.label}</div>
                <div style={{ ...mono, fontSize: "14px", color: s.color ?? "rgba(255,255,255,0.55)", marginTop: "0.25rem" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Ledger entries */}
          <div className="mt-10 space-y-4">
            {entries.length === 0 && (
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "2rem", textAlign: "center" }}>
                <p style={{ ...serif, color: "rgba(255,255,255,0.30)" }}>No verified outcomes yet. Decisions are accumulating evidence.</p>
              </div>
            )}
            {entries.map((entry) => (
              <div key={entry.id} style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1rem" }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
                      {entry.sourceStage} · {new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {entry.retainer && (
                      <span className="ml-2" style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(110,231,183,0.62)" }}>
                        retained · {entry.retainer.tier} · {entry.retainer.priorityLevel}
                      </span>
                    )}
                    <span className="ml-2" style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(147,197,253,0.62)" }}>
                      AI {entry.aiExposureLevel} · {entry.aiRiskClassification}
                    </span>
                    <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.5, color: "rgba(255,255,255,0.60)", marginTop: "0.25rem" }}>
                      {entry.decisionText}
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <StatusBadge status={entry.enforcementStatus} />
                    {entry.outcomeClassification && (
                      <>
                        <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.12)" }}>→</span>
                        <StatusBadge status={entry.outcomeClassification} />
                      </>
                    )}
                  </div>
                </div>

                {/* Contradiction evidence */}
                {entry.contradictions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.contradictions.map((c, i) => (
                      <span key={i} style={{ ...mono, fontSize: "6.5px", border: "1px solid rgba(252,165,165,0.15)", padding: "2px 6px", color: "rgba(252,165,165,0.50)" }}>
                        {c.label} · {c.severity} · {Math.round(c.confidence * 100)}%
                      </span>
                    ))}
                  </div>
                )}

                {/* Chain detail */}
                <div className="mt-3 grid gap-2 sm:grid-cols-4" style={{ fontSize: "0" }}>
                  {[
                    { label: "Avoidance", value: entry.avoidanceCount > 0 ? `${entry.avoidanceCount}×` : "—" },
                    { label: "Effectiveness", value: entry.effectivenessScore != null ? `${Math.round(entry.effectivenessScore)}%` : "—" },
                    { label: "Magnitude", value: entry.magnitudeOfChange != null ? (entry.magnitudeOfChange > 0 ? `+${entry.magnitudeOfChange.toFixed(1)}` : entry.magnitudeOfChange.toFixed(1)) : "—" },
                    { label: "Velocity delta", value: entry.decisionVelocityDelta != null ? (entry.decisionVelocityDelta > 0 ? `+${entry.decisionVelocityDelta}` : String(entry.decisionVelocityDelta)) : "—" },
                    { label: "AI capability shift", value: entry.aiCapabilityShift != null ? (entry.aiCapabilityShift > 0 ? `+${entry.aiCapabilityShift}` : String(entry.aiCapabilityShift)) : "—" },
                    { label: "Cost of delay", value: entry.costOfDelay ?? "—" },
                    { label: "Retainer cycles", value: entry.retainer ? String(entry.retainer.cycleCount) : "—" },
                  ].map((d) => (
                    <div key={d.label}>
                      <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>{d.label}</span>
                      <div style={{ ...mono, fontSize: "9px", color: "rgba(255,255,255,0.40)", marginTop: "2px" }}>{d.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if (!auth.authorized) return auth.redirect as any;

  // Fetch decision objects with their enforcement logs and outcome records
  const decisionObjects = await prisma.diagnosticDecisionObject.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      strategyLogs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      retainedDecisions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          contract: true,
          enforcementCycles: {
            orderBy: { cycleDate: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  // Get contradiction nodes for these journeys
  const journeyIds = [...new Set(decisionObjects.map((d) => d.journeyId).filter(Boolean))];
  const contradictionNodes = journeyIds.length > 0
    ? await prisma.diagnosticEvidenceNode.findMany({
        where: { journeyId: { in: journeyIds as string[] }, kind: "contradiction" },
      })
    : [];

  // Get outcome verification records
  const outcomeRecords = await prisma.outcomeVerificationRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const outcomeByJourney = new Map(outcomeRecords.map((o) => [o.followUpJourneyId ?? o.baselineJourneyId, o]));

  // Build entries
  let entries: LedgerEntry[] = decisionObjects.map((d) => {
    const log = d.strategyLogs[0];
    const retainedDecision = d.retainedDecisions[0];
    const contradictions = contradictionNodes
      .filter((n) => n.journeyId === d.journeyId)
      .map((n) => ({ label: n.label, severity: n.severity, confidence: n.confidence }));
    const outcome = outcomeByJourney.get(d.journeyId ?? "");

    return {
      id: d.id,
      decisionText: d.decisionText,
      sourceStage: d.sourceStage,
      decisionKey: d.decisionKey,
      aiExposureLevel: d.aiExposureLevel,
      aiRiskClassification: String((d.normalized as any)?.aiRiskClassification ?? d.aiExposureLevel),
      contradictions,
      enforcementStatus: log?.status ?? null,
      avoidanceCount: log?.avoidanceCount ?? 0,
      deadline: log?.deadline?.toISOString() ?? null,
      executedAt: log?.executedAt?.toISOString() ?? null,
      escalatedAt: log?.escalatedAt?.toISOString() ?? null,
      outcomeClassification: outcome?.outcomeClassification ?? null,
      magnitudeOfChange: outcome?.magnitudeOfChange ?? null,
      effectivenessScore: outcome?.effectivenessScore ?? null,
      costOfDelay: d.costOfDelayText,
      constraintText: d.constraintText,
      createdAt: d.createdAt.toISOString(),
      retainer: retainedDecision ? {
        contractId: retainedDecision.contractId,
        tier: retainedDecision.contract.tier,
        status: retainedDecision.contract.status,
        priorityLevel: retainedDecision.priorityLevel,
        retainedDecisionStatus: retainedDecision.status,
        cycleCount: retainedDecision.enforcementCycles.length,
        latestOutcomeDelta: retainedDecision.enforcementCycles[0]?.outcomeDelta ?? null,
      } : null,
      decisionVelocityDelta: outcome?.decisionVelocityDelta ?? null,
      aiCapabilityShift: outcome?.aiCapabilityShift ?? null,
    };
  });

  const aiRiskFilter = typeof ctx.query.aiRisk === "string" ? ctx.query.aiRisk.toUpperCase() : "";
  const velocityImproved = ctx.query.velocityImproved === "true";
  if (aiRiskFilter) {
    entries = entries.filter((entry) =>
      entry.aiExposureLevel.toUpperCase() === aiRiskFilter ||
      entry.aiRiskClassification.toUpperCase() === aiRiskFilter,
    );
  }
  if (velocityImproved) {
    entries = entries.filter((entry) => (entry.decisionVelocityDelta ?? 0) > 0);
  }

  // Compute stats
  const withOutcome = entries.filter((e) => e.outcomeClassification);
  const stats = {
    total: entries.length,
    resolved: withOutcome.filter((e) => e.outcomeClassification === "resolved").length,
    improved: withOutcome.filter((e) => e.outcomeClassification === "improved").length,
    stable: withOutcome.filter((e) => e.outcomeClassification === "stable").length,
    deteriorated: withOutcome.filter((e) => e.outcomeClassification === "deteriorated").length,
    avgEffectiveness: withOutcome.length > 0
      ? withOutcome.reduce((s, e) => s + (e.effectivenessScore ?? 50), 0) / withOutcome.length
      : 0,
    avgMagnitude: withOutcome.length > 0
      ? withOutcome.reduce((s, e) => s + (e.magnitudeOfChange ?? 0), 0) / withOutcome.length
      : 0,
  };

  return { props: { entries, stats } };
};

export default OutcomeLedgerPage;
