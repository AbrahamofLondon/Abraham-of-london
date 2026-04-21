import {
  classifyOutcome,
  type OutcomeClassification,
  type OutcomeSnapshot,
} from "./outcome-model";

export type OutcomeFeedbackState = {
  tensionWeighting: Record<string, number>;
  escalationConfidence: number;
  trajectoryCalibration: Record<OutcomeClassification, number>;
  processedOutcomeCount: number;
  lastOutcomeClassification?: OutcomeClassification;
};

const INITIAL_STATE: OutcomeFeedbackState = {
  tensionWeighting: {},
  escalationConfidence: 0.5,
  trajectoryCalibration: {
    resolved: 0,
    improved: 0,
    stable: 0,
    deteriorated: 0,
    invalid: 0,
  },
  processedOutcomeCount: 0,
};

let feedbackState: OutcomeFeedbackState = {
  ...INITIAL_STATE,
  tensionWeighting: {},
  trajectoryCalibration: { ...INITIAL_STATE.trajectoryCalibration },
};

function roundTo(value: number, digits = 4): number {
  return Number(value.toFixed(digits));
}

export function increaseWeight(key: string, amount = 0.1): number {
  const normalized = key.trim();
  const current = feedbackState.tensionWeighting[normalized] ?? 1;
  const next = roundTo(Math.min(3, current + amount));
  feedbackState.tensionWeighting[normalized] = next;
  return next;
}

export function decreaseWeight(key: string, amount = 0.05): number {
  const normalized = key.trim();
  const current = feedbackState.tensionWeighting[normalized] ?? 1;
  const next = roundTo(Math.max(0.5, current - amount));
  feedbackState.tensionWeighting[normalized] = next;
  return next;
}

function updateEscalationConfidence(outcome: OutcomeClassification): void {
  if (outcome === "invalid") return;

  const adjustment =
    outcome === "resolved" || outcome === "improved"
      ? 0.025
      : outcome === "deteriorated"
        ? 0.04
        : 0.005;

  feedbackState.escalationConfidence = roundTo(
    Math.max(0, Math.min(1, feedbackState.escalationConfidence + adjustment)),
  );
}

export function recordOutcomeFeedback(snapshot: OutcomeSnapshot): OutcomeFeedbackState {
  const outcome = classifyOutcome(snapshot);

  feedbackState.processedOutcomeCount += 1;
  feedbackState.lastOutcomeClassification = outcome;
  feedbackState.trajectoryCalibration[outcome] = roundTo(
    (feedbackState.trajectoryCalibration[outcome] ?? 0) + 1,
  );

  if (outcome === "deteriorated") {
    increaseWeight("unmanaged_risk");
  } else if (outcome === "resolved") {
    decreaseWeight("unmanaged_risk");
    increaseWeight("intervention_effectiveness", 0.08);
  } else if (outcome === "improved") {
    increaseWeight("intervention_effectiveness", 0.04);
  } else if (outcome === "stable") {
    increaseWeight("persistence_risk", 0.04);
  }

  updateEscalationConfidence(outcome);

  return getOutcomeFeedbackState();
}

export function getOutcomeFeedbackState(): OutcomeFeedbackState {
  return {
    ...feedbackState,
    tensionWeighting: { ...feedbackState.tensionWeighting },
    trajectoryCalibration: { ...feedbackState.trajectoryCalibration },
  };
}

export function resetOutcomeFeedbackForTests(): void {
  feedbackState = {
    ...INITIAL_STATE,
    tensionWeighting: {},
    trajectoryCalibration: { ...INITIAL_STATE.trajectoryCalibration },
  };
}
