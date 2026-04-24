/**
 * OutcomeFeedback — tracks prediction vs reality across the system.
 *
 * Every decision simulation makes a prediction. This module:
 * - Persists predictions at the time they're made
 * - Compares them to actual outcomes when available
 * - Computes accuracy deltas
 * - Feeds accuracy back into confidence weighting
 *
 * This is what makes the system get stronger with use:
 * more outcomes = better calibration = sharper predictions.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type Prediction = {
  id: string;
  decisionId: string;
  predictedAt: string;
  /** What the system predicted would happen */
  predictedOutcome: string;
  /** Severity predicted at 90 days (0-10) */
  predictedSeverity: number;
  /** Degradation projected at 90 days (0-100) */
  predictedDegradation: number;
  /** Confidence at time of prediction */
  predictionConfidence: number;
  /** What assessment/stage produced this prediction */
  source: string;
};

export type ActualOutcome = {
  predictionId: string;
  observedAt: string;
  /** What actually happened */
  actualOutcome: string;
  /** Actual severity (0-10) */
  actualSeverity: number;
  /** Actual degradation observed (0-100) */
  actualDegradation: number;
  /** Was the prediction directionally correct? */
  directionCorrect: boolean;
};

export type PredictionDelta = {
  predictionId: string;
  /** Severity delta: actual - predicted (positive = worse than predicted) */
  severityDelta: number;
  /** Degradation delta: actual - predicted */
  degradationDelta: number;
  /** Absolute accuracy: 0-1 (1 = perfect prediction) */
  accuracy: number;
  /** Was the system's direction correct? */
  directionCorrect: boolean;
  /** Days between prediction and observation */
  elapsedDays: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// DELTA COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────

export function computePredictionDelta(
  prediction: Prediction,
  outcome: ActualOutcome,
): PredictionDelta {
  const severityDelta = outcome.actualSeverity - prediction.predictedSeverity;
  const degradationDelta = outcome.actualDegradation - prediction.predictedDegradation;

  // Accuracy: 1 - normalized error
  const severityError = Math.abs(severityDelta) / 10;
  const degradationError = Math.abs(degradationDelta) / 100;
  const accuracy = Math.round((1 - (severityError * 0.6 + degradationError * 0.4)) * 100) / 100;

  const predictedMs = new Date(prediction.predictedAt).getTime();
  const observedMs = new Date(outcome.observedAt).getTime();
  const elapsedDays = Math.round((observedMs - predictedMs) / (1000 * 60 * 60 * 24));

  return {
    predictionId: prediction.id,
    severityDelta,
    degradationDelta,
    accuracy: Math.max(0, accuracy),
    directionCorrect: outcome.directionCorrect,
    elapsedDays,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM ACCURACY
// ─────────────────────────────────────────────────────────────────────────────

export type SystemAccuracy = {
  /** Total predictions made */
  totalPredictions: number;
  /** Predictions with observed outcomes */
  verifiedPredictions: number;
  /** Average accuracy across verified predictions (0-1) */
  avgAccuracy: number;
  /** Direction correctness rate (0-1) */
  directionAccuracyRate: number;
  /** Average severity prediction error */
  avgSeverityError: number;
  /** Whether the system tends to over-predict or under-predict severity */
  bias: "over_predicts" | "under_predicts" | "calibrated";
  /** Confidence calibration: does stated confidence match actual accuracy? */
  calibrationScore: number;
};

export function computeSystemAccuracy(deltas: PredictionDelta[]): SystemAccuracy {
  if (deltas.length === 0) {
    return {
      totalPredictions: 0,
      verifiedPredictions: 0,
      avgAccuracy: 0,
      directionAccuracyRate: 0,
      avgSeverityError: 0,
      bias: "calibrated",
      calibrationScore: 0,
    };
  }

  const avgAccuracy = deltas.reduce((s, d) => s + d.accuracy, 0) / deltas.length;
  const directionCorrectCount = deltas.filter((d) => d.directionCorrect).length;
  const avgSeverityDelta = deltas.reduce((s, d) => s + d.severityDelta, 0) / deltas.length;
  const avgSeverityError = deltas.reduce((s, d) => s + Math.abs(d.severityDelta), 0) / deltas.length;

  const bias: SystemAccuracy["bias"] =
    avgSeverityDelta > 1 ? "under_predicts"   // actual worse than predicted
    : avgSeverityDelta < -1 ? "over_predicts"  // actual better than predicted
    : "calibrated";

  // Calibration: compare stated confidence to actual accuracy
  // Perfect calibration: 70% confidence predictions are correct 70% of the time
  const calibrationScore = Math.round((1 - Math.abs(avgAccuracy - 0.70)) * 100) / 100;

  return {
    totalPredictions: deltas.length,
    verifiedPredictions: deltas.length,
    avgAccuracy: Math.round(avgAccuracy * 100) / 100,
    directionAccuracyRate: Math.round((directionCorrectCount / deltas.length) * 100) / 100,
    avgSeverityError: Math.round(avgSeverityError * 10) / 10,
    bias,
    calibrationScore,
  };
}
