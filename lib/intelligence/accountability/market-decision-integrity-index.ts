/**
 * lib/intelligence/accountability/market-decision-integrity-index.ts
 *
 * §9 — Public Market Decision Integrity Index (DII).
 * MARKET accountability (organisation's published record of its own market judgement).
 * NOT the Customer Decision Integrity Trend (§15) — those are in compounding-intelligence.ts.
 *
 * Derived from canonical call-ledger evidence. NOT a magic number.
 * Every component score is traceable to specific calls, outcomes, and methodology.
 */
import { MARKET_CALL_LEDGER, type MarketCallRecord, type MarketCallOutcomeStatus } from "../market-intelligence-call-ledger";

export type DiicomponentMeasure = "call_accuracy" | "falsification_discipline" | "calibration_quality" | "revision_discipline";
export type DiiCoverageBucket = "sufficient" | "moderate" | "insufficient";

export interface DiiMethodology { version: string; scoringFormula: string; exclusions: string[]; uncertainty: string; minimumSampleRequirements: string; changeHistory: Array<{ version: string; date: string; change: string }>; }
export interface DiiComponentScore { measure: DiicomponentMeasure; score: number; weight: number; rationale: string; }
export interface DiiCoverage { bucket: DiiCoverageBucket; totalCalls: number; scoredCalls: number; pendingCalls: number; minRequired: number; }
export interface EditionTrend { editionId: string; editionLabel: string; diiScore: number | null; componentScores: DiiComponentScore[]; coverage: DiiCoverage; callCount: number; }
export interface DecisionIntegrityIndex { headlineScore: number | null; componentScores: DiiComponentScore[]; coverage: DiiCoverage; methodology: DiiMethodology; editionTrend: EditionTrend[]; generatedAt: string; valid: boolean; validityReason: string; }

const DII_METHODOLOGY: DiiMethodology = {
  version: "1.0.0",
  scoringFormula: "weighted_sum(component_scores) where each component is 0-100 and weights sum to 1.0. NULL if coverage insufficient.",
  exclusions: ["Calls with PENDING_REVIEW excluded from scoring", "TOO_EARLY_TO_ASSESS excluded from accuracy scoring but count toward coverage", "Editions with fewer than minimum required scored calls produce NULL headline"],
  uncertainty: "Scores derived from manually reviewed calls. Review lag may affect timeliness. Small sample sizes increase uncertainty.",
  minimumSampleRequirements: "Minimum 5 scored calls per edition for headline DII. Minimum 3 scored calls per component.",
  changeHistory: [{ version: "1.0.0", date: "2026-07-07", change: "Initial DII methodology" }],
};

const OUTCOME_SCORES: Record<MarketCallOutcomeStatus, number | null> = { CONFIRMED_STRONGLY: 100, DIRECTIONALLY_CONFIRMED: 75, PARTIALLY_CONFIRMED: 50, WEAKLY_SUPPORTED: 25, NOT_CONFIRMED: 0, DISCONFIRMED: 0, TOO_EARLY_TO_ASSESS: null, PENDING_REVIEW: null };
const SCOREABLE: MarketCallOutcomeStatus[] = ["CONFIRMED_STRONGLY","DIRECTIONALLY_CONFIRMED","PARTIALLY_CONFIRMED","WEAKLY_SUPPORTED","NOT_CONFIRMED","DISCONFIRMED"];
const RESOLVED: MarketCallOutcomeStatus[] = [...SCOREABLE, "TOO_EARLY_TO_ASSESS"];

function calculateCallAccuracy(calls: MarketCallRecord[]): { score: number | null; rationale: string; scoredCount: number } {
  const scoreable = calls.filter(c => c.outcomeStatus && SCOREABLE.includes(c.outcomeStatus));
  if (scoreable.length < 3) return { score: null, rationale: `Insufficient scored calls: ${scoreable.length} < 3`, scoredCount: 0 };
  const scores = scoreable.map(c => OUTCOME_SCORES[c.outcomeStatus!] ?? 0);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return { score: Math.round(avg), rationale: `Mean outcome score across ${scoreable.length} resolved calls. Range: ${Math.min(...scores)}-${Math.max(...scores)}.`, scoredCount: scoreable.length };
}

