import type { GovernedMemorySourceSurface } from "@/lib/product/governed-memory-contract";

export type FieldEvidencePosture =
  | "USER_REPORTED"
  | "SYSTEM_INFERRED"
  | "AGGREGATED"
  | "OPERATOR_REVIEWED"
  | "OUTCOME_VERIFIED"
  | "SUPPRESSED"
  | "SYSTEM_COMPUTED"
  | "ESTIMATED"
  | "INSUFFICIENT_DATA";

export type FieldConfidenceLabel =
  | "REPORTED"
  | "CAPTURED"
  | "AGGREGATED"
  | "CHECKED"
  | "PARTIAL"
  | "VERIFIED"
  | "REVIEWED"
  | "MEASURED"
  | "INFERRED"
  | "ESTIMATED"
  | "UNAVAILABLE";

export type FieldScopeType =
  | "CASE"
  | "ACCOUNT"
  | "ORGANISATION"
  | "OPERATOR"
  | "ASSESSMENT"
  | "CHECKPOINT"
  | "SESSION"
  | "RUN";

export type FieldComparisonBasis =
  | "CURRENT_VS_PRIOR"
  | "BASELINE_ONLY"
  | "THIN_STATE";

export type FieldProvenance = {
  fieldKey: string;
  sourceSurface: string;
  sourceLabel: string;
  capturedAt: string | null;
  computedAt: string | null;
  caseId: string | null;
  journeyId: string | null;
  strategyRoomSessionId: string | null;
  executiveRunId: string | null;
  assessmentId: string | null;
  evidencePosture: FieldEvidencePosture;
  confidenceLabel: FieldConfidenceLabel;
  scopeType: FieldScopeType;
  scopeId: string | null;
  isMerged: boolean;
  mergedFrom: FieldProvenance[];
  isSuppressed: boolean;
  suppressionReason: string | null;
  comparisonBasis: FieldComparisonBasis;
  priorValueDate: string | null;
  currentValueDate: string | null;
};

export const DATE_NOT_AVAILABLE_LABEL = "date not available";

