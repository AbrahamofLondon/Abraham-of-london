/**
 * lib/intelligence/accountability/cross-edition-call-review.ts
 *
 * §12 — Automated Cross-Edition Call Review.
 *
 * Uses explicit edition lineage fields — not versionHistory.note as edition identity.
 * Free-form notes remain commentary; they do not define lineage.
 */
import { MARKET_CALL_LEDGER, type MarketCallRecord } from "../market-intelligence-call-ledger";
import { buildLineageFromCall, type CallLineageRecord, type LineageStatus } from "./edition-lineage";
import { resolveMarketAccountabilityEvidence } from "./market-accountability-evidence";

export interface CallLineage {
  originalCallId: string;
  originalStatement: string;
  firstEdition: string;
  currentEdition: string;
  lineageStatus: LineageStatus;
  currentEvidence: string;
  falsificationConditionTriggered: boolean;
  scoreState: number | null;
  confidenceMovement: "improved" | "stable" | "declined" | "insufficient_data";
  revisionRationale: string;
  lastReviewedAt: string | null;
  nextReviewDue: string | null;
}

export interface CrossEditionSummary {
  totalCalls: number;
  originated: number;
  carriedForward: number;
  revised: number;
  superseded: number;
  closed: number;
  falsified: number;
  unresolved: number;
  byEdition: Array<{ edition: string; calls: number }>;
}

export function buildCallLineage(call: MarketCallRecord): CallLineage {
  const lineage = buildLineageFromCall(call);
  const falsificationConditionTriggered = call.outcomeStatus === "DISCONFIRMED" || call.outcomeStatus === "NOT_CONFIRMED";
  const scoreState = call.score ?? null;
  const allVersions = call.versionHistory ?? [];

  let confidenceMovement: CallLineage["confidenceMovement"] = "stable";
  if (allVersions.length > 0 && !falsificationConditionTriggered) confidenceMovement = "improved";
  if (falsificationConditionTriggered) confidenceMovement = "declined";
  if (scoreState === null && allVersions.length === 0 && !call.outcomeStatus) confidenceMovement = "insufficient_data";

  return {
    originalCallId: call.id,
    originalStatement: call.statement,
    firstEdition: call.reportId,
    currentEdition: call.reportId,
    lineageStatus: lineage.lineageStatus,
    currentEvidence: call.outcomeSummary ?? "Pending review",
    falsificationConditionTriggered,
    scoreState,
    confidenceMovement,
    revisionRationale: call.learning ?? call.carryForwardJustification ?? "No revision rationale recorded",
    lastReviewedAt: call.lastReviewedAt ?? null,
    nextReviewDue: call.nextReviewDue ?? null,
  };
}

export function getCrossEditionReview(): CallLineage[] {
  return MARKET_CALL_LEDGER.map(buildCallLineage);
}

/**
 * §12 PUBLIC gate — surface-facing cross-edition review. PREVIEW mode (no authoritative
 * ledger) is drawn from seed fixtures and must be labelled as illustrative.
 */
export function getPublicCrossEditionReview(opts: import("./market-accountability-evidence").ResolveEvidenceOptions = {}): {
  mode: import("./market-accountability-evidence").EvidenceMode; preview: boolean; review: CallLineage[]; summary: CrossEditionSummary;
} {
  const evidence = resolveMarketAccountabilityEvidence(opts);
  const review = evidence.calls.map(buildCallLineage);
  return { mode: evidence.mode, preview: !evidence.publicPublishable, review, summary: summarizeLineages(review) };
}

export function getCrossEditionSummary(): CrossEditionSummary {
  return summarizeLineages(getCrossEditionReview());
}

function summarizeLineages(lineages: CallLineage[]): CrossEditionSummary {
  return {
    totalCalls: lineages.length,
    originated: lineages.filter(l => l.lineageStatus === "ORIGINATED").length,
    carriedForward: lineages.filter(l => l.lineageStatus === "CARRIED_FORWARD").length,
    revised: lineages.filter(l => l.lineageStatus === "REVISED").length,
    superseded: lineages.filter(l => l.lineageStatus === "SUPERSEDED").length,
    closed: lineages.filter(l => l.lineageStatus === "CLOSED").length,
    falsified: lineages.filter(l => l.lineageStatus === "FALSIFIED").length,
    unresolved: lineages.filter(l => l.lineageStatus === "UNRESOLVED").length,
    byEdition: Object.entries(groupBy(lineages, l => l.firstEdition)).map(([edition, calls]) => ({ edition, calls: calls.length })),
  };
}

function groupBy<T>(items: T[], fn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) { const key = fn(item); if (!result[key]) result[key] = []; result[key].push(item); }
  return result;
}