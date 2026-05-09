import type { IntelligenceMeta, IntelligenceScope } from "@/lib/product/intelligence-contract";
import { defaultIntelligenceMeta } from "@/lib/product/intelligence-contract";
import { createFieldProvenance } from "@/lib/product/field-provenance-contract";

export type WhatChangedSummary = {
  hasPriorState: boolean;
  scopeCaseId: string;
  previousObservedAt: string | null;
  currentObservedAt: string | null;
  changes: Array<{
    field: string;
    previous: string | number | null;
    current: string | number | null;
    delta?: string | null;
    direction: "IMPROVED" | "DETERIORATED" | "UNCHANGED" | "NEW_SIGNAL" | "INSUFFICIENT_HISTORY";
    sourceLabel: string;
    evidencePosture: string;
  }>;
  headline: string;
  caution?: string;
  meta: IntelligenceMeta;
};

export type ComparableCaseState = {
  observedAt?: string | null;
  coherenceBand?: string | null;
  weakestDomain?: string | null;
  contradictionCount?: number | null;
  checkpointResponseStatus?: string | null;
  decisionVelocityBand?: string | null;
  financialExposureBand?: string | null;
  irreversibilityBand?: string | null;
  routeDecision?: string | null;
  strategyRoomExecutionStatus?: string | null;
  counselCaseStatus?: string | null;
};

const orderings: Record<string, string[]> = {
  coherenceBand: ["DISORDERED", "DRIFTING", "MISALIGNED", "PARTIAL", "ALIGNED"],
  checkpointResponseStatus: ["OVERDUE", "DUE", "PENDING", "BLOCKED", "ABANDONED", "DISPUTED_FINDING", "PARTIALLY_COMPLETED", "COMPLETED"],
  decisionVelocityBand: ["STALLED", "SLOWING", "STEADY", "FAST"],
  financialExposureBand: ["LOW", "MODERATE", "HIGH", "CRITICAL"],
  irreversibilityBand: ["LOW", "MODERATE", "HIGH", "CRITICAL"],
};

function compareBand(field: string, previous: string | null, current: string | null): "IMPROVED" | "DETERIORATED" | "UNCHANGED" | "NEW_SIGNAL" | "INSUFFICIENT_HISTORY" {
  if (!previous && current) return "NEW_SIGNAL";
  if (previous && !current) return "INSUFFICIENT_HISTORY";
  if (!previous || !current) return "INSUFFICIENT_HISTORY";
  const ordering = orderings[field];
  if (!ordering) return previous === current ? "UNCHANGED" : "NEW_SIGNAL";
  const prevIndex = ordering.indexOf(previous.toUpperCase());
  const currentIndex = ordering.indexOf(current.toUpperCase());
  if (prevIndex < 0 || currentIndex < 0) return previous === current ? "UNCHANGED" : "NEW_SIGNAL";
  if (currentIndex === prevIndex) return "UNCHANGED";
  const lowerIsBetter = field === "financialExposureBand" || field === "irreversibilityBand";
  return lowerIsBetter
    ? (currentIndex < prevIndex ? "IMPROVED" : "DETERIORATED")
    : (currentIndex > prevIndex ? "IMPROVED" : "DETERIORATED");
}

function compareCount(previous: number | null, current: number | null, lowerIsBetter = true): "IMPROVED" | "DETERIORATED" | "UNCHANGED" | "NEW_SIGNAL" | "INSUFFICIENT_HISTORY" {
  if (previous == null && current != null) return "NEW_SIGNAL";
  if (previous == null || current == null) return "INSUFFICIENT_HISTORY";
  if (previous === current) return "UNCHANGED";
  return lowerIsBetter
    ? (current < previous ? "IMPROVED" : "DETERIORATED")
    : (current > previous ? "IMPROVED" : "DETERIORATED");
}

function headlineFor(changes: WhatChangedSummary["changes"]): string {
  const improved = changes.filter((change) => change.direction === "IMPROVED");
  const deteriorated = changes.filter((change) => change.direction === "DETERIORATED");
  if (deteriorated.length > 0) {
    const first = deteriorated[0];
    return `${first?.field ?? "Case state"} moved from ${String(first?.previous ?? "unknown")} to ${String(first?.current ?? "unknown")}.`;
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
  scope: IntelligenceScope;
  sourceLabel?: string;
  evidencePosture?: string;
  generatedAt?: string;
}): WhatChangedSummary {
  if (!input.previous) {
    const currentObservedAt = input.current.observedAt ?? null;
    return {
      hasPriorState: false,
      scopeCaseId: input.scope.caseId ?? "account-scope",
      previousObservedAt: null,
      currentObservedAt: input.current.observedAt ?? null,
      changes: [],
      headline: "No prior comparable record yet. This will become useful after another completed checkpoint, diagnostic, or outcome verification.",
      caution: "Compared with your previous recorded state only when a second dated record exists.",
      meta: defaultIntelligenceMeta({
        scope: input.scope,
        sourceLabel: input.sourceLabel ?? "Comparative case state",
        generatedAt: input.generatedAt,
        capturedAt: currentObservedAt,
        currentCapturedAt: currentObservedAt,
        evidencePosture: "INSUFFICIENT_DATA",
        confidenceLabel: "UNAVAILABLE",
        dataQuality: "THIN",
        evidenceBasis: "Requires two dated comparable records.",
        meaning: "Shows movement only when the record can compare two dated states.",
        limitation: "No prior comparable record has been captured yet.",
        nextAction: "Complete another checkpoint, diagnostic, or outcome verification.",
        provenance: [
          createFieldProvenance({
            fieldKey: "caseState.current",
            sourceSurface: input.scope.sourceSurface,
            sourceLabel: input.sourceLabel ?? "Comparative case state",
            capturedAt: currentObservedAt,
            caseId: input.scope.caseId ?? null,
            journeyId: input.scope.journeyId ?? null,
            strategyRoomSessionId: input.scope.strategyRoomSessionId ?? null,
            executiveRunId: input.scope.executiveRunId ?? null,
            scopeType: input.scope.scopeType,
            scopeId: input.scope.caseId ?? input.scope.journeyId ?? input.scope.strategyRoomSessionId ?? input.scope.executiveRunId ?? null,
            evidencePosture: "INSUFFICIENT_DATA",
            confidenceLabel: "UNAVAILABLE",
            comparisonBasis: currentObservedAt ? "BASELINE_ONLY" : "THIN_STATE",
            currentValueDate: currentObservedAt,
          }),
        ],
        comparisonBasis: currentObservedAt ? "BASELINE_ONLY" : "THIN_STATE",
        emptyState: {
          reason: "No prior comparable record yet.",
          nextAction: "Complete another checkpoint, diagnostic, or outcome verification.",
        },
      }),
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
      delta: previous.coherenceBand && current.coherenceBand && previous.coherenceBand !== current.coherenceBand ? `${previous.coherenceBand} -> ${current.coherenceBand}` : null,
      direction: compareBand("coherenceBand", previous.coherenceBand ?? null, current.coherenceBand ?? null),
      sourceLabel,
      evidencePosture,
    },
    {
      field: "weakest domain",
      previous: previous.weakestDomain ?? null,
      current: current.weakestDomain ?? null,
      delta: previous.weakestDomain && current.weakestDomain && previous.weakestDomain !== current.weakestDomain ? `${previous.weakestDomain} -> ${current.weakestDomain}` : null,
      direction: (previous.weakestDomain && current.weakestDomain
        ? (previous.weakestDomain === current.weakestDomain ? "UNCHANGED" : "NEW_SIGNAL")
        : "INSUFFICIENT_HISTORY") as WhatChangedSummary["changes"][number]["direction"],
      sourceLabel,
      evidencePosture,
    },
    {
      field: "contradiction count",
      previous: previous.contradictionCount ?? null,
      current: current.contradictionCount ?? null,
      delta: previous.contradictionCount != null && current.contradictionCount != null ? String(current.contradictionCount - previous.contradictionCount) : null,
      direction: compareCount(previous.contradictionCount ?? null, current.contradictionCount ?? null, true),
      sourceLabel,
      evidencePosture,
    },
    {
      field: "checkpoint status",
      previous: previous.checkpointResponseStatus ?? null,
      current: current.checkpointResponseStatus ?? null,
      delta: previous.checkpointResponseStatus && current.checkpointResponseStatus && previous.checkpointResponseStatus !== current.checkpointResponseStatus ? `${previous.checkpointResponseStatus} -> ${current.checkpointResponseStatus}` : null,
      direction: compareBand("checkpointResponseStatus", previous.checkpointResponseStatus ?? null, current.checkpointResponseStatus ?? null),
      sourceLabel,
      evidencePosture,
    },
    {
      field: "decision velocity",
      previous: previous.decisionVelocityBand ?? null,
      current: current.decisionVelocityBand ?? null,
      delta: previous.decisionVelocityBand && current.decisionVelocityBand && previous.decisionVelocityBand !== current.decisionVelocityBand ? `${previous.decisionVelocityBand} -> ${current.decisionVelocityBand}` : null,
      direction: compareBand("decisionVelocityBand", previous.decisionVelocityBand ?? null, current.decisionVelocityBand ?? null),
      sourceLabel,
      evidencePosture,
    },
    {
      field: "financial exposure band",
      previous: previous.financialExposureBand ?? null,
      current: current.financialExposureBand ?? null,
      delta: previous.financialExposureBand && current.financialExposureBand && previous.financialExposureBand !== current.financialExposureBand ? `${previous.financialExposureBand} -> ${current.financialExposureBand}` : null,
      direction: compareBand("financialExposureBand", previous.financialExposureBand ?? null, current.financialExposureBand ?? null),
      sourceLabel,
      evidencePosture,
    },
    {
      field: "irreversibility band",
      previous: previous.irreversibilityBand ?? null,
      current: current.irreversibilityBand ?? null,
      delta: previous.irreversibilityBand && current.irreversibilityBand && previous.irreversibilityBand !== current.irreversibilityBand ? `${previous.irreversibilityBand} -> ${current.irreversibilityBand}` : null,
      direction: compareBand("irreversibilityBand", previous.irreversibilityBand ?? null, current.irreversibilityBand ?? null),
      sourceLabel,
      evidencePosture,
    },
    {
      field: "route decision",
      previous: previous.routeDecision ?? null,
      current: current.routeDecision ?? null,
      delta: previous.routeDecision && current.routeDecision && previous.routeDecision !== current.routeDecision ? `${previous.routeDecision} -> ${current.routeDecision}` : null,
      direction: (previous.routeDecision && current.routeDecision
        ? (previous.routeDecision === current.routeDecision ? "UNCHANGED" : "NEW_SIGNAL")
        : "INSUFFICIENT_HISTORY") as WhatChangedSummary["changes"][number]["direction"],
      sourceLabel,
      evidencePosture,
    },
    {
      field: "strategy room execution status",
      previous: previous.strategyRoomExecutionStatus ?? null,
      current: current.strategyRoomExecutionStatus ?? null,
      delta: previous.strategyRoomExecutionStatus && current.strategyRoomExecutionStatus && previous.strategyRoomExecutionStatus !== current.strategyRoomExecutionStatus ? `${previous.strategyRoomExecutionStatus} -> ${current.strategyRoomExecutionStatus}` : null,
      direction: (previous.strategyRoomExecutionStatus && current.strategyRoomExecutionStatus
        ? (previous.strategyRoomExecutionStatus === current.strategyRoomExecutionStatus ? "UNCHANGED" : "NEW_SIGNAL")
        : "INSUFFICIENT_HISTORY") as WhatChangedSummary["changes"][number]["direction"],
      sourceLabel,
      evidencePosture,
    },
    {
      field: "counsel case status",
      previous: previous.counselCaseStatus ?? null,
      current: current.counselCaseStatus ?? null,
      delta: previous.counselCaseStatus && current.counselCaseStatus && previous.counselCaseStatus !== current.counselCaseStatus ? `${previous.counselCaseStatus} -> ${current.counselCaseStatus}` : null,
      direction: (previous.counselCaseStatus && current.counselCaseStatus
        ? (previous.counselCaseStatus === current.counselCaseStatus ? "UNCHANGED" : "NEW_SIGNAL")
        : "INSUFFICIENT_HISTORY") as WhatChangedSummary["changes"][number]["direction"],
      sourceLabel,
      evidencePosture,
    },
  ].filter((change) => change.previous != null || change.current != null);

  const previousObservedAt = previous.observedAt ?? null;
  const currentObservedAt = current.observedAt ?? null;
  const hasDatedComparison = Boolean(previousObservedAt && currentObservedAt);
  const provenance = changes.map((change) =>
    createFieldProvenance({
      fieldKey: change.field,
      sourceSurface: input.scope.sourceSurface,
      sourceLabel,
      capturedAt: currentObservedAt,
      caseId: input.scope.caseId ?? null,
      journeyId: input.scope.journeyId ?? null,
      strategyRoomSessionId: input.scope.strategyRoomSessionId ?? null,
      executiveRunId: input.scope.executiveRunId ?? null,
      scopeType: input.scope.scopeType,
      scopeId: input.scope.caseId ?? input.scope.journeyId ?? input.scope.strategyRoomSessionId ?? input.scope.executiveRunId ?? null,
      evidencePosture: evidencePosture === "USER_REPORTED" ? "USER_REPORTED" : "SYSTEM_INFERRED",
      confidenceLabel: hasDatedComparison ? "INFERRED" : "UNAVAILABLE",
      comparisonBasis: hasDatedComparison ? "CURRENT_VS_PRIOR" : currentObservedAt ? "BASELINE_ONLY" : "THIN_STATE",
      priorValueDate: previousObservedAt,
      currentValueDate: currentObservedAt,
    }),
  );
  return {
    hasPriorState: true,
    scopeCaseId: input.scope.caseId ?? "account-scope",
    previousObservedAt,
    currentObservedAt,
    changes: hasDatedComparison ? changes : [],
    headline: hasDatedComparison
      ? headlineFor(changes)
      : "No prior comparable record yet. This will become useful after another completed checkpoint, diagnostic, or outcome verification.",
    caution: evidencePosture === "USER_REPORTED"
      ? "This comparison includes user-reported state and is not independently verified."
      : hasDatedComparison
        ? "Compared with your previous recorded state."
        : "Compared with your previous recorded state only when a second dated record exists.",
    meta: defaultIntelligenceMeta({
      scope: input.scope,
      sourceLabel,
      generatedAt: input.generatedAt,
      capturedAt: currentObservedAt,
      previousCapturedAt: previousObservedAt,
      currentCapturedAt: currentObservedAt,
      evidencePosture: evidencePosture === "USER_REPORTED" ? "USER_REPORTED" : "SYSTEM_INFERRED",
      confidenceLabel: hasDatedComparison ? "INFERRED" : "UNAVAILABLE",
      dataQuality: hasDatedComparison ? "MATURE" : "THIN",
      evidenceBasis: "Compared with your previous recorded state.",
      meaning: "Shows whether recorded case state has changed between two dated observations.",
      limitation: hasDatedComparison ? undefined : "No prior dated comparable record exists yet.",
      nextAction: hasDatedComparison ? undefined : "Complete another checkpoint, diagnostic, or outcome verification.",
      provenance,
      comparisonBasis: hasDatedComparison ? "CURRENT_VS_PRIOR" : currentObservedAt ? "BASELINE_ONLY" : "THIN_STATE",
      emptyState: hasDatedComparison ? undefined : {
        reason: "No prior comparable record yet.",
        nextAction: "Complete another checkpoint, diagnostic, or outcome verification.",
      },
    }),
  };
}
