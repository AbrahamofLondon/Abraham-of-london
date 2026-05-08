/**
 * lib/product/evidence-memory-lifecycle-contract.ts
 *
 * Permanent evidence lifecycle taxonomy.
 * No evidence field may be called "closed" unless it passes
 * the full lifecycle verification.
 *
 * Storage is not memory.
 * Memory is evidence returning at the moment it matters.
 */

export type EvidenceLifecycleStatus =
  | "NOT_CAPTURED"
  | "CAPTURED_CLIENT_ONLY"
  | "SUBMITTED_NOT_PERSISTED"
  | "PERSISTED_NOT_LOADED"
  | "LOADED_NOT_CONSUMED"
  | "ACCEPTS_INPUT_BUT_NOT_PASSED"
  | "PASSED_NOT_RENDERED"
  | "RENDERED_NOT_LABELLED"
  | "RENDERED_AND_SOURCE_LABELLED"
  | "SIGNAL_BUILT_NOT_COMPOSED"
  | "SIGNAL_COMPOSED_NOT_RENDERED"
  | "SIGNAL_CONSUMED_AND_VISIBLE_IN_FINAL_OBJECT"
  | "SUPPRESSED_WITH_REASON"
  | "INTERNAL_ONLY_WITH_SUPPRESSION_GUARD"
  | "RETIRED";

export type EvidencePosture =
  | "USER_REPORTED"
  | "SYSTEM_INFERRED"
  | "AGGREGATED"
  | "OPERATOR_REVIEWED"
  | "COUNSEL_REVIEWED"
  | "OUTCOME_VERIFIED"
  | "SUPPRESSED"
  | "INTERNAL_ONLY";

export type EvidenceClosureVerdict =
  | "FULLY_CLOSED_HIGH_CONFIDENCE"
  | "PARTIALLY_CLOSED"
  | "ACCEPTS_INPUT_BUT_NOT_CONSUMED"
  | "PERSISTED_NOT_RENDERED"
  | "RENDERED_BUT_UNSAFE_OR_OVERCLAIMED"
  | "NOT_CLOSED"
  | "CANNOT_VERIFY";

export type EvidenceMemorySurface =
  | "FAST_DIAGNOSTIC"
  | "PURPOSE_ALIGNMENT"
  | "CONSTITUTIONAL"
  | "TEAM_ASSESSMENT"
  | "ENTERPRISE_ASSESSMENT"
  | "EXECUTIVE_REPORTING"
  | "STRATEGY_ROOM"
  | "RETURN_BRIEF"
  | "OVERSIGHT_BRIEF"
  | "COUNSEL_WORKFLOW"
  | "RETAINER_INTAKE"
  | "DECISION_CENTRE"
  | "CONTROL_ROOM";

export type EvidenceMemoryTrace = {
  fieldKey: string;
  sourceSurface: EvidenceMemorySurface;
  captureLocation?: string;
  submitLocation?: string;
  persistenceLocation?: string;
  loaderLocation?: string;
  composerLocation?: string;
  renderLocation?: string;
  suppressionLocation?: string;
  sourceLabel?: string;
  evidencePosture: EvidencePosture;
  lifecycleStatus: EvidenceLifecycleStatus;
  closureVerdict: EvidenceClosureVerdict;
  userVisible: boolean;
  operatorVisible: boolean;
  clientSafe: boolean;
  sponsorSafe: boolean;
  boardSafe: boolean;
  notes?: string;
};

export function classifyEvidenceTrace(trace: EvidenceMemoryTrace): EvidenceClosureVerdict {
  if (trace.renderLocation && trace.sourceLabel && trace.userVisible) {
    return "FULLY_CLOSED_HIGH_CONFIDENCE";
  }
  if (trace.composerLocation && trace.renderLocation) {
    return "FULLY_CLOSED_HIGH_CONFIDENCE";
  }
  if (trace.suppressionLocation && trace.notes) {
    return "FULLY_CLOSED_HIGH_CONFIDENCE";
  }
  if (trace.composerLocation && !trace.renderLocation) {
    return "PARTIALLY_CLOSED";
  }
  if (trace.loaderLocation && !trace.composerLocation) {
    return "ACCEPTS_INPUT_BUT_NOT_CONSUMED";
  }
  if (trace.persistenceLocation && !trace.loaderLocation) {
    return "PERSISTED_NOT_RENDERED";
  }
  return "NOT_CLOSED";
}

export function getEvidenceClosureSummary(traces: EvidenceMemoryTrace[]): {
  fullyClosed: number;
  partiallyClosed: number;
  notClosed: number;
  total: number;
  details: Array<{ fieldKey: string; verdict: EvidenceClosureVerdict }>;
} {
  const details = traces.map((t) => ({
    fieldKey: t.fieldKey,
    verdict: classifyEvidenceTrace(t),
  }));
  return {
    fullyClosed: details.filter((d) => d.verdict === "FULLY_CLOSED_HIGH_CONFIDENCE").length,
    partiallyClosed: details.filter((d) => d.verdict === "PARTIALLY_CLOSED").length,
    notClosed: details.filter((d) =>
      d.verdict !== "FULLY_CLOSED_HIGH_CONFIDENCE" && d.verdict !== "PARTIALLY_CLOSED"
    ).length,
    total: details.length,
    details,
  };
}
