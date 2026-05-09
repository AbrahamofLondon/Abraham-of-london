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
    default:
      return "Governed Memory";
  }
}

export function formatMemorySourceLabel(item: GovernedMemoryItem): string {
  return `${item.confidenceLabel} in ${sourceSurfaceLabel(item.sourceSurface)}`;
}
