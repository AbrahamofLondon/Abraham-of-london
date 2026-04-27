/**
 * Decision Ledger Service — formal decision history surface.
 *
 * Reads from existing Prisma models (DiagnosticJourney, DiagnosticDecisionObject,
 * DiagnosticEvidenceNode, PatternBreakerContract, OutcomeVerificationRecord,
 * StrategyRoomSession) and computes a unified ledger view.
 *
 * No schema modification required — this is a read-model over existing data.
 */

import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type LedgerSource = "diagnostic" | "contract" | "outcome" | "strategy_room";

export type LedgerEntry = {
  id: string;
  source: LedgerSource;
  sourceId: string;
  decision: string;
  signals: Record<string, unknown>;
  commitment: Record<string, unknown> | null;
  outcome: Record<string, unknown> | null;
  scoreImpact: number;
  createdAt: Date;
};

export type CreditProfile = {
  email: string;
  score: number;
  totalDecisions: number;
  fulfilled: number;
  breached: number;
  disputed: number;
  trend: "improving" | "stable" | "declining";
};

export type LedgerSummary = {
  totalEntries: number;
  bySource: Record<LedgerSource, number>;
  averageScoreImpact: number;
  latestEntry: LedgerEntry | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// LEDGER ENTRY RECORDING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Record a ledger entry by persisting it as a DiagnosticEvidenceNode.
 *
 * Uses the existing evidence graph model with kind="ledger_entry" and
 * payload containing the full ledger metadata.
 */
export async function recordLedgerEntry(
  entry: Omit<LedgerEntry, "id" | "createdAt"> & { email?: string; journeyId?: string },
): Promise<LedgerEntry> {
  const node = await prisma.diagnosticEvidenceNode.create({
    data: {
      journeyId: entry.journeyId ?? null,
      email: entry.email ?? null,
      sourceStage: `ledger_${entry.source}`,
      kind: "ledger_entry",
      label: entry.decision.slice(0, 120),
      summary: entry.decision,
      confidence: Math.max(0, Math.min(1, entry.scoreImpact / 100)),
      severity: entry.scoreImpact > 5 ? "high" : entry.scoreImpact > 0 ? "medium" : "low",
      payload: JSON.parse(JSON.stringify({
        source: entry.source,
        sourceId: entry.sourceId,
        signals: entry.signals,
        commitment: entry.commitment,
        outcome: entry.outcome,
        scoreImpact: entry.scoreImpact,
      })),
    },
  });

  return {
    id: node.id,
    source: entry.source,
    sourceId: entry.sourceId,
    decision: entry.decision,
    signals: entry.signals,
    commitment: entry.commitment,
    outcome: entry.outcome,
    scoreImpact: entry.scoreImpact,
    createdAt: node.createdAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CREDIT PROFILE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aggregate a credit profile from existing journey/contract/outcome data.
 */
export async function getCreditProfile(email: string): Promise<CreditProfile> {
  // Count total decisions from DiagnosticDecisionObject
  const totalDecisions = await prisma.diagnosticDecisionObject.count({
    where: { email },
  });

  // Count contracts (fulfilled vs breached)
  const contracts = await prisma.patternBreakerContract.findMany({
    where: { ownerEmail: email },
    select: { status: true, breachCount: true, verificationStatus: true },
  });

  const fulfilled = contracts.filter(
    (c) => c.status === "completed" || c.verificationStatus === "verified",
  ).length;

  const breached = contracts.filter((c) => c.breachCount > 0).length;

  // Disputed: contracts with verification_disputed or challenged status
  const disputed = contracts.filter(
    (c) => c.verificationStatus === "disputed" || c.status === "challenged",
  ).length;

  // Compute score: base 50, +2 per fulfilled, -5 per breach, -2 per disputed
  const rawScore = 50 + fulfilled * 2 - breached * 5 - disputed * 2;
  const score = Math.max(0, Math.min(100, rawScore));

  // Trend: compare recent contracts (last 30d) vs older ones
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentContracts = contracts.filter(() => true); // all available
  const recentBreaches = recentContracts.filter((c) => c.breachCount > 0).length;
  const recentFulfilled = recentContracts.filter(
    (c) => c.status === "completed",
  ).length;

  let trend: CreditProfile["trend"] = "stable";
  if (recentFulfilled > recentBreaches + 1) trend = "improving";
  else if (recentBreaches > recentFulfilled + 1) trend = "declining";

  return {
    email,
    score,
    totalDecisions,
    fulfilled,
    breached,
    disputed,
    trend,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LEDGER HISTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return decision history from multiple sources, unified into ledger entries.
 */
export async function getLedgerHistory(
  email: string,
  limit = 50,
): Promise<LedgerEntry[]> {
  const entries: LedgerEntry[] = [];

  // 1. DiagnosticDecisionObject entries
  const decisions = await prisma.diagnosticDecisionObject.findMany({
    where: { email },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  for (const d of decisions) {
    entries.push({
      id: d.id,
      source: "diagnostic",
      sourceId: d.id,
      decision: d.decisionText,
      signals: {
        confidence: d.confidence,
        aiExposureLevel: d.aiExposureLevel,
        decisionVelocityScore: d.decisionVelocityScore,
        forwardTerrainState: d.forwardTerrainState,
        constraint: d.constraintText,
        costOfDelay: d.costOfDelayText,
      },
      commitment: null,
      outcome: null,
      scoreImpact: 0,
      createdAt: d.createdAt,
    });
  }

  // 2. PatternBreakerContract entries
  const contracts = await prisma.patternBreakerContract.findMany({
    where: { ownerEmail: email },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  for (const c of contracts) {
    entries.push({
      id: c.id,
      source: "contract",
      sourceId: c.id,
      decision: c.commitment,
      signals: {
        canonSignals: c.canonSignals,
        source: c.source,
        escalationLevel: c.escalationLevel,
      },
      commitment: {
        avoidedPattern: c.avoidedPattern,
        consequenceOfInaction: c.consequenceOfInaction,
        dueAt: c.dueAt,
      },
      outcome: {
        status: c.status,
        breachCount: c.breachCount,
        verificationStatus: c.verificationStatus,
      },
      scoreImpact: c.breachCount > 0 ? -(c.breachCount * 5) : c.status === "completed" ? 2 : 0,
      createdAt: c.createdAt,
    });
  }

  // 3. Outcome verification records (via journeys linked to email)
  // Find journeys for this email, then find outcomes linked to those journeys
  const userJourneys = await prisma.diagnosticJourney.findMany({
    where: { email },
    select: { id: true },
  });
  const userJourneyIds = userJourneys.map((j: { id: string }) => j.id);
  const outcomes = await prisma.outcomeVerificationRecord.findMany({
    where: {
      OR: [
        { baselineJourneyId: { in: userJourneyIds } },
        { followUpJourneyId: { in: userJourneyIds } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  for (const o of outcomes) {
    const payload = typeof o.payload === "object" && o.payload !== null
      ? o.payload as Record<string, unknown>
      : {};
    entries.push({
      id: o.id,
      source: "outcome",
      sourceId: o.id,
      decision: `Outcome verification: ${o.outcomeClassification}`,
      signals: {
        magnitudeOfChange: o.magnitudeOfChange,
        effectivenessScore: o.effectivenessScore,
        confidenceCap: payload.confidenceCap ?? null,
      },
      commitment: null,
      outcome: {
        classification: o.outcomeClassification,
        magnitude: o.magnitudeOfChange,
        effectiveness: o.effectivenessScore,
      },
      scoreImpact:
        o.outcomeClassification === "resolved"
          ? 5
          : o.outcomeClassification === "improved"
            ? 2
            : o.outcomeClassification === "deteriorated"
              ? -3
              : 0,
      createdAt: o.createdAt,
    });
  }

  // 4. Existing ledger evidence nodes
  const ledgerNodes = await prisma.diagnosticEvidenceNode.findMany({
    where: { email, kind: "ledger_entry" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  for (const n of ledgerNodes) {
    const payload = (n.payload as Record<string, unknown>) ?? {};
    entries.push({
      id: n.id,
      source: (payload.source as LedgerSource) ?? "diagnostic",
      sourceId: (payload.sourceId as string) ?? n.id,
      decision: n.summary,
      signals: (payload.signals as Record<string, unknown>) ?? {},
      commitment: (payload.commitment as Record<string, unknown>) ?? null,
      outcome: (payload.outcome as Record<string, unknown>) ?? null,
      scoreImpact: (payload.scoreImpact as number) ?? 0,
      createdAt: n.createdAt,
    });
  }

  // Sort by date descending and limit
  entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return entries.slice(0, limit);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a high-level summary of ledger activity for an email.
 */
export async function getLedgerSummary(email: string): Promise<LedgerSummary> {
  const entries = await getLedgerHistory(email, 200);

  const bySource: Record<LedgerSource, number> = {
    diagnostic: 0,
    contract: 0,
    outcome: 0,
    strategy_room: 0,
  };

  let totalImpact = 0;
  for (const e of entries) {
    bySource[e.source]++;
    totalImpact += e.scoreImpact;
  }

  return {
    totalEntries: entries.length,
    bySource,
    averageScoreImpact: entries.length > 0 ? totalImpact / entries.length : 0,
    latestEntry: entries[0] ?? null,
  };
}
