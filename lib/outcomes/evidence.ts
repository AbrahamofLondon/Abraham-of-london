/**
 * lib/outcomes/evidence.ts — Outcome evidence persistence and aggregation.
 *
 * Records outcome snapshots to the OutcomeVerificationRecord table (durable)
 * AND maintains a process-level cache for fast same-session reads.
 *
 * buildObservedOutcomeEvidence() reads from DB when available,
 * falls back to in-memory cache, and always returns honest confidence levels.
 */

import {
  classifyOutcome,
  normalizeOutcomeSnapshot,
  type OutcomeClassification,
  type OutcomeSnapshot,
} from "./outcome-model";
import { recordOutcomeFeedback } from "./feedback-loop";

export type OutcomeEvidenceSummary = {
  title: "Observed Outcomes (System Evidence)";
  processedDecisionCases: number;
  comparableCaseCount: number;
  improvedPercent: number;
  averageTimeToImprovementDays: number | null;
  failureRateWhenIgnored: number;
  medianResolutionWindowDays: number | null;
  confidence: "insufficient" | "directional" | "governed";
  statements: string[];
};

// Process-level cache for fast same-session reads
const processCache: OutcomeSnapshot[] = [];

function roundTo(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? null;
  const left = sorted[mid - 1] ?? 0;
  const right = sorted[mid] ?? 0;
  return roundTo((left + right) / 2);
}

function percent(count: number, total: number): number {
  if (!total) return 0;
  return roundTo((count / total) * 100);
}

function isPositiveOutcome(outcome: OutcomeClassification): boolean {
  return outcome === "resolved" || outcome === "improved";
}

/**
 * Record an outcome snapshot — persists to DB and updates process cache.
 * Falls back to cache-only if DB write fails.
 */
export async function recordOutcomeSnapshot(snapshot: OutcomeSnapshot): Promise<OutcomeSnapshot> {
  const normalized = normalizeOutcomeSnapshot(snapshot);

  // Persist to database
  try {
    const { prisma } = await import("@/lib/prisma");
    await (prisma as any).outcomeVerificationRecord.create({
      data: {
        sessionId: normalized.sessionId || null,
        organisationKey: normalized.organisation || null,
        outcomeClassification: normalized.outcomeClassification,
        magnitudeOfChange: Math.abs(normalized.delta.dissonanceChange) +
          Math.abs(normalized.delta.burnoutChange) +
          Math.abs(normalized.delta.certaintyChange),
        effectivenessScore: 0, // computed by outcome-verification.ts
        payload: JSON.stringify({
          baseline: normalized.baseline,
          followUp: normalized.followUp,
          delta: normalized.delta,
          timeToOutcomeDays: normalized.timeToOutcomeDays,
        }),
      },
    });
  } catch (err) {
    // DB write failed — outcome still recorded in process cache
    console.error("[outcomes/evidence] DB persist failed, using cache:", err);
  }

  // Always update process cache and feedback loop
  processCache.push(normalized);
  recordOutcomeFeedback(normalized);
  return normalized;
}

/** Synchronous record for backward compatibility (cache-only) */
export function recordOutcomeSnapshotSync(snapshot: OutcomeSnapshot): OutcomeSnapshot {
  const normalized = normalizeOutcomeSnapshot(snapshot);
  processCache.push(normalized);
  recordOutcomeFeedback(normalized);
  return normalized;
}

export function getRecordedOutcomeSnapshots(): OutcomeSnapshot[] {
  return [...processCache];
}

export function resetOutcomeEvidenceForTests(): void {
  processCache.length = 0;
}

/**
 * Load outcome evidence from DB for a given organisation or session.
 * Returns snapshots reconstructed from OutcomeVerificationRecord rows.
 */
