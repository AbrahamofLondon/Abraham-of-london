/**
 * lib/intelligence/accountability/market-decision-integrity-index.ts
 *
 * §9 — Public Market Decision Integrity Index (DII).
 * MARKET accountability — NOT Customer Decision Integrity Trend.
 *
 * SECURITY: This module uses a branded opaque type for verified evidence.
 * The __brand symbol is declared but never exported, making it impossible
 * for any code outside this module to construct a VerifiedMarketEvidence
 * object that passes the type guard. Only the trusted server-side resolver
 * resolveVerifiedMarketEvidence() can produce one.
 *
 * The resolver performs runtime validation:
 * - receipt lookup against a trusted registry
 * - edition release status check
 * - evidence/source verification
 * - payload hash matching
 * - receipt-to-payload integrity check
 */

import { DII_METHODOLOGY, getOutcomeTreatment, getCoverageStatus, getComponentWeight } from "./dii-methodology-authority";
import type { MarketCallRecord, MarketCallOutcomeStatus } from "../market-intelligence-call-ledger";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type DiicomponentMeasure = "call_accuracy" | "falsification_discipline" | "calibration_quality" | "revision_discipline";
export type CoverageStatus = "INSUFFICIENT_COVERAGE" | "PRELIMINARY" | "PUBLISHABLE";
export type PublicationStatus = "INSUFFICIENT_COVERAGE" | "PRELIMINARY" | "PUBLISHABLE" | "METHODOLOGY_TRANSITION";

export type EvidenceAuthority = "AUTHORITATIVE" | "CONTROLLED" | "SEED" | "DEMO" | "UNAVAILABLE";

export interface PublicEvidenceEnvelope<T> {
  records: T;
  authority: EvidenceAuthority;
  publicationStatus: "PRELIMINARY" | "PUBLISHABLE";
  provenance: string;
  asOf: string | null;
}

export interface DiiComponentScore { measure: DiicomponentMeasure; score: number; weight: number; weightRationale: string; rationale: string; }
export interface DiiCoverage { status: CoverageStatus; totalCalls: number; scoredCalls: number; pendingCalls: number; minRequired: number; }
export interface EditionTrend { editionId: string; editionLabel: string; diiScore: number | null; publicationStatus: PublicationStatus; componentScores: DiiComponentScore[]; coverage: DiiCoverage; callCount: number; }
export interface DecisionIntegrityIndex { headlineScore: number | null; publicationStatus: PublicationStatus; componentScores: DiiComponentScore[]; coverage: DiiCoverage; methodologyVersion: string; editionTrend: EditionTrend[]; generatedAt: string; }

// ---------------------------------------------------------------------------
// Branded opaque type — the __brand symbol is declared but NEVER exported.
// No external code can construct a VerifiedMarketEvidence that passes the
// branded type guard. Only resolveVerifiedMarketEvidence() can produce one.
// ---------------------------------------------------------------------------

/**
 * Brand symbol — module-scoped, NEVER exported.
 * External code cannot reference this symbol, making it impossible
 * to construct a VerifiedMarketEvidence object that passes the branded type.
 */
const VERIFIED_EVIDENCE_BRAND: unique symbol = Symbol("VerifiedMarketEvidence");

/**
 * Runtime evidence registry — a module-scoped WeakSet containing every
 * VerifiedMarketEvidence object produced by resolveVerifiedMarketEvidence().
 * calculateDecisionIntegrityIndex() checks this set at runtime and rejects
 * any object not registered here, regardless of its TypeScript type, brand
 * symbol, or property shape.
 *
 * This is a RUNTIME enforcement that cannot be bypassed by:
 * - casting with `as any`
 * - JSON serialization/deserialization
 * - copying the brand symbol or properties
 * - constructing a structurally identical object
 *
 * Only resolveVerifiedMarketEvidence() can add objects to this set.
 */
const _verifiedEvidenceRegistry = new WeakSet<object>();

export interface VerifiedMarketEvidence {
  /** Brand — prevents external construction. Symbol is never exported. */
  readonly [VERIFIED_EVIDENCE_BRAND]: typeof VERIFIED_EVIDENCE_BRAND;
  readonly authority: "AUTHORITATIVE";
  readonly verificationReceiptId: string;
  readonly sourceIds: readonly string[];
  readonly calls: readonly MarketCallRecord[];
  readonly verifiedAt: string;
}

// ---------------------------------------------------------------------------
// Receipt registry interface — the trusted server-side store of release
// receipts. In production this would be backed by a database or durable store.
// ---------------------------------------------------------------------------

export interface ReleaseReceipt {
  id: string;
  editionId: string;
  releaseStatus: "DRAFT" | "CONTROLLED" | "RELEASED";
  payloadHash: string;
  sourceIds: readonly string[];
  issuedAt: string;
}