function calculateFalsificationDiscipline(calls: MarketCallRecord[]): { score: number | null; rationale: string } {
  const resolved = calls.filter(c => c.outcomeStatus && RESOLVED.includes(c.outcomeStatus));
  if (resolved.length < 3) return { score: null, rationale: `Insufficient resolved calls: ${resolved.length} < 3` };
  const carryForwardRate = resolved.filter(c => c.carryForwardJustification).length / resolved.length;
  const learningRate = resolved.filter(c => c.learning).length / resolved.length;
  const versionRate = resolved.filter(c => (c.versionHistory?.length ?? 0) > 0).length / resolved.length;
  return { score: Math.round(carryForwardRate * 40 + learningRate * 35 + versionRate * 25), rationale: `Carry-forward: ${(carryForwardRate*100).toFixed(0)}%, Learning: ${(learningRate*100).toFixed(0)}%, Version history: ${(versionRate*100).toFixed(0)}%` };
}

function calculateCalibrationQuality(calls: MarketCallRecord[]): { score: number | null; rationale: string } {
  const scoreable = calls.filter(c => c.outcomeStatus && SCOREABLE.includes(c.outcomeStatus));
  if (scoreable.length < 3) return { score: null, rationale: `Insufficient scored calls: ${scoreable.length} < 3` };
  const byConfidence = (conf: string) => { const f = scoreable.filter(c => c.originalConfidence === conf); return f.length ? f.reduce((a, c) => a + (OUTCOME_SCORES[c.outcomeStatus!] ?? 0), 0) / f.length : null; };
  const highAvg = byConfidence("HIGH"), medAvg = byConfidence("MEDIUM"), lowAvg = byConfidence("LOW");
  let penalty = 0;
  if (highAvg !== null && medAvg !== null && highAvg < medAvg) penalty += 15;
  if (medAvg !== null && lowAvg !== null && medAvg < lowAvg) penalty += 10;
  if (highAvg !== null && lowAvg !== null && highAvg < lowAvg) penalty += 10;
  const baseScore = highAvg !== null ? Math.round(highAvg) : 50;
  return { score: Math.max(0, Math.min(100, baseScore - penalty)), rationale: `High confidence avg: ${highAvg?.toFixed(0) ?? "N/A"}, Medium: ${medAvg?.toFixed(0) ?? "N/A"}, Low: ${lowAvg?.toFixed(0) ?? "N/A"}. Calibration penalty: ${penalty}.` };
}

function calculateRevisionDiscipline(calls: MarketCallRecord[]): { score: number | null; rationale: string } {
  if (calls.length < 3) return { score: null, rationale: `Insufficient calls: ${calls.length} < 3` };
  const withHistory = calls.filter(c => (c.versionHistory?.length ?? 0) > 0);
  const revisionRate = withHistory.length / calls.length;
  const avgRevisions = withHistory.length > 0 ? withHistory.reduce((a, c) => a + (c.versionHistory?.length ?? 0), 0) / withHistory.length : 0;
  return { score: Math.round(Math.min(100, revisionRate * 150) * 0.6 + Math.min(100, avgRevisions * 50) * 0.4), rationale: `Revision rate: ${(revisionRate*100).toFixed(0)}% (${withHistory.length}/${calls.length}), Avg revisions per call: ${avgRevisions.toFixed(1)}` };
}

function calculateCoverage(calls: MarketCallRecord[]): DiiCoverage {
  const totalCalls = calls.length, scoredCalls = calls.filter(c => c.outcomeStatus && SCOREABLE.includes(c.outcomeStatus)).length, pendingCalls = calls.filter(c => c.outcomeStatus === "PENDING_REVIEW").length;
  let bucket: DiiCoverageBucket = "insufficient";
  if (scoredCalls >= 5) bucket = "sufficient"; else if (scoredCalls >= 3) bucket = "moderate";
  return { bucket, totalCalls, scoredCalls, pendingCalls, minRequired: 5 };
}

function buildEditionTrend(calls: MarketCallRecord[], editionLabel: string): EditionTrend {
  const coverage = calculateCoverage(calls);
  const accuracy = calculateCallAccuracy(calls), falsification = calculateFalsificationDiscipline(calls), calibration = calculateCalibrationQuality(calls), revision = calculateRevisionDiscipline(calls);
  const components: DiiComponentScore[] = [
    { measure: "call_accuracy", score: accuracy.score ?? 0, weight: 0.35, rationale: accuracy.rationale },
    { measure: "falsification_discipline", score: falsification.score ?? 0, weight: 0.25, rationale: falsification.rationale },
    { measure: "calibration_quality", score: calibration.score ?? 0, weight: 0.25, rationale: calibration.rationale },
    { measure: "revision_discipline", score: revision.score ?? 0, weight: 0.15, rationale: revision.rationale },
  ];
  const allScored = components.every(c => c.score !== null);
  const headlineScore = coverage.bucket === "sufficient" && allScored ? Math.round(components.reduce((a, c) => a + c.score * c.weight, 0)) : null;
  return { editionId: calls[0]?.reportId ?? "unknown", editionLabel, diiScore: headlineScore, componentScores: components, coverage, callCount: calls.length };
}

export function calculateDecisionIntegrityIndex(): DecisionIntegrityIndex {
  const allCalls = [...MARKET_CALL_LEDGER], coverage = calculateCoverage(allCalls);
  const editionMap = new Map<string, MarketCallRecord[]>();
  for (const call of allCalls) { const existing = editionMap.get(call.reportId) || []; existing.push(call); editionMap.set(call.reportId, existing); }
  const editionTrend: EditionTrend[] = [];
  for (const [editionId, calls] of editionMap) editionTrend.push(buildEditionTrend(calls, editionId === "GMI-Q1-2026" ? "GMI Q1 2026" : editionId));
  const accuracy = calculateCallAccuracy(allCalls), falsification = calculateFalsificationDiscipline(allCalls), calibration = calculateCalibrationQuality(allCalls), revision = calculateRevisionDiscipline(allCalls);
  const components: DiiComponentScore[] = [
    { measure: "call_accuracy", score: accuracy.score ?? 0, weight: 0.35, rationale: accuracy.rationale },
    { measure: "falsification_discipline", score: falsification.score ?? 0, weight: 0.25, rationale: falsification.rationale },
    { measure: "calibration_quality", score: calibration.score ?? 0, weight: 0.25, rationale: calibration.rationale },
    { measure: "revision_discipline", score: revision.score ?? 0, weight: 0.15, rationale: revision.rationale },
  ];
  const allScored = components.every(c => c.score !== null);
  const headlineScore = coverage.bucket === "sufficient" && allScored ? Math.round(components.reduce((a, c) => a + c.score * c.weight, 0)) : null;
  const valid = coverage.bucket !== "insufficient";
  return { headlineScore, componentScores: components, coverage, methodology: DII_METHODOLOGY, editionTrend, generatedAt: new Date().toISOString(), valid, validityReason: !valid ? `Insufficient scored calls: ${coverage.scoredCalls} < ${coverage.minRequired}` : "Sufficient evidence for scoring" };
}

export function calculateEditionDii(editionId: string): EditionTrend | null {
  const calls = MARKET_CALL_LEDGER.filter(c => c.reportId === editionId);
  return calls.length === 0 ? null : buildEditionTrend(calls, editionId === "GMI-Q1-2026" ? "GMI Q1 2026" : editionId);
}
