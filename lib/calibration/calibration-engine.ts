/**
 * Calibration Engine — compares predictions to outcomes and proposes adjustments.
 *
 * RULES:
 * - No adjustment before N ≥ 5 outcomes
 * - Uses exponential moving average for dampening
 * - Caps adjustment per cycle (max 10% swing)
 * - Never allows one outcome to swing model behaviour
 * - All adjustments are proposals until applied by cron
 */

// ─────────────────────────────────────────────────────────────────────────────
// PREDICTION → OUTCOME COMPARISON
// ─────────────────────────────────────────────────────────────────────────────

export type ComparisonResult = {
  predictionError: number;       // 0-1: how far off the prediction was
  biasDirection: "OVERSTATED" | "UNDERSTATED" | "ACCURATE";
  reliabilitySignal: "LOW" | "MODERATE" | "HIGH";
};

const CLASSIFICATION_SEVERITY: Record<string, number> = {
  RESOLVED: 0,
  IMPROVED: 3,
  UNCHANGED: 5,
  DETERIORATED: 8,
};

export function comparePredictionToOutcome(input: {
  prediction: { classification?: string; severity?: number; effectiveness?: number };
  outcome: { classification: string; evidence?: string[]; observedAt: string };
}): ComparisonResult {
  const { prediction, outcome } = input;

  const predictedSeverity = prediction.severity ?? 5;
  const actualSeverity = CLASSIFICATION_SEVERITY[outcome.classification] ?? 5;
  const severityError = Math.abs(predictedSeverity - actualSeverity) / 10;

  // Classification match
  const predClass = prediction.classification ?? "UNCHANGED";
  const classMatch = predClass === outcome.classification ? 0 : 0.3;

  // Effectiveness match (if available)
  const effectivenessError = prediction.effectiveness != null
    ? Math.abs((prediction.effectiveness / 100) - (outcome.classification === "RESOLVED" ? 1 : outcome.classification === "IMPROVED" ? 0.7 : outcome.classification === "UNCHANGED" ? 0.4 : 0.1))
    : 0;

  const predictionError = Math.round(
    Math.min(1, severityError * 0.4 + classMatch * 0.35 + effectivenessError * 0.25) * 100,
  ) / 100;

  const biasDirection: ComparisonResult["biasDirection"] =
    predictedSeverity > actualSeverity + 1 ? "OVERSTATED"
    : predictedSeverity < actualSeverity - 1 ? "UNDERSTATED"
    : "ACCURATE";

  const evidenceCount = outcome.evidence?.length ?? 0;
  const reliabilitySignal: ComparisonResult["reliabilitySignal"] =
    evidenceCount >= 3 ? "HIGH"
    : evidenceCount >= 1 ? "MODERATE"
    : "LOW";

  return { predictionError, biasDirection, reliabilitySignal };
}

// ─────────────────────────────────────────────────────────────────────────────
// CALIBRATION ADJUSTMENT PROPOSAL
// ─────────────────────────────────────────────────────────────────────────────

export type CalibrationAdjustment = {
  shouldApply: boolean;
  reason: string;
  adjustment: {
    /** Severity bias correction: positive = system overpredicts, reduce severity */
    severityBiasCorrection: number;
    /** Confidence adjustment: positive = system is more accurate than thought */
    confidenceAdjustment: number;
    /** Number of outcomes this is based on */
    outcomeCount: number;
    /** Average prediction error across all events */
    avgError: number;
    /** EMA of recent errors (more weight on recent outcomes) */
    emaError: number;
  };
};

type CalibrationEvent = {
  predictionError: number | null;
  predictionSnapshot: Record<string, unknown>;
  outcomeSnapshot: Record<string, unknown>;
  createdAt: Date | string;
};

type CalibrationState = {
  outcomeCount: number;
  accuracyScore: number | null;
  biasScore: number | null;
  calibrationData: Record<string, unknown>;
};

/** Current modelVersion — attached to all calibration states and events */
export const CURRENT_MODEL_VERSION = "1.0.0";

/** Minimum outcomes before any adjustment is proposed */
const MIN_OUTCOMES = 5;
/** Maximum adjustment per cycle (10% swing cap) */
const MAX_ADJUSTMENT = 0.10;
/** EMA smoothing factor (0.3 = recent outcomes weighted more heavily) */
const EMA_ALPHA = 0.3;

export function proposeCalibrationAdjustment(input: {
  events: CalibrationEvent[];
  currentState: CalibrationState;
}): CalibrationAdjustment {
  const { events, currentState } = input;

  // Rule: no adjustment before N ≥ 5 outcomes
  if (events.length < MIN_OUTCOMES) {
    return {
      shouldApply: false,
      reason: `Insufficient outcomes (${events.length}/${MIN_OUTCOMES}). Need ${MIN_OUTCOMES - events.length} more before calibration.`,
      adjustment: {
        severityBiasCorrection: 0,
        confidenceAdjustment: 0,
        outcomeCount: events.length,
        avgError: 0,
        emaError: 0,
      },
    };
  }

  // Compute average error
  const errors = events
    .map((e) => e.predictionError ?? 0)
    .filter((e) => e >= 0);

  if (errors.length === 0) {
    return {
      shouldApply: false,
      reason: "No valid prediction errors to calibrate from.",
      adjustment: { severityBiasCorrection: 0, confidenceAdjustment: 0, outcomeCount: 0, avgError: 0, emaError: 0 },
    };
  }

  const avgError = errors.reduce((s, e) => s + e, 0) / errors.length;

  // Compute EMA (exponential moving average) — recent outcomes matter more
  let ema = errors[0]!;
  for (let i = 1; i < errors.length; i++) {
    ema = EMA_ALPHA * errors[i]! + (1 - EMA_ALPHA) * ema;
  }

  // Determine bias direction from predictions vs outcomes
  let overstateCount = 0;
  let understateCount = 0;
  for (const event of events) {
    const pred = event.predictionSnapshot as Record<string, unknown>;
    const out = event.outcomeSnapshot as Record<string, unknown>;
    const predSev = typeof pred.severity === "number" ? pred.severity : 5;
    const outClass = typeof out.classification === "string" ? out.classification : "UNCHANGED";
    const actualSev = CLASSIFICATION_SEVERITY[outClass] ?? 5;
    if (predSev > actualSev + 1) overstateCount++;
    if (predSev < actualSev - 1) understateCount++;
  }

  // Severity bias correction (capped)
  const biasTendency = (overstateCount - understateCount) / events.length;
  const severityBiasCorrection = Math.round(
    Math.max(-MAX_ADJUSTMENT, Math.min(MAX_ADJUSTMENT, biasTendency * 0.5)) * 100,
  ) / 100;

  // Confidence adjustment: if actual accuracy is better than predicted, boost confidence
  const currentAccuracy = currentState.accuracyScore ?? 0.5;
  const measuredAccuracy = 1 - avgError;
  const confidenceAdjustment = Math.round(
    Math.max(-MAX_ADJUSTMENT, Math.min(MAX_ADJUSTMENT, (measuredAccuracy - currentAccuracy) * 0.3)) * 100,
  ) / 100;

  // Should we apply?
  const shouldApply = Math.abs(severityBiasCorrection) >= 0.02 || Math.abs(confidenceAdjustment) >= 0.02;

  return {
    shouldApply,
    reason: shouldApply
      ? `Calibration proposed: severity bias ${severityBiasCorrection > 0 ? "overstating" : "understating"} by ${Math.abs(severityBiasCorrection * 100).toFixed(1)}%. Confidence ${confidenceAdjustment > 0 ? "should increase" : "should decrease"} by ${Math.abs(confidenceAdjustment * 100).toFixed(1)}%. Based on ${events.length} outcomes (EMA error: ${(ema * 100).toFixed(1)}%).`
      : `No significant calibration needed. Model is within acceptable accuracy (avg error: ${(avgError * 100).toFixed(1)}%).`,
    adjustment: {
      severityBiasCorrection,
      confidenceAdjustment,
      outcomeCount: events.length,
      avgError: Math.round(avgError * 1000) / 1000,
      emaError: Math.round(ema * 1000) / 1000,
    },
  };
}