export interface ReceiptRegistry {
  getReceipt(receiptId: string): ReleaseReceipt | null;
}

export interface SourceEvidenceProvider {
  getVerifiedCalls(editionId: string): readonly MarketCallRecord[] | null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const SCOREABLE: MarketCallOutcomeStatus[] = ["CONFIRMED_STRONGLY","DIRECTIONALLY_CONFIRMED","PARTIALLY_CONFIRMED","WEAKLY_SUPPORTED","NOT_CONFIRMED","DISCONFIRMED"];
const RESOLVED: MarketCallOutcomeStatus[] = [...SCOREABLE, "TOO_EARLY_TO_ASSESS"];

function getAccuracyScore(status: MarketCallOutcomeStatus): number | null {
  const treatment = getOutcomeTreatment(status);
  if (!treatment) return null;
  if (treatment.accuracyTreatment === "exclude_from_scoring" || treatment.accuracyTreatment === "exclude_from_accuracy") return null;
  return treatment.accuracyScore;
}

function calculateCallAccuracy(calls: readonly MarketCallRecord[]): { score: number | null; rationale: string; scoredCount: number } {
  const scoreable = calls.filter(c => c.outcomeStatus && SCOREABLE.includes(c.outcomeStatus));
  const minSample = DII_METHODOLOGY.components.find(c => c.measure === "call_accuracy")?.minSample ?? 3;
  if (scoreable.length < minSample) return { score: null, rationale: `Insufficient scored calls: ${scoreable.length} < ${minSample}`, scoredCount: 0 };
  const scores = scoreable.map(c => getAccuracyScore(c.outcomeStatus!) ?? 0);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return { score: Math.round(avg), rationale: `Mean outcome score across ${scoreable.length} resolved calls. Range: ${Math.min(...scores)}-${Math.max(...scores)}.`, scoredCount: scoreable.length };
}

function calculateFalsificationDiscipline(calls: readonly MarketCallRecord[]): { score: number | null; rationale: string } {
  const resolved = calls.filter(c => c.outcomeStatus && RESOLVED.includes(c.outcomeStatus));
  const minSample = DII_METHODOLOGY.components.find(c => c.measure === "falsification_discipline")?.minSample ?? 3;
  if (resolved.length < minSample) return { score: null, rationale: `Insufficient resolved calls: ${resolved.length} < ${minSample}` };
  const carryForwardRate = resolved.filter(c => c.carryForwardJustification).length / resolved.length;
  const learningRate = resolved.filter(c => c.learning).length / resolved.length;
  const versionRate = resolved.filter(c => (c.versionHistory?.length ?? 0) > 0).length / resolved.length;
  return { score: Math.round(carryForwardRate * 40 + learningRate * 35 + versionRate * 25), rationale: `Carry-forward: ${(carryForwardRate*100).toFixed(0)}%, Learning: ${(learningRate*100).toFixed(0)}%, Version history: ${(versionRate*100).toFixed(0)}%` };
}

function calculateCalibrationQuality(calls: readonly MarketCallRecord[]): { score: number | null; rationale: string } {
  const scoreable = calls.filter(c => c.outcomeStatus && SCOREABLE.includes(c.outcomeStatus));
  const minSample = DII_METHODOLOGY.components.find(c => c.measure === "calibration_quality")?.minSample ?? 3;
  if (scoreable.length < minSample) return { score: null, rationale: `Insufficient scored calls: ${scoreable.length} < ${minSample}` };
  const byConfidence = (conf: string) => { const f = scoreable.filter(c => c.originalConfidence === conf); return f.length ? f.reduce((a, c) => a + (getAccuracyScore(c.outcomeStatus!) ?? 0), 0) / f.length : null; };
  const highAvg = byConfidence("HIGH"), medAvg = byConfidence("MEDIUM"), lowAvg = byConfidence("LOW");
  let penalty = 0;
  if (highAvg !== null && medAvg !== null && highAvg < medAvg) penalty += 15;
  if (medAvg !== null && lowAvg !== null && medAvg < lowAvg) penalty += 10;
  if (highAvg !== null && lowAvg !== null && highAvg < lowAvg) penalty += 10;
  const baseScore = highAvg !== null ? Math.round(highAvg) : 50;
  return { score: Math.max(0, Math.min(100, baseScore - penalty)), rationale: `High confidence avg: ${highAvg?.toFixed(0) ?? "N/A"}, Medium: ${medAvg?.toFixed(0) ?? "N/A"}, Low: ${lowAvg?.toFixed(0) ?? "N/A"}. Calibration penalty: ${penalty}.` };
}

function calculateRevisionDiscipline(calls: readonly MarketCallRecord[]): { score: number | null; rationale: string } {
  const minSample = DII_METHODOLOGY.components.find(c => c.measure === "revision_discipline")?.minSample ?? 3;
  if (calls.length < minSample) return { score: null, rationale: `Insufficient calls: ${calls.length} < ${minSample}` };
  const withHistory = calls.filter(c => (c.versionHistory?.length ?? 0) > 0);
  const revisionRate = withHistory.length / calls.length;
  const avgRevisions = withHistory.length > 0 ? withHistory.reduce((a, c) => a + (c.versionHistory?.length ?? 0), 0) / withHistory.length : 0;
  return { score: Math.round(Math.min(100, revisionRate * 150) * 0.6 + Math.min(100, avgRevisions * 50) * 0.4), rationale: `Revision rate: ${(revisionRate*100).toFixed(0)}% (${withHistory.length}/${calls.length}), Avg revisions per call: ${avgRevisions.toFixed(1)}` };
}

function calculateCoverage(calls: readonly MarketCallRecord[]): DiiCoverage {
  const totalCalls = calls.length, scoredCalls = calls.filter(c => c.outcomeStatus && SCOREABLE.includes(c.outcomeStatus)).length, pendingCalls = calls.filter(c => c.outcomeStatus === "PENDING_REVIEW").length;
  return { status: getCoverageStatus(scoredCalls), totalCalls, scoredCalls, pendingCalls, minRequired: DII_METHODOLOGY.coverage.minScoredForHeadline };
}

function buildComponentScores(calls: readonly MarketCallRecord[]): DiiComponentScore[] {
  const accuracy = calculateCallAccuracy(calls), falsification = calculateFalsificationDiscipline(calls), calibration = calculateCalibrationQuality(calls), revision = calculateRevisionDiscipline(calls);
  return [
    { measure: "call_accuracy", score: accuracy.score ?? 0, weight: getComponentWeight("call_accuracy") ?? 0.35, weightRationale: DII_METHODOLOGY.components.find(c => c.measure === "call_accuracy")?.weightRationale ?? "", rationale: accuracy.rationale },
    { measure: "falsification_discipline", score: falsification.score ?? 0, weight: getComponentWeight("falsification_discipline") ?? 0.25, weightRationale: DII_METHODOLOGY.components.find(c => c.measure === "falsification_discipline")?.weightRationale ?? "", rationale: falsification.rationale },
    { measure: "calibration_quality", score: calibration.score ?? 0, weight: getComponentWeight("calibration_quality") ?? 0.25, weightRationale: DII_METHODOLOGY.components.find(c => c.measure === "calibration_quality")?.weightRationale ?? "", rationale: calibration.rationale },
    { measure: "revision_discipline", score: revision.score ?? 0, weight: getComponentWeight("revision_discipline") ?? 0.15, weightRationale: DII_METHODOLOGY.components.find(c => c.measure === "revision_discipline")?.weightRationale ?? "", rationale: revision.rationale },
  ];
}

function buildEditionTrend(calls: readonly MarketCallRecord[], editionLabel: string): EditionTrend {
  const coverage = calculateCoverage(calls);
  const components = buildComponentScores(calls);
  const allScored = components.every(c => c.score !== null);
  const headlineScore = coverage.status === "PUBLISHABLE" && allScored ? Math.round(components.reduce((a, c) => a + c.score * c.weight, 0)) : null;
  const pubStatus: PublicationStatus = coverage.status === "INSUFFICIENT_COVERAGE" ? "INSUFFICIENT_COVERAGE" : coverage.status === "PRELIMINARY" ? "PRELIMINARY" : "PUBLISHABLE";
  return { editionId: calls[0]?.reportId ?? "unknown", editionLabel, diiScore: headlineScore, publicationStatus: pubStatus, componentScores: components, coverage, callCount: calls.length };
}

// ---------------------------------------------------------------------------
// Simple hash function for payload integrity verification
// ---------------------------------------------------------------------------

function hashPayload(calls: readonly MarketCallRecord[]): string {
  // Deterministic hash of call IDs and their outcome statuses
  const parts = calls.map(c => `${c.id}:${c.outcomeStatus ?? "PENDING"}:${c.score ?? "null"}`);
  let hash = 0;
  for (const part of parts) {
    for (let i = 0; i < part.length; i++) {
      const char = part.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
  }
  return `hash-${Math.abs(hash).toString(16)}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate the Decision Integrity Index from verified evidence.
 *
 * This is the ONLY public entry point for DII calculation on public surfaces.
 * It REQUIRES a VerifiedMarketEvidence object. Without verified evidence,
 * the function returns the truthful empty/withheld state.
 *
 * The branded type makes it impossible for callers to forge evidence objects.
 */
export function calculateDecisionIntegrityIndex(evidence?: VerifiedMarketEvidence): DecisionIntegrityIndex {
  // Runtime provenance check: reject any object not registered by the resolver
  if (evidence && !_verifiedEvidenceRegistry.has(evidence)) {
    evidence = undefined;
  }

  if (!evidence) {
    return {
      headlineScore: null,
      publicationStatus: "PRELIMINARY",
      componentScores: [],
      coverage: { status: "INSUFFICIENT_COVERAGE", totalCalls: 0, scoredCalls: 0, pendingCalls: 0, minRequired: DII_METHODOLOGY.coverage.minScoredForHeadline },
      methodologyVersion: DII_METHODOLOGY.methodologyVersion,
      editionTrend: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const allCalls = [...evidence.calls];
  const coverage = calculateCoverage(allCalls);
  const editionMap = new Map<string, MarketCallRecord[]>();
  for (const call of allCalls) { const existing = editionMap.get(call.reportId) || []; existing.push(call); editionMap.set(call.reportId, existing); }
  const editionTrend: EditionTrend[] = [];
  for (const [editionId, calls] of editionMap) editionTrend.push(buildEditionTrend(calls, editionId === "GMI-Q1-2026" ? "GMI Q1 2026" : editionId));
  const components = buildComponentScores(allCalls);
  const allScored = components.every(c => c.score !== null);
  const headlineScore = coverage.status === "PUBLISHABLE" && allScored ? Math.round(components.reduce((a, c) => a + c.score * c.weight, 0)) : null;
  const pubStatus: PublicationStatus = coverage.status === "INSUFFICIENT_COVERAGE" ? "INSUFFICIENT_COVERAGE" : coverage.status === "PRELIMINARY" ? "PRELIMINARY" : "PUBLISHABLE";
  return { headlineScore, publicationStatus: pubStatus, componentScores: components, coverage, methodologyVersion: DII_METHODOLOGY.methodologyVersion, editionTrend, generatedAt: new Date().toISOString() };
}

/**
 * Resolve verified market evidence from trusted server-side sources.
 *
 * This is the ONLY way to produce a VerifiedMarketEvidence object.
 * It performs runtime validation:
 * 1. Looks up the receipt in the trusted registry
 * 2. Verifies the receipt exists and is for the requested edition
 * 3. Checks the edition release status is RELEASED
 * 4. Loads verified source evidence
 * 5. Verifies payload hash matches receipt
 * 6. Constructs the branded evidence object
 *
 * Returns null if ANY check fails.
 */
export function resolveVerifiedMarketEvidence(options: {
  editionId: string;
  receiptId: string;
  receiptRegistry: ReceiptRegistry;
  sourceEvidence: SourceEvidenceProvider;
}): VerifiedMarketEvidence | null {
  const { editionId, receiptId, receiptRegistry, sourceEvidence } = options;

  // 1. Look up receipt in trusted registry
  const receipt = receiptRegistry.getReceipt(receiptId);
  if (!receipt) return null;

  // 2. Verify receipt belongs to the requested edition
  if (receipt.editionId !== editionId) return null;

  // 3. Check edition release status — only RELEASED is publishable
  if (receipt.releaseStatus !== "RELEASED") return null;

  // 4. Load verified source evidence
  const calls = sourceEvidence.getVerifiedCalls(editionId);
  if (!calls || calls.length === 0) return null;

  // 5. Verify payload hash matches receipt
  const computedHash = hashPayload(calls);
  if (computedHash !== receipt.payloadHash) return null;

  // 6. Verify source IDs match receipt
  const callIds = calls.map(c => c.id);
  const receiptSourceIds = [...receipt.sourceIds];
  const idsMatch = callIds.length === receiptSourceIds.length &&
    callIds.every(id => receiptSourceIds.includes(id));
  if (!idsMatch) return null;

  // All checks passed — construct, freeze and register the evidence object
  const raw = {
    [VERIFIED_EVIDENCE_BRAND]: VERIFIED_EVIDENCE_BRAND,
    authority: "AUTHORITATIVE" as const,
    verificationReceiptId: receiptId,
    sourceIds: receipt.sourceIds,
    calls,
    verifiedAt: new Date().toISOString(),
  } as VerifiedMarketEvidence;
  const evidence = Object.freeze(raw) as VerifiedMarketEvidence;

  // Register in runtime WeakSet so calculateDecisionIntegrityIndex can verify
  _verifiedEvidenceRegistry.add(evidence);

  return evidence;
}

/**
 * Calculate DII for a specific edition — INTERNAL USE ONLY.
 * Requires verified evidence. Returns null without it.
 */
export function calculateEditionDii(editionId: string, evidence?: VerifiedMarketEvidence): EditionTrend | null {
  if (evidence) {
    const calls = evidence.calls.filter(c => c.reportId === editionId);
    return calls.length === 0 ? null : buildEditionTrend(calls, editionId === "GMI-Q1-2026" ? "GMI Q1 2026" : editionId);
  }
  return null;
}