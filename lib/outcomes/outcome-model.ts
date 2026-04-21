export type OutcomeClassification =
  | "resolved"
  | "improved"
  | "stable"
  | "deteriorated"
  | "invalid";

export type OutcomeSnapshot = {
  id: string;
  sessionId: string;
  organisation?: string;

  baseline: {
    dissonance: number;
    burnoutIndex: number;
    sovereignCertainty: number;
    escalationLevel: string;
  };

  followUp: {
    dissonance: number;
    burnoutIndex: number;
    sovereignCertainty: number;
    escalationLevel: string;
  };

  delta: {
    dissonanceChange: number;
    burnoutChange: number;
    certaintyChange: number;
  };

  outcomeClassification: OutcomeClassification;

  timeToOutcomeDays: number;
  createdAt: Date;
};

export type DecisionOutcomeLink = {
  decisionId: string;
  interventionStack: string[];
  outcomeSnapshotId?: string;
};

const ESCALATION_ORDER: Record<string, number> = {
  NONE: 0,
  ORDERED: 0,
  REJECT: 0,
  LOW: 1,
  WATCH: 1,
  MONITOR: 1,
  MONITORING: 1,
  DRIFTING: 1,
  MEDIUM: 2,
  MODERATE: 2,
  DIAGNOSTIC: 2,
  MISALIGNED: 2,
  HIGH: 3,
  STRATEGY: 3,
  ESCALATED: 3,
  DISORDERED: 3,
  CRITICAL: 4,
  SCORCHING: 4,
};

function isFiniteMetric(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeEscalation(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export function escalationRank(value: unknown): number {
  const normalized = normalizeEscalation(value);
  if (!normalized) return Number.NaN;
  return ESCALATION_ORDER[normalized] ?? 2;
}

export function deriveOutcomeDelta(
  input: Pick<OutcomeSnapshot, "baseline" | "followUp">,
): OutcomeSnapshot["delta"] {
  return {
    dissonanceChange: input.followUp.dissonance - input.baseline.dissonance,
    burnoutChange: input.followUp.burnoutIndex - input.baseline.burnoutIndex,
    certaintyChange:
      input.followUp.sovereignCertainty - input.baseline.sovereignCertainty,
  };
}

export function hasSufficientFollowUpData(snapshot: OutcomeSnapshot): boolean {
  return (
    isFiniteMetric(snapshot.baseline.dissonance) &&
    isFiniteMetric(snapshot.baseline.burnoutIndex) &&
    isFiniteMetric(snapshot.baseline.sovereignCertainty) &&
    isFiniteMetric(snapshot.followUp.dissonance) &&
    isFiniteMetric(snapshot.followUp.burnoutIndex) &&
    isFiniteMetric(snapshot.followUp.sovereignCertainty) &&
    Number.isFinite(escalationRank(snapshot.baseline.escalationLevel)) &&
    Number.isFinite(escalationRank(snapshot.followUp.escalationLevel)) &&
    Number.isFinite(snapshot.timeToOutcomeDays) &&
    snapshot.timeToOutcomeDays >= 0
  );
}

export function classifyOutcome(snapshot: OutcomeSnapshot): OutcomeClassification {
  if (!hasSufficientFollowUpData(snapshot)) {
    return "invalid";
  }

  const delta = deriveOutcomeDelta(snapshot);
  const baselineEscalation = escalationRank(snapshot.baseline.escalationLevel);
  const followUpEscalation = escalationRank(snapshot.followUp.escalationLevel);

  if (delta.dissonanceChange > 0 || followUpEscalation > baselineEscalation) {
    return "deteriorated";
  }

  const significantDissonanceDrop = delta.dissonanceChange < -20;
  if (significantDissonanceDrop && followUpEscalation === 0) {
    return "resolved";
  }

  if (delta.dissonanceChange < 0) {
    return "improved";
  }

  return "stable";
}

export function normalizeOutcomeSnapshot(
  snapshot: Omit<OutcomeSnapshot, "delta" | "outcomeClassification"> &
    Partial<Pick<OutcomeSnapshot, "delta" | "outcomeClassification">>,
): OutcomeSnapshot {
  const withDelta: OutcomeSnapshot = {
    ...snapshot,
    delta: snapshot.delta ?? deriveOutcomeDelta(snapshot),
    outcomeClassification: snapshot.outcomeClassification ?? "invalid",
  };

  return {
    ...withDelta,
    outcomeClassification: classifyOutcome(withDelta),
  };
}

export function createDecisionOutcomeLink(input: {
  decisionId: string;
  interventionStack?: string[] | null;
  outcomeSnapshotId?: string | null;
}): DecisionOutcomeLink {
  return {
    decisionId: input.decisionId,
    interventionStack: Array.isArray(input.interventionStack)
      ? input.interventionStack.filter((item): item is string => Boolean(item))
      : [],
    ...(input.outcomeSnapshotId ? { outcomeSnapshotId: input.outcomeSnapshotId } : {}),
  };
}