export function sourceSurfaceLabel(
  surface: string | GovernedMemorySourceSurface,
): string {
  switch (surface) {
    case "FAST_DIAGNOSTIC":
      return "Fast Diagnostic";
    case "PURPOSE_ALIGNMENT":
      return "Purpose Alignment";
    case "TEAM_ASSESSMENT":
      return "Team Assessment";
    case "ENTERPRISE_ASSESSMENT":
      return "Enterprise Assessment";
    case "EXECUTIVE_REPORTING":
      return "Executive Reporting";
    case "STRATEGY_ROOM":
      return "Strategy Room";
    case "RETURN_BRIEF":
      return "Return Brief";
    case "OVERSIGHT_BRIEF":
      return "Oversight Brief";
    case "CONTROL_ROOM":
      return "Control Room";
    case "DECISION_CENTRE":
      return "Decision Centre";
    case "OUTCOME_VERIFICATION":
      return "Outcome Verification";
    case "COUNSEL_REVIEW":
      return "Counsel Review";
    case "BOARDROOM_MODE":
      return "Boardroom Mode";
    case "CONSTITUTIONAL_DIAGNOSTIC":
      return "Constitutional Diagnostic";
    default:
      return String(surface || "Recorded source")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

export function safeDateLabel(value: string | null | undefined): string {
  if (!value) return DATE_NOT_AVAILABLE_LABEL;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return DATE_NOT_AVAILABLE_LABEL;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function deriveComparisonBasis(input: {
  priorValueDate?: string | null;
  currentValueDate?: string | null;
}): FieldComparisonBasis {
  if (input.priorValueDate && input.currentValueDate) {
    return "CURRENT_VS_PRIOR";
  }
  if (input.currentValueDate) {
    return "BASELINE_ONLY";
  }
  return "THIN_STATE";
}

export function createFieldProvenance(
  input: Partial<FieldProvenance> & {
    fieldKey: string;
    sourceSurface: string;
  },
): FieldProvenance {
  const sourceLabel = input.sourceLabel?.trim() || sourceSurfaceLabel(input.sourceSurface);
  const comparisonBasis = input.comparisonBasis
    ?? deriveComparisonBasis({
      priorValueDate: input.priorValueDate,
      currentValueDate: input.currentValueDate ?? input.capturedAt ?? input.computedAt,
    });

  return {
    fieldKey: input.fieldKey,
    sourceSurface: input.sourceSurface,
    sourceLabel,
    capturedAt: input.capturedAt ?? null,
    computedAt: input.computedAt ?? null,
    caseId: input.caseId ?? null,
    journeyId: input.journeyId ?? null,
    strategyRoomSessionId: input.strategyRoomSessionId ?? null,
    executiveRunId: input.executiveRunId ?? null,
    assessmentId: input.assessmentId ?? null,
    evidencePosture: input.evidencePosture ?? "INSUFFICIENT_DATA",
    confidenceLabel: input.confidenceLabel ?? "UNAVAILABLE",
    scopeType: input.scopeType ?? "CASE",
    scopeId: input.scopeId ?? input.caseId ?? input.journeyId ?? input.strategyRoomSessionId ?? input.executiveRunId ?? input.assessmentId ?? null,
    isMerged: input.isMerged ?? false,
    mergedFrom: input.mergedFrom ?? [],
    isSuppressed: input.isSuppressed ?? false,
    suppressionReason: input.suppressionReason ?? null,
    comparisonBasis,
    priorValueDate: input.priorValueDate ?? null,
    currentValueDate: input.currentValueDate ?? input.capturedAt ?? input.computedAt ?? null,
  };
}

export function mergeFieldProvenance(
  fieldKey: string,
  sources: Array<FieldProvenance | null | undefined>,
): FieldProvenance[] {
  return sources
    .filter((source): source is FieldProvenance => Boolean(source))
    .map((source) =>
      source.fieldKey === fieldKey
        ? source
        : createFieldProvenance({
            ...source,
            fieldKey,
          }),
    );
}

export function hasRenderableFieldProvenance(
  provenance: Array<FieldProvenance | null | undefined> | null | undefined,
): provenance is FieldProvenance[] {
  return Array.isArray(provenance) && provenance.some((item) => Boolean(item?.sourceSurface));
}

export function formatFieldProvenanceLine(
  provenance: Array<FieldProvenance | null | undefined> | null | undefined,
  options?: {
    includeEvidencePosture?: boolean;
    includeComparisonBasis?: boolean;
    includeScope?: boolean;
  },
): string {
  if (!hasRenderableFieldProvenance(provenance)) {
    return `Source: unavailable · Captured: ${DATE_NOT_AVAILABLE_LABEL} · Evidence posture: insufficient data`;
  }

  const labels = provenance.map((item) => item.sourceLabel);
  const dates = provenance.map((item) => safeDateLabel(item.capturedAt ?? item.computedAt));
  const postures = provenance.map((item) => item.evidencePosture.replace(/_/g, " ").toLowerCase());
  const scopes = provenance
    .map((item) =>
      item.scopeId
        ? `${item.scopeType.toLowerCase()}: ${item.scopeId}`
        : item.scopeType.toLowerCase(),
    );
  const comparison = provenance[0]?.comparisonBasis ?? "THIN_STATE";
  const parts = [
    `Source: ${Array.from(new Set(labels)).join(" + ")}`,
    `Captured: ${Array.from(new Set(dates)).join(" + ")}`,
  ];

  if (options?.includeEvidencePosture !== false) {
    parts.push(`Evidence posture: ${Array.from(new Set(postures)).join(" + ")}`);
  }
  if (options?.includeComparisonBasis) {
    parts.push(`Comparison basis: ${comparison.replace(/_/g, " ").toLowerCase()}`);
  }
  if (options?.includeScope) {
    parts.push(`Scope: ${Array.from(new Set(scopes)).join(" + ")}`);
  }

  return parts.join(" · ");
}