async function loadOutcomesFromDB(filter?: {
  sessionId?: string;
  organisationKey?: string;
  limit?: number;
}): Promise<OutcomeSnapshot[]> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const where: Record<string, unknown> = {};
    if (filter?.sessionId) where.sessionId = filter.sessionId;
    if (filter?.organisationKey) where.organisationKey = filter.organisationKey;

    const records = await (prisma as any).outcomeVerificationRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filter?.limit ?? 200,
    });

    return records.map((r: any) => {
      const payload = typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload;
      return normalizeOutcomeSnapshot({
        id: r.id,
        sessionId: r.sessionId ?? "",
        organisation: r.organisationKey ?? undefined,
        baseline: payload?.baseline ?? { dissonance: 0, burnoutIndex: 0, sovereignCertainty: 0, escalationLevel: "NONE" },
        followUp: payload?.followUp ?? { dissonance: 0, burnoutIndex: 0, sovereignCertainty: 0, escalationLevel: "NONE" },
        delta: payload?.delta ?? { dissonanceChange: 0, burnoutChange: 0, certaintyChange: 0 },
        outcomeClassification: r.outcomeClassification as OutcomeClassification,
        timeToOutcomeDays: payload?.timeToOutcomeDays ?? 0,
        createdAt: r.createdAt,
      });
    });
  } catch {
    return [];
  }
}

/**
 * Build observed outcome evidence summary (synchronous — uses process cache).
 *
 * This is the primary export. Uses the process cache for fast same-session reads.
 * For DB-backed evidence across sessions, use buildObservedOutcomeEvidenceFromDB().
 */
export function buildObservedOutcomeEvidence(
  outcomes: OutcomeSnapshot[] = processCache,
): OutcomeEvidenceSummary {
  return computeEvidenceSummary(outcomes);
}

/**
 * Build observed outcome evidence from database (async).
 * Falls back to process cache if DB is unavailable.
 */
export async function buildObservedOutcomeEvidenceFromDB(
  dbFilter?: { sessionId?: string; organisationKey?: string },
): Promise<OutcomeEvidenceSummary> {
  const dbOutcomes = await loadOutcomesFromDB(dbFilter);
  if (dbOutcomes.length > 0) {
    return computeEvidenceSummary(dbOutcomes);
  }
  return computeEvidenceSummary(processCache);
}

function computeEvidenceSummary(outcomes: OutcomeSnapshot[]): OutcomeEvidenceSummary {
  const valid = outcomes
    .map((snapshot) => normalizeOutcomeSnapshot(snapshot))
    .filter((snapshot) => classifyOutcome(snapshot) !== "invalid");

  const positive = valid.filter((snapshot) =>
    isPositiveOutcome(snapshot.outcomeClassification),
  );
  const deteriorated = valid.filter(
    (snapshot) => snapshot.outcomeClassification === "deteriorated",
  );
  const resolved = valid.filter(
    (snapshot) => snapshot.outcomeClassification === "resolved",
  );

  const averageTimeToImprovementDays = positive.length
    ? roundTo(
        positive.reduce((sum, snapshot) => sum + snapshot.timeToOutcomeDays, 0) /
          positive.length,
      )
    : null;

  const medianResolutionWindowDays = median(
    resolved.map((snapshot) => snapshot.timeToOutcomeDays),
  );

  const improvedPercent = percent(positive.length, valid.length);
  const failureRateWhenIgnored = percent(deteriorated.length, valid.length);

  const confidence =
    valid.length >= 30 ? "governed" : valid.length >= 5 ? "directional" : "insufficient";

  const statements =
    valid.length > 0
      ? [
          `${improvedPercent}% improved within the observed follow-up window when intervention was applied.`,
          `${failureRateWhenIgnored}% deteriorated under comparable recorded conditions.`,
          medianResolutionWindowDays == null
            ? "Median resolution window is not yet established."
            : `Median resolution window: ${medianResolutionWindowDays} days.`,
        ]
      : [
          "Observed outcome evidence has not reached a usable sample.",
          "Comparable improvement rate is unavailable until follow-up records are captured.",
          "Failure rate when ignored is unavailable until deterioration outcomes are captured.",
        ];

  return {
    title: "Observed Outcomes (System Evidence)",
    processedDecisionCases: valid.length,
    comparableCaseCount: valid.length,
    improvedPercent,
    averageTimeToImprovementDays,
    failureRateWhenIgnored,
    medianResolutionWindowDays,
    confidence,
    statements,
  };
}
