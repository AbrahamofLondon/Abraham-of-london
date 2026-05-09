import type { EvidencePosture } from "@/lib/product/evidence-memory-lifecycle-contract";
import type {
  FieldComparisonBasis,
  FieldProvenance,
} from "@/lib/product/field-provenance-contract";

export type IntelligenceScope = {
  userId?: string | null;
  userEmail?: string | null;
  caseId?: string | null;
  journeyId?: string | null;
  strategyRoomSessionId?: string | null;
  executiveRunId?: string | null;
  organisationId?: string | null;
  sourceSurface: string;
  scopeLabel: string;
  scopeType: "CASE" | "ACCOUNT" | "ORGANISATION" | "OPERATOR";
};

export type IntelligenceDataQuality =
  | "EMPTY"
  | "THIN"
  | "CASE_SCOPED"
  | "ACCOUNT_SCOPED"
  | "MATURE";

export type IntelligenceEmptyState = {
  reason: string;
  nextAction?: string;
};

export type IntelligenceEvidencePosture =
  | EvidencePosture
  | "SYSTEM_MEASURED"
  | "ESTIMATED"
  | "INSUFFICIENT_DATA";

export type IntelligenceConfidenceLabel =
  | "REPORTED"
  | "MEASURED"
  | "INFERRED"
  | "ESTIMATED"
  | "REVIEWED"
  | "VERIFIED"
  | "UNAVAILABLE";

export type IntelligenceMeta = {
  scope: IntelligenceScope;
  generatedAt: string;
  dataQuality: IntelligenceDataQuality;
  sourceLabel: string;
  sourceSurfaces?: string[];
  capturedAt?: string | null;
  previousCapturedAt?: string | null;
  currentCapturedAt?: string | null;
  evidencePosture: IntelligenceEvidencePosture;
  confidenceLabel: IntelligenceConfidenceLabel;
  evidenceBasis?: string;
  meaning?: string;
  limitation?: string;
  nextAction?: string;
  emptyState?: IntelligenceEmptyState;
  provenance: FieldProvenance[];
  comparisonBasis: FieldComparisonBasis;
};

export function defaultIntelligenceMeta(input: {
  scope: IntelligenceScope;
  sourceLabel: string;
  generatedAt?: string;
  capturedAt?: string | null;
  evidencePosture: IntelligenceEvidencePosture;
  confidenceLabel: IntelligenceConfidenceLabel;
  dataQuality: IntelligenceDataQuality;
  meaning?: string;
  limitation?: string;
  nextAction?: string;
  evidenceBasis?: string;
  sourceSurfaces?: string[];
  previousCapturedAt?: string | null;
  currentCapturedAt?: string | null;
  emptyState?: IntelligenceEmptyState;
  provenance?: FieldProvenance[];
  comparisonBasis?: FieldComparisonBasis;
}): IntelligenceMeta {
  return {
    scope: input.scope,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    dataQuality: input.dataQuality,
    sourceLabel: input.sourceLabel,
    sourceSurfaces: input.sourceSurfaces,
    capturedAt: input.capturedAt ?? null,
    previousCapturedAt: input.previousCapturedAt ?? null,
    currentCapturedAt: input.currentCapturedAt ?? null,
    evidencePosture: input.evidencePosture,
    confidenceLabel: input.confidenceLabel,
    evidenceBasis: input.evidenceBasis,
    meaning: input.meaning,
    limitation: input.limitation,
    nextAction: input.nextAction,
    emptyState: input.emptyState,
    provenance: input.provenance ?? [],
    comparisonBasis: input.comparisonBasis
      ?? (input.previousCapturedAt && input.currentCapturedAt
        ? "CURRENT_VS_PRIOR"
        : input.currentCapturedAt || input.capturedAt
          ? "BASELINE_ONLY"
          : "THIN_STATE"),
  };
}
