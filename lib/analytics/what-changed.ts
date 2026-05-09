export type WhatChangedSummary = {
  hasPriorState: boolean;
  changes: Array<{
    field: string;
    previous: string | number | null;
    current: string | number | null;
    direction: "IMPROVED" | "WORSENED" | "UNCHANGED" | "UNKNOWN";
    sourceLabel: string;
    evidencePosture: string;
  }>;
  headline: string;
  caution?: string;
};

export type ComparableCaseState = {
  coherenceBand?: string | null;
  weakestDomain?: string | null;
  contradictionCount?: number | null;
  checkpointResponseStatus?: string | null;
  decisionVelocityBand?: string | null;
  financialExposureBand?: string | null;
  irreversibilityBand?: string | null;
  routeDecision?: string | null;
};

const orderings: Record<string, string[]> = {
  coherenceBand: ["DISORDERED", "DRIFTING", "MISALIGNED", "PARTIAL", "ALIGNED"],
  checkpointResponseStatus: ["OVERDUE", "DUE", "PENDING", "BLOCKED", "ABANDONED", "DISPUTED_FINDING", "PARTIALLY_COMPLETED", "COMPLETED"],
  decisionVelocityBand: ["STALLED", "SLOW", "STEADY", "FAST"],
  financialExposureBand: ["LOW", "MODERATE", "HIGH", "CRITICAL"],
  irreversibilityBand: ["LOW", "MODERATE", "HIGH", "CRITICAL"],
};

function compareBand(field: string, previous: string | null, current: string | null): "IMPROVED" | "WORSENED" | "UNCHANGED" | "UNKNOWN" {
  if (!previous || !current) return "UNKNOWN";
  const ordering = orderings[field];
  if (!ordering) return previous === current ? "UNCHANGED" : "UNKNOWN";
  const prevIndex = ordering.indexOf(previous.toUpperCase());
  const currentIndex = ordering.indexOf(current.toUpperCase());
  if (prevIndex < 0 || currentIndex < 0) return previous === current ? "UNCHANGED" : "UNKNOWN";
  if (currentIndex === prevIndex) return "UNCHANGED";
  const lowerIsBetter = field === "financialExposureBand" || field === "irreversibilityBand";
  return lowerIsBetter
    ? (currentIndex < prevIndex ? "IMPROVED" : "WORSENED")
    : (currentIndex > prevIndex ? "IMPROVED" : "WORSENED");
}

function compareCount(previous: number | null, current: number | null, lowerIsBetter = true): "IMPROVED" | "WORSENED" | "UNCHANGED" | "UNKNOWN" {
  if (previous == null || current == null) return "UNKNOWN";
  if (previous === current) return "UNCHANGED";
  return lowerIsBetter
    ? (current < previous ? "IMPROVED" : "WORSENED")
    : (current > previous ? "IMPROVED" : "WORSENED");
}

function headlineFor(changes: WhatChangedSummary["changes"]): string {
  const improved = changes.filter((change) => change.direction === "IMPROVED");
  const worsened = changes.filter((change) => change.direction === "WORSENED");
  if (worsened.length > 0) {
    const first = worsened[0];
    return `${first?.field ?? "Case state"} worsened from ${String(first?.previous ?? "unknown")} to ${String(first?.current ?? "unknown")}.`;
  }
  if (improved.length > 0) {
    const first = improved[0];
    return `${first?.field ?? "Case state"} moved from ${String(first?.previous ?? "unknown")} to ${String(first?.current ?? "unknown")}.`;
  }
  return "No material shift has been confirmed across the current comparable signals.";
}

export function buildWhatChangedSummary(input: {
  previous: ComparableCaseState | null;
  current: ComparableCaseState;
  sourceLabel?: string;
  evidencePosture?: string;
}): WhatChangedSummary {
  if (!input.previous) {
    return {
      hasPriorState: false,
      changes: [],
      headline: "No prior state exists yet. This case will become more useful after the next checkpoint or assessment.",
      caution: "Comparative intelligence begins only after a second governed state is captured.",
    };
  }

  const sourceLabel = input.sourceLabel ?? "Comparative case state";
  const evidencePosture = input.evidencePosture ?? "SYSTEM_INFERRED";
  const previous = input.previous;
  const current = input.current;

  const changes: WhatChangedSummary["changes"] = [
    {
      field: "coherence band",
      previous: previous.coherenceBand ?? null,
      current: current.coherenceBand ?? null,
      direction: compareBand("coherenceBand", previous.coherenceBand ?? null, current.coherenceBand ?? null),
      sourceLabel,
      evidencePosture,
    },
    {
      field: "weakest domain",
      previous: previous.weakestDomain ?? null,
      current: current.weakestDomain ?? null,
      direction: (previous.weakestDomain && current.weakestDomain
        ? (previous.weakestDomain === current.weakestDomain ? "UNCHANGED" : "UNKNOWN")
        : "UNKNOWN") as WhatChangedSummary["changes"][number]["direction"],
      sourceLabel,
      evidencePosture,
    },
    {
      field: "contradiction count",
      previous: previous.contradictionCount ?? null,
      current: current.contradictionCount ?? null,
      direction: compareCount(previous.contradictionCount ?? null, current.contradictionCount ?? null, true),
      sourceLabel,
      evidencePosture,
    },
    {
      field: "checkpoint status",
      previous: previous.checkpointResponseStatus ?? null,
      current: current.checkpointResponseStatus ?? null,
      direction: compareBand("checkpointResponseStatus", previous.checkpointResponseStatus ?? null, current.checkpointResponseStatus ?? null),
      sourceLabel,
      evidencePosture,
    },
    {
      field: "decision velocity",
      previous: previous.decisionVelocityBand ?? null,
      current: current.decisionVelocityBand ?? null,
      direction: compareBand("decisionVelocityBand", previous.decisionVelocityBand ?? null, current.decisionVelocityBand ?? null),
      sourceLabel,
      evidencePosture,
    },
    {
      field: "financial exposure band",
      previous: previous.financialExposureBand ?? null,
      current: current.financialExposureBand ?? null,
      direction: compareBand("financialExposureBand", previous.financialExposureBand ?? null, current.financialExposureBand ?? null),
      sourceLabel,
      evidencePosture,
    },
    {
      field: "irreversibility band",
      previous: previous.irreversibilityBand ?? null,
      current: current.irreversibilityBand ?? null,
      direction: compareBand("irreversibilityBand", previous.irreversibilityBand ?? null, current.irreversibilityBand ?? null),
      sourceLabel,
      evidencePosture,
    },
    {
      field: "route decision",
      previous: previous.routeDecision ?? null,
      current: current.routeDecision ?? null,
      direction: (previous.routeDecision && current.routeDecision
        ? (previous.routeDecision === current.routeDecision ? "UNCHANGED" : "UNKNOWN")
        : "UNKNOWN") as WhatChangedSummary["changes"][number]["direction"],
      sourceLabel,
      evidencePosture,
    },
  ].filter((change) => change.previous != null || change.current != null);

  return {
    hasPriorState: true,
    changes,
    headline: headlineFor(changes),
    caution: evidencePosture === "USER_REPORTED"
      ? "This comparison includes user-reported state and is not independently verified."
      : undefined,
  };
}
