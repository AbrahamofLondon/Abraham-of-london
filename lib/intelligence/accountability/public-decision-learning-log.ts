/**
 * lib/intelligence/accountability/public-decision-learning-log.ts
 *
 * §11 — Public Decision Learning Log / Falsification Register.
 *
 * Append-only accountability: a correction must not erase the original call.
 * Uses proper falsification semantics — does not manufacture conditions from URLs.
 * Every entry is derived from recorded evidence and editorially approved interpretation.
 */
import { MARKET_CALL_LEDGER, type MarketCallRecord, type MarketCallOutcomeStatus } from "../market-intelligence-call-ledger";
import { buildFalsificationCondition, type FalsificationCondition } from "./falsification-semantics";
import { resolveMarketAccountabilityEvidence, type EvidenceMode, type ResolveEvidenceOptions } from "./market-accountability-evidence";

export interface LearningLogEntry {
  originalCallId: string;
  originalCall: string;
  originalDate: string;
  edition: string;
  originalConfidence: string;
  falsificationCondition: FalsificationCondition;
  observedEvidence: string;
  outcomeStatus: MarketCallOutcomeStatus | "PENDING_REVIEW";
  score: number | null;
  whatChanged: string;
  whatDidNotChange: string;
  revision: string;
  methodologyVersion: string;
  sourceReferences: string[];
  publicationTimestamp: string;
}

export interface LearningLogFilter { edition?: string; theme?: string; status?: MarketCallOutcomeStatus; region?: string; }

export function buildLearningLogEntry(call: MarketCallRecord): LearningLogEntry {
  return {
    originalCallId: call.id,
    originalCall: call.statement,
    originalDate: call.lastReviewedAt ?? call.expectedReviewWindow,
    edition: call.reportId,
    originalConfidence: call.originalConfidence,
    falsificationCondition: buildFalsificationCondition({ scenarioLink: call.scenarioLink, statement: call.statement, outcomeSummary: call.outcomeSummary }),
    observedEvidence: call.outcomeSummary ?? "Pending review",
    outcomeStatus: call.outcomeStatus ?? "PENDING_REVIEW",
    score: call.score ?? null,
    whatChanged: call.learning ?? "No change recorded",
    whatDidNotChange: call.carryForwardJustification ?? "Not applicable",
    revision: (call.versionHistory?.length ?? 0) > 0 ? `${call.versionHistory!.length} revision(s)` : "No revisions",
    methodologyVersion: "1.0.0",
    sourceReferences: call.evidenceSources ?? [],
    publicationTimestamp: new Date().toISOString(),
  };
}

export function getLearningLog(filter?: LearningLogFilter): LearningLogEntry[] {
  let calls = [...MARKET_CALL_LEDGER];
  if (filter?.edition) calls = calls.filter(c => c.reportId === filter.edition);
  if (filter?.theme) calls = calls.filter(c => c.theme === filter.theme);
  if (filter?.status) calls = calls.filter(c => c.outcomeStatus === filter.status);
  if (filter?.region) calls = calls.filter(c => c.region === filter.region);
  return calls.map(buildLearningLogEntry);
}

export function getLearningLogEntry(callId: string): LearningLogEntry | null {
  const call = MARKET_CALL_LEDGER.find(c => c.id === callId);
  return call ? buildLearningLogEntry(call) : null;
}

/**
 * §11 PUBLIC gate — the surface-facing learning log. In PREVIEW mode (no authoritative
 * persisted ledger) entries are drawn from seed fixtures and MUST be labelled as an
 * illustration of the register, not a published accountability record.
 */
export function getPublicLearningLog(opts: ResolveEvidenceOptions = {}): {
  mode: EvidenceMode; preview: boolean; entries: LearningLogEntry[]; summary: ReturnType<typeof summarizeLearningLog>;
} {
  const evidence = resolveMarketAccountabilityEvidence(opts);
  const entries = evidence.calls.map(buildLearningLogEntry);
  return { mode: evidence.mode, preview: !evidence.publicPublishable, entries, summary: summarizeLearningLog(entries) };
}

export function summarizeLearningLog(entries: LearningLogEntry[]) {
  return {
    totalEntries: entries.length,
    confirmed: entries.filter(e => e.outcomeStatus === "CONFIRMED_STRONGLY" || e.outcomeStatus === "DIRECTIONALLY_CONFIRMED").length,
    partiallyConfirmed: entries.filter(e => e.outcomeStatus === "PARTIALLY_CONFIRMED").length,
    notConfirmed: entries.filter(e => e.outcomeStatus === "NOT_CONFIRMED" || e.outcomeStatus === "DISCONFIRMED").length,
    pendingReview: entries.filter(e => e.outcomeStatus === "PENDING_REVIEW" || e.outcomeStatus === "TOO_EARLY_TO_ASSESS").length,
    byEdition: Object.entries(groupBy(entries, e => e.edition)).map(([edition, entries]) => ({ edition, count: entries.length })),
    specifiedConditions: entries.filter(e => e.falsificationCondition.status === "SPECIFIED").length,
    referenceOnlyConditions: entries.filter(e => e.falsificationCondition.status === "REFERENCE_ONLY").length,
    notSpecified: entries.filter(e => e.falsificationCondition.status === "NOT_SPECIFIED_IN_SOURCE").length,
  };
}

/** Backward-compatible summary over the full (seed/preview) log. */
export function getLearningLogSummary() {
  return summarizeLearningLog(getLearningLog());
}

function groupBy<T>(items: T[], fn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) { const key = fn(item); if (!result[key]) result[key] = []; result[key].push(item); }
  return result;
}