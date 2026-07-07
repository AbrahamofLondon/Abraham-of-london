/**
 * lib/intelligence/accountability/market-decision-integrity-index.ts
 *
 * §9 — Public Market Decision Integrity Index (DII).
 * MARKET accountability — NOT Customer Decision Integrity Trend.
 *
 * Derives from canonical call-ledger evidence and versioned methodology authority.
 * Coverage-aware: no headline score from insufficient evidence.
 */
import { MARKET_CALL_LEDGER, type MarketCallRecord, type MarketCallOutcomeStatus } from "../market-intelligence-call-ledger";
import { DII_METHODOLOGY, getOutcomeTreatment, getCoverageStatus, getComponentWeight } from "./dii-methodology-authority";

export type DiicomponentMeasure = "call_accuracy" | "falsification_discipline" | "calibration_quality" | "revision_discipline";
export type CoverageStatus = "INSUFFICIENT_COVERAGE" | "PRELIMINARY" | "PUBLISHABLE";
export type PublicationStatus = "INSUFFICIENT_COVERAGE" | "PRELIMINARY" | "PUBLISHABLE" | "METHODOLOGY_TRANSITION";

export interface DiiComponentScore { measure: DiicomponentMeasure; score: number; weight: number; weightRationale: string; rationale: string; }
export interface DiiCoverage { status: CoverageStatus; totalCalls: number; scoredCalls: number; pendingCalls: number; minRequired: number; }
export interface EditionTrend { editionId: string; editionLabel: string; diiScore: number | null; publicationStatus: PublicationStatus; componentScores: DiiComponentScore[]; coverage: DiiCoverage; callCount: number; }
export interface DecisionIntegrityIndex { headlineScore: number | null; publicationStatus: PublicationStatus; componentScores: DiiComponentScore[]; coverage: DiiCoverage; methodologyVersion: string; editionTrend: EditionTrend[]; generatedAt: string; }

const SCOREABLE: MarketCallOutcomeStatus[] = ["CONFIRMED_STRONGLY","DIRECTIONALLY_CONFIRMED","PARTIALLY_CONFIRMED","WEAKLY_SUPPORTED","NOT_CONFIRMED","DISCONFIRMED"];
const RESOLVED: MarketCallOutcomeStatus[] = [...SCOREABLE, "TOO_EARLY_TO_ASSESS"];

function getAccuracyScore(status: MarketCallOutcomeStatus): number | null {
  const treatment = getOutcomeTreatment(status);
  if (!treatment) return null;
  if (treatment.accuracyTreatment === "exclude_from_scoring" || treatment.accuracyTreatment === "exclude_from_accuracy") return null;
  return treatment.accuracyScore;
}

function calculateCallAccuracy(calls: MarketCallRecord[]): { score: number | null; rationale: string; scoredCount: number } {
  const scoreable = calls.filter(c => c.outcomeStatus && SCOREABLE.includes(c.outcomeStatus));
  const minSample = DII_METHODOLOGY.components.find(c => c.measure === "call_accuracy")?.minSample ?? 3;
  if (scoreable.length < minSample) return { score: null, rationale: `Insufficient scored calls: ${scoreable.length} < ${minSample}`, scoredCount: 0 };
  const scores = scoreable.map(c => getAccuracyScore(c.outcomeStatus!) ?? 0);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return { score: Math.round(avg), rationale: `Mean outcome score across ${scoreable.length} resolved calls. Range: ${Math.min(...scores)}-${Math.max(...scores)}.`, scoredCount: scoreable.length };
}

function calculateFalsificationDiscipline(calls: MarketCallRecord[]): { score: number | null; rationale: string } {
  const resolved = calls.filter(c => c.outcomeStatus && RESOLVED.includes(c.outcomeStatus));
  const minSample = DII_METHODOLOGY.components.find(c => c.measure === "falsification_discipline")?.minSample ?? 3;
  if (resolved.length < minSample) return { score: null, rationale: `Insufficient resolved calls: ${resolved.length} < ${minSample}` };
  const carryForwardRate = resolved.filter(c => c.carryForwardJustification).length / resolved.length;
  const learningRate = resolved.filter(c => c.learning).length / resolved.length;
  const versionRate = resolved.filter(c => (c.versionHistory?.length ?? 0) > 0).length / resolved.length;
  return { score: Math.round(carryForwardRate * 40 + learningRate * 35 + versionRate * 25), rationale: `Carry-forward: ${(carryForwardRate*100).toFixed(0)}%, Learning: ${(learningRate*100).toFixed(0)}%, Version history: ${(versionRate*100).toFixed(0)}%` };
}

function calculateCalibrationQuality(calls: MarketCallRecord[]): { score: number | null; rationale: string } {
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

function calculateRevisionDiscipline(calls: MarketCallRecord[]): { score: number | null; rationale: string } {
  const minSample = DII_METHODOLOGY.components.find(c => c.measure === "revision_discipline")?.minSample ?? 3;
  if (calls.length < minSample) return { score: null, rationale: `Insufficient calls: ${calls.length} < ${minSample}` };
  const withHistory = calls.filter(c => (c.versionHistory?.length ?? 0) > 0);
  const revisionRate = withHistory.length / calls.length;
  const avgRevisions = withHistory.length > 0 ? withHistory.reduce((a, c) => a + (c.versionHistory?.length ?? 0), 0) / withHistory.length : 0;
  return { score: Math.round(Math.min(100, revisionRate * 150) * 0.6 + Math.min(100, avgRevisions * 50) * 0.4), rationale: `Revision rate: ${(revisionRate*100).toFixed(0)}% (${withHistory.length}/${calls.length}), Avg revisions per call: ${avgRevisions.toFixed(1)}` };
}

function calculateCoverage(calls: MarketCallRecord[]): DiiCoverage {
  const totalCalls = calls.length, scoredCalls = calls.filter(c => c.outcomeStatus && SCOREABLE.includes(c.outcomeStatus)).length, pendingCalls = calls.filter(c => c.outcomeStatus === "PENDING_REVIEW").length;
  return { status: getCoverageStatus(scoredCalls), totalCalls, scoredCalls, pendingCalls, minRequired: DII_METHODOLOGY.coverage.minScoredForHeadline };
}

function buildComponentScores(calls: MarketCallRecord[]): DiiComponentScore[] {
  const accuracy = calculateCallAccuracy(calls), falsification = calculateFalsificationDiscipline(calls), calibration = calculateCalibrationQuality(calls), revision = calculateRevisionDiscipline(calls);
  return [
    { measure: "call_accuracy", score: accuracy.score ?? 0, weight: getComponentWeight("call_accuracy") ?? 0.35, weightRationale: DII_METHODOLOGY.components.find(c => c.measure === "call_accuracy")?.weightRationale ?? "", rationale: accuracy.rationale },
    { measure: "falsification_discipline", score: falsification.score ?? 0, weight: getComponentWeight("falsification_discipline") ?? 0.25, weightRationale: DII_METHODOLOGY.components.find(c => c.measure === "falsification_discipline")?.weightRationale ?? "", rationale: falsification.rationale },
    { measure: "calibration_quality", score: calibration.score ?? 0, weight: getComponentWeight("calibration_quality") ?? 0.25, weightRationale: DII_METHODOLOGY.components.find(c => c.measure === "calibration_quality")?.weightRationale ?? "", rationale: calibration.rationale },
    { measure: "revision_discipline", score: revision.score ?? 0, weight: getComponentWeight("revision_discipline") ?? 0.15, weightRationale: DII_METHODOLOGY.components.find(c => c.measure === "revision_discipline")?.weightRationale ?? "", rationale: revision.rationale },
  ];
}

function buildEditionTrend(calls: MarketCallRecord[], editionLabel: string): EditionTrend {
  const coverage = calculateCoverage(calls);
  const components = buildComponentScores(calls);
  const allScored = components.every(c => c.score !== null);
  const headlineScore = coverage.status === "PUBLISHABLE" && allScored ? Math.round(components.reduce((a, c) => a + c.score * c.weight, 0)) : null;
  const pubStatus: PublicationStatus = coverage.status === "INSUFFICIENT_COVERAGE" ? "INSUFFICIENT_COVERAGE" : coverage.status === "PRELIMINARY" ? "PRELIMINARY" : "PUBLISHABLE";
  return { editionId: calls[0]?.reportId ?? "unknown", editionLabel, diiScore: headlineScore, publicationStatus: pubStatus, componentScores: components, coverage, callCount: calls.length };
}

export function calculateDecisionIntegrityIndex(): DecisionIntegrityIndex {
  const allCalls = [...MARKET_CALL_LEDGER], coverage = calculateCoverage(allCalls);
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

export function calculateEditionDii(editionId: string): EditionTrend | null {
  const calls = MARKET_CALL_LEDGER.filter(c => c.reportId === editionId);
  return calls.length === 0 ? null : buildEditionTrend(calls, editionId === "GMI-Q1-2026" ? "GMI Q1 2026" : editionId);
}