/**
 * lib/memory/pattern-observer.ts
 *
 * Pattern Observer — turns accumulated decisions and outcomes into
 * user-specific intelligence.
 *
 * This is what makes "compounding intelligence" true in runtime.
 * Without this, the estate is a filing cabinet. With it, the fifth
 * decision is materially sharper than the first.
 *
 * Inputs:
 * - DecisionOutcomeRecord (Return Brief submissions)
 * - OutcomeHypothesis (open/closed)
 * - DecisionInstrumentRun (instrument history)
 * - BoardroomBriefOrder (brief history)
 *
 * Outputs:
 * - PatternObservation records persisted to DB
 * - Inline pattern summaries for surfacing in Decision Centre / Strategy Room
 */

import { prisma } from "@/lib/prisma.server";

// ── Types ────────────────────────────────────────────────────────────────────

export type PatternType =
  | "RECURRING_CONSTRAINT"
  | "AUTHORITY_FAILURE"
  | "EVIDENCE_GAP"
  | "OWNER_DELAY"
  | "DECISION_CLASS_TREND"
  | "GOVERNANCE_DRIFT";

export type RiskOfRepeat = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type PatternSurface =
  | "decision_centre"
  | "strategy_room"
  | "return_brief"
  | "retainer_dashboard"
  | "executive_reporting"
  | "boardroom_brief_followup";

export type PatternObservationRecord = {
  id: string;
  userId: string | null;
  userEmail: string | null;
  organisationId: string | null;
  patternType: PatternType;
  patternLabel: string;
  patternDetail: string | null;
  observationCount: number;
  sourceRunIds: string[];
  recommendedAction: string | null;
  riskOfRepeat: RiskOfRepeat | null;
  surfaceIn: PatternSurface[];
  acknowledgedAt: Date | null;
  dismissedAt: Date | null;
  status: "ACTIVE" | "ACKNOWLEDGED" | "DISMISSED" | "RESOLVED";
  createdAt: Date;
  updatedAt: Date;
};

export type PatternObserverInput = {
  userEmail: string;
  userId?: string | null;
  organisationId?: string | null;
};

export type ObservedPattern = {
  patternType: PatternType;
  patternLabel: string;
  patternDetail: string;
  observationCount: number;
  sourceRunIds: string[];
  recommendedAction: string;
  riskOfRepeat: RiskOfRepeat;
  surfaceIn: PatternSurface[];
};

export type PatternObserverOutput = {
  userEmail: string;
  totalDecisions: number;
  totalOutcomes: number;
  patterns: ObservedPattern[];
  highRiskPatterns: ObservedPattern[];
  actionableObservation: string | null;
  observedAt: Date;
};

// ── Minimum observation threshold ─────────────────────────────────────────────
// Patterns are not surfaced until enough data exists to be meaningful.
const MIN_DECISIONS_FOR_PATTERN = 3;

// ── Core Observer ─────────────────────────────────────────────────────────────

/**
 * Run the full pattern observer for a user.
 * Reads from all relevant tables and generates/updates PatternObservation records.
 *
 * Call this:
 * - When a Return Brief is submitted
 * - When an instrument run completes
 * - On retainer cycle close
 * - Periodically by background job
 */
export async function observePatterns(
  input: PatternObserverInput,
): Promise<PatternObserverOutput> {
  const { userEmail, userId, organisationId } = input;

  // ── Load raw data ──────────────────────────────────────────────────────────
  const [outcomeRecords, instrumentRuns, hypotheses] = await Promise.all([
    prisma.decisionOutcomeRecord.findMany({
      where: { submittedByEmail: userEmail },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.decisionInstrumentRun.findMany({
      where: { userEmail },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.outcomeHypothesis.findMany({
      where: { userEmail },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const totalDecisions = instrumentRuns.length + hypotheses.length;
  const totalOutcomes = outcomeRecords.length;

  // ── Pattern detection ──────────────────────────────────────────────────────
  const detected: ObservedPattern[] = [];

  // 1. OWNER_DELAY — decisions repeatedly deferred
  if (totalDecisions >= MIN_DECISIONS_FOR_PATTERN) {
    const deferredOutcomes = outcomeRecords.filter(
      (r) => r.outcomeClass === "DEFERRED",
    );
    if (deferredOutcomes.length >= 2) {
      const deferralRate = deferredOutcomes.length / Math.max(outcomeRecords.length, 1);
      detected.push({
        patternType: "OWNER_DELAY",
        patternLabel: "Repeated decision deferral pattern detected",
        patternDetail:
          `${deferredOutcomes.length} of your ${outcomeRecords.length} ` +
          `submitted decisions resulted in deferral (${Math.round(deferralRate * 100)}%). ` +
          "This pattern often indicates unclear ownership or missing evidence at decision time.",
        observationCount: deferredOutcomes.length,
        sourceRunIds: deferredOutcomes
          .map((r) => r.decisionInstrumentRunId ?? r.decisionObjectId ?? "")
          .filter(Boolean),
        recommendedAction:
          "Before submitting your next decision, confirm: (1) one named owner, " +
          "(2) a deadline with consequences, (3) the evidence gap that is causing deferral.",
        riskOfRepeat:
          deferralRate > 0.5 ? "HIGH" : deferralRate > 0.33 ? "MEDIUM" : "LOW",
        surfaceIn: ["decision_centre", "strategy_room"],
      });
    }
  }

  // 2. EVIDENCE_GAP — evidence repeatedly missing at decision time
  const evidenceMissingRecords = outcomeRecords.filter((r) => r.evidenceMissing);
  if (evidenceMissingRecords.length >= 2) {
    detected.push({
      patternType: "EVIDENCE_GAP",
      patternLabel: "Evidence gap is a recurring constraint",
      patternDetail:
        `In ${evidenceMissingRecords.length} of your decisions, critical evidence ` +
        "was missing at the time the decision was made. " +
        "This is a structural pattern, not a one-time issue.",
      observationCount: evidenceMissingRecords.length,
      sourceRunIds: evidenceMissingRecords
        .map((r) => r.decisionInstrumentRunId ?? r.decisionObjectId ?? "")
        .filter(Boolean),
      recommendedAction:
        "Run an Evidence Mapping instrument before your next major decision. " +
        "Identify evidence owners and set a deadline for evidence completion " +
        "before the decision window opens.",
      riskOfRepeat:
        evidenceMissingRecords.length >= 4 ? "HIGH" : "MEDIUM",
      surfaceIn: ["decision_centre", "return_brief", "boardroom_brief_followup"],
    });
  }

  // 3. AUTHORITY_FAILURE — decisions failing or partially succeeding repeatedly
  const authorityFailures = outcomeRecords.filter(
    (r) => r.outcomeClass === "FAILURE" || r.outcomeClass === "PARTIAL",
  );
  if (authorityFailures.length >= 2) {
    const failureRate =
      authorityFailures.length / Math.max(outcomeRecords.length, 1);
    detected.push({
      patternType: "AUTHORITY_FAILURE",
      patternLabel: "Repeated decision authority failures",
      patternDetail:
        `${authorityFailures.length} of your ${outcomeRecords.length} decisions ` +
        `resulted in failure or partial outcomes. ` +
        "This pattern suggests a recurring gap in decision authority — either the " +
        "right stakeholders are not involved, or the evidence base at decision time " +
        "is insufficient to support the position taken.",
      observationCount: authorityFailures.length,
      sourceRunIds: authorityFailures
        .map((r) => r.decisionInstrumentRunId ?? r.decisionObjectId ?? "")
        .filter(Boolean),
      recommendedAction:
        "Before your next high-stakes decision: run a Decision Authority instrument " +
        "to identify the specific authority gap. Check prior carry-forward notes — " +
        "the gap is likely documented from a previous decision.",
      riskOfRepeat:
        failureRate > 0.5 ? "CRITICAL" : failureRate > 0.33 ? "HIGH" : "MEDIUM",
      surfaceIn: ["decision_centre", "strategy_room", "retainer_dashboard"],
    });
  }

  // 4. RECURRING_CONSTRAINT — same type of constraint appearing repeatedly
  const carryForwardNotes = outcomeRecords
    .map((r) => r.carryForward)
    .filter((s): s is string => Boolean(s));
  if (carryForwardNotes.length >= 3) {
    // Simple heuristic: if > 50% of outcomes have carry-forward notes, pattern exists
    detected.push({
      patternType: "RECURRING_CONSTRAINT",
      patternLabel: "Recurring constraints are being carried forward without resolution",
      patternDetail:
        `${carryForwardNotes.length} of your decisions produced carry-forward notes. ` +
        "If the same constraint is being carried forward across multiple decisions, " +
        "it has become a structural blocker, not a situational one.",
      observationCount: carryForwardNotes.length,
      sourceRunIds: outcomeRecords
        .filter((r) => r.carryForward)
        .map((r) => r.decisionInstrumentRunId ?? r.decisionObjectId ?? "")
        .filter(Boolean),
      recommendedAction:
        "Review your carry-forward notes across the last three decisions. " +
        "If the same constraint appears more than once, escalate it to a retainer " +
        "or Strategy Room engagement — it requires dedicated resolution, not iteration.",
      riskOfRepeat: carryForwardNotes.length >= 5 ? "HIGH" : "MEDIUM",
      surfaceIn: ["decision_centre", "return_brief", "retainer_dashboard"],
    });
  }

  // 5. GOVERNANCE_DRIFT — owner incorrect repeatedly
  const incorrectOwnerDecisions = outcomeRecords.filter(
    (r) => r.ownerCorrect === false,
  );
  if (incorrectOwnerDecisions.length >= 2) {
    detected.push({
      patternType: "GOVERNANCE_DRIFT",
      patternLabel: "Decision ownership has been incorrect in multiple cases",
      patternDetail:
        `In ${incorrectOwnerDecisions.length} of your decisions, the person who held ` +
        "decision ownership was not the correct owner in retrospect. " +
        "This is governance drift — authority is misassigned before decisions are made.",
      observationCount: incorrectOwnerDecisions.length,
      sourceRunIds: incorrectOwnerDecisions
        .map((r) => r.decisionInstrumentRunId ?? r.decisionObjectId ?? "")
        .filter(Boolean),
      recommendedAction:
        "Map decision ownership explicitly before your next major decision. " +
        "Use the Governance Drift instrument to identify where authority is misassigned " +
        "before the decision window opens.",
      riskOfRepeat: "HIGH",
      surfaceIn: [
        "decision_centre",
        "strategy_room",
        "executive_reporting",
        "retainer_dashboard",
      ],
    });
  }

  // 6. DECISION_CLASS_TREND — instrument slug clustering
  if (instrumentRuns.length >= MIN_DECISIONS_FOR_PATTERN) {
    const slugCounts: Record<string, number> = {};
    for (const run of instrumentRuns) {
      slugCounts[run.instrumentSlug] = (slugCounts[run.instrumentSlug] ?? 0) + 1;
    }
    const dominant = Object.entries(slugCounts)
      .filter(([, count]) => count >= 3)
      .sort(([, a], [, b]) => b - a)[0];

    if (dominant) {
      detected.push({
        patternType: "DECISION_CLASS_TREND",
        patternLabel: `Repeated use of the same instrument type: "${dominant[0]}"`,
        patternDetail:
          `You have run the "${dominant[0]}" instrument ${dominant[1]} times. ` +
          "Repeated use of the same instrument type on recurring decisions may indicate " +
          "an underlying governance gap that a single instrument cannot resolve. " +
          "Consider a Strategy Room engagement or retainer oversight.",
        observationCount: dominant[1],
        sourceRunIds: instrumentRuns
          .filter((r) => r.instrumentSlug === dominant[0])
          .map((r) => r.id),
        recommendedAction:
          `If "${dominant[0]}" keeps surfacing the same constraint, the constraint ` +
          "is structural. Escalate to Strategy Room or Retainer for resolution, " +
          "rather than re-running the instrument.",
        riskOfRepeat: dominant[1] >= 5 ? "MEDIUM" : "LOW",
        surfaceIn: ["decision_centre", "strategy_room"],
      });
    }
  }

  // ── Persist detected patterns ──────────────────────────────────────────────
  for (const pattern of detected) {
    await upsertPatternObservation(
      userEmail,
      userId ?? null,
      organisationId ?? null,
      pattern,
    );
  }

  const highRisk = detected.filter(
    (p) => p.riskOfRepeat === "HIGH" || p.riskOfRepeat === "CRITICAL",
  );

  const actionableObservation =
    highRisk.length > 0
      ? highRisk[0]!.patternDetail + " " + highRisk[0]!.recommendedAction
      : detected.length > 0
        ? detected[0]!.patternDetail
        : null;

  return {
    userEmail,
    totalDecisions,
    totalOutcomes,
    patterns: detected,
    highRiskPatterns: highRisk,
    actionableObservation,
    observedAt: new Date(),
  };
}

// ── Persistence ───────────────────────────────────────────────────────────────

async function upsertPatternObservation(
  userEmail: string,
  userId: string | null,
  organisationId: string | null,
  pattern: ObservedPattern,
): Promise<void> {
  const existing = await prisma.patternObservation.findFirst({
    where: {
      userEmail,
      patternType: pattern.patternType,
      status: { in: ["ACTIVE", "ACKNOWLEDGED"] },
    },
  });

  if (existing) {
    await prisma.patternObservation.update({
      where: { id: existing.id },
      data: {
        patternLabel: pattern.patternLabel,
        patternDetail: pattern.patternDetail,
        observationCount: pattern.observationCount,
        sourceRunIds: pattern.sourceRunIds as never,
        recommendedAction: pattern.recommendedAction,
        riskOfRepeat: pattern.riskOfRepeat,
        surfaceIn: pattern.surfaceIn as never,
      },
    });
  } else {
    await prisma.patternObservation.create({
      data: {
        userEmail,
        userId,
        organisationId,
        patternType: pattern.patternType,
        patternLabel: pattern.patternLabel,
        patternDetail: pattern.patternDetail,
        observationCount: pattern.observationCount,
        sourceRunIds: pattern.sourceRunIds as never,
        recommendedAction: pattern.recommendedAction,
        riskOfRepeat: pattern.riskOfRepeat,
        surfaceIn: pattern.surfaceIn as never,
        status: "ACTIVE",
      },
    });
  }
}

// ── Read Operations ───────────────────────────────────────────────────────────

export async function getActivePatterns(
  userEmail: string,
  surface?: PatternSurface,
): Promise<PatternObservationRecord[]> {
  const records = await prisma.patternObservation.findMany({
    where: {
      userEmail,
      status: { in: ["ACTIVE", "ACKNOWLEDGED"] },
    },
    orderBy: [{ riskOfRepeat: "desc" }, { createdAt: "desc" }],
  });

  const parsed = records.map(parsePatternRecord);

  if (surface) {
    return parsed.filter((p) => p.surfaceIn.includes(surface));
  }
  return parsed;
}

export async function acknowledgePattern(id: string): Promise<void> {
  await prisma.patternObservation.update({
    where: { id },
    data: { status: "ACKNOWLEDGED", acknowledgedAt: new Date() },
  });
}

export async function resolvePattern(id: string): Promise<void> {
  await prisma.patternObservation.update({
    where: { id },
    data: { status: "RESOLVED" },
  });
}

/**
 * Get the highest-priority actionable pattern for a user on a given surface.
 * Returns null if no pattern qualifies (not enough data or all resolved).
 * Used for inline callouts in Decision Centre, Strategy Room, etc.
 */
export async function getTopPatternForSurface(
  userEmail: string,
  surface: PatternSurface,
): Promise<PatternObservationRecord | null> {
  const patterns = await getActivePatterns(userEmail, surface);
  if (patterns.length === 0) return null;

  // Priority: CRITICAL > HIGH > MEDIUM > LOW
  const order: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  return patterns.sort(
    (a, b) =>
      (order[b.riskOfRepeat ?? "LOW"] ?? 0) -
      (order[a.riskOfRepeat ?? "LOW"] ?? 0),
  )[0] ?? null;
}

// ── Parser ────────────────────────────────────────────────────────────────────

function parsePatternRecord(record: Record<string, unknown>): PatternObservationRecord {
  function safeArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];
    if (typeof value === "string") {
      try { return JSON.parse(value) as T[]; } catch { return []; }
    }
    return [];
  }

  return {
    id: record.id as string,
    userId: (record.userId as string | null) ?? null,
    userEmail: (record.userEmail as string | null) ?? null,
    organisationId: (record.organisationId as string | null) ?? null,
    patternType: record.patternType as PatternType,
    patternLabel: record.patternLabel as string,
    patternDetail: (record.patternDetail as string | null) ?? null,
    observationCount: record.observationCount as number,
    sourceRunIds: safeArray<string>(record.sourceRunIds),
    recommendedAction: (record.recommendedAction as string | null) ?? null,
    riskOfRepeat: (record.riskOfRepeat as RiskOfRepeat | null) ?? null,
    surfaceIn: safeArray<PatternSurface>(record.surfaceIn),
    acknowledgedAt: (record.acknowledgedAt as Date | null) ?? null,
    dismissedAt: (record.dismissedAt as Date | null) ?? null,
    status: record.status as "ACTIVE" | "ACKNOWLEDGED" | "DISMISSED" | "RESOLVED",
    createdAt: record.createdAt as Date,
    updatedAt: record.updatedAt as Date,
  };
}
