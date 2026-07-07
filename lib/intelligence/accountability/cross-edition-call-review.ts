/**
 * lib/intelligence/accountability/cross-edition-call-review.ts
 *
 * §12 — Automated Cross-Edition Call Review.
 *
 * Q1 call → Q2 evidence → Q2 review → Q3 follow-up.
 * Prevents each edition from manually reinventing call lineage.
 * Input to: public DII, Decision Learning Log, cross-moat brief.
 */
import { MARKET_CALL_LEDGER, type MarketCallRecord, type MarketCallOutcomeStatus } from "../market-intelligence-call-ledger";

export interface CallLineage {
  originalCallId: string;
  originalStatement: string;
  firstEdition: string;
  currentEdition: string;
  editionsTraversed: string[];
  carryForwardStatus: "carried_forward" | "resolved" | "dropped";
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
  carriedForward: number;
  resolved: number;
  dropped: number;
  falsificationTriggered: number;
  byEdition: Array<{ edition: string; calls: number; carriedForward: number; resolved: number }>;
}

export function buildCallLineage(call: MarketCallRecord): CallLineage {
  const allVersions = call.versionHistory ?? [];
  const editionsTraversed = [call.reportId];
  for (const v of allVersions) { if (!editionsTraversed.includes(v.note)) editionsTraversed.push(v.note); }

  const falsificationConditionTriggered = call.outcomeStatus === "DISCONFIRMED" || call.outcomeStatus === "NOT_CONFIRMED";
  const isResolved = call.outcomeStatus === "CONFIRMED_STRONGLY" || call.outcomeStatus === "DIRECTIONALLY_CONFIRMED" || call.outcomeStatus === "DISCONFIRMED";
  const isDropped = call.outcomeStatus === undefined || call.outcomeStatus === null;

  let carryForwardStatus: CallLineage["carryForwardStatus"] = "carried_forward";
  if (isResolved) carryForwardStatus = "resolved";
  if (isDropped) carryForwardStatus = "dropped";

  const scoreState = call.score ?? null;

  let confidenceMovement: CallLineage["confidenceMovement"] = "stable";
  if (allVersions.length > 0) confidenceMovement = "improved";
  if (falsificationConditionTriggered) confidenceMovement = "declined";
  if (scoreState === null && allVersions.length === 0) confidenceMovement = "insufficient_data";

  return {
    originalCallId: call.id,
    originalStatement: call.statement,
    firstEdition: call.reportId,
    currentEdition: call.reportId,
    editionsTraversed,
    carryForwardStatus,
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

export function getCrossEditionSummary(): CrossEditionSummary {
  const lineages = getCrossEditionReview();
  const byEditionMap = new Map<string, { calls: number; carriedForward: number; resolved: number }>();
  for (const l of lineages) {
    for (const ed of l.editionsTraversed) {
      const existing = byEditionMap.get(ed) || { calls: 0, carriedForward: 0, resolved: 0 };
      existing.calls++;
      if (l.carryForwardStatus === "carried_forward") existing.carriedForward++;
      if (l.carryForwardStatus === "resolved") existing.resolved++;
      byEditionMap.set(ed, existing);
    }
  }
  return {
    totalCalls: lineages.length,
    carriedForward: lineages.filter(l => l.carryForwardStatus === "carried_forward").length,
    resolved: lineages.filter(l => l.carryForwardStatus === "resolved").length,
    dropped: lineages.filter(l => l.carryForwardStatus === "dropped").length,
    falsificationTriggered: lineages.filter(l => l.falsificationConditionTriggered).length,
    byEdition: Array.from(byEditionMap.entries()).map(([edition, data]) => ({ edition, ...data })),
  };
}
