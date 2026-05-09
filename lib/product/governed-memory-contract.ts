// TODO: integrate recordSuppression() from @/lib/product/suppression-ledger when governed memory
// items transition to SUPPRESSED status — log the suppression event with field reference and reason
import type { FieldProvenance } from "@/lib/product/field-provenance-contract";
import {
  formatFieldProvenanceLine,
  sourceSurfaceLabel as canonicalSourceSurfaceLabel,
} from "@/lib/product/field-provenance-contract";

export type GovernedMemorySourceSurface =
  | "FAST_DIAGNOSTIC"
  | "PURPOSE_ALIGNMENT"
  | "TEAM_ASSESSMENT"
  | "ENTERPRISE_ASSESSMENT"
  | "EXECUTIVE_REPORTING"
  | "STRATEGY_ROOM"
  | "RETURN_BRIEF"
  | "OVERSIGHT_BRIEF"
  | "CONTROL_ROOM"
  | "DECISION_CENTRE"
  | "OUTCOME_VERIFICATION"
  | "COUNSEL_REVIEW"
  | "BOARDROOM_MODE";

export type GovernedMemoryEvidenceOrigin =
  | "SELF_REPORTED"
  | "STRUCTURED_DIAGNOSTIC"
  | "AGGREGATED_RESPONDENT"
  | "BEHAVIOURAL"
  | "VERIFIED_OUTCOME"
  | "OPERATOR_REVIEWED"
  | "SYSTEM_COMPUTED";

export type GovernedMemoryStatus =
  | "ACTIVE"
  | "UNRESOLVED"
  | "STALE"
  | "SUPERSEDED"
  | "RESOLVED"
  | "SUPPRESSED";

export type GovernedMemoryConfidenceLabel =
  | "REPORTED"
  | "CAPTURED"
  | "AGGREGATED"
  | "CHECKED"
  | "PARTIAL"
  | "VERIFIED"
  | "REVIEWED";

export type GovernedMemoryItem = {
  id: string;
  label: string;
  summary: string;
  sourceSurface: GovernedMemorySourceSurface;
  capturedAt: string | null;
  evidenceOrigin: GovernedMemoryEvidenceOrigin;
  status: GovernedMemoryStatus;
  confidenceLabel: GovernedMemoryConfidenceLabel;
  audienceSafe: boolean;
  suppressedReason?: string;
  relatedCaseId?: string | null;
  relatedCycleId?: string | null;
  relatedSessionId?: string | null;
  provenance?: FieldProvenance[];
};

export type GovernanceEvidenceCoverage = {
  totalCases: number;
  casesWithPriorAttempts: number;
  casesWithVerificationCriteria: number;
  casesWithRecurrenceSignal: number;
  casesWithUnresolvedCommitments: number;
  suppressedCount: number;
  coverageGrade: "LOW" | "PARTIAL" | "STRONG" | "GOVERNED";
  explanation: string;
  sponsorSafe: true;
};

export function deriveConfidenceLabel(
  origin: GovernedMemoryEvidenceOrigin,
): GovernedMemoryConfidenceLabel {
  switch (origin) {
    case "SELF_REPORTED":
      return "REPORTED";
    case "AGGREGATED_RESPONDENT":
      return "AGGREGATED";
    case "VERIFIED_OUTCOME":
      return "CHECKED";
    case "OPERATOR_REVIEWED":
      return "REVIEWED";
    case "STRUCTURED_DIAGNOSTIC":
    case "BEHAVIOURAL":
    default:
      return "CAPTURED";
  }
}

export function isMemoryDisplaySafe(item: GovernedMemoryItem): boolean {
  return item.audienceSafe && item.status !== "SUPPRESSED" && !item.suppressedReason;
}

function sourceSurfaceLabel(surface: GovernedMemorySourceSurface): string {
  return canonicalSourceSurfaceLabel(surface);
}

export function formatMemorySourceLabel(item: GovernedMemoryItem): string {
  if (item.provenance?.length) {
    return formatFieldProvenanceLine(item.provenance, {
      includeComparisonBasis: false,
      includeScope: false,
    });
  }
  return `${item.confidenceLabel} in ${sourceSurfaceLabel(item.sourceSurface)}`;
}
