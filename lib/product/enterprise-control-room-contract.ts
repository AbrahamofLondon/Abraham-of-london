import type { OversightCadenceState } from "@/lib/product/oversight-cadence-contract";
import type { VisibilityRetainedSummary } from "@/lib/product/visibility-retained";

export type EnterpriseControlRoomSectionStatus =
  | "LIVE"
  | "INSUFFICIENT_EVIDENCE"
  | "SUPPRESSED_PRIVACY_RISK";

export type EnterpriseCommandState = {
  governanceStatus: "UNDER_GOVERNANCE" | "REVIEW_REQUIRED" | "PAUSED" | "INSUFFICIENT_EVIDENCE";
  deterioratingDecisionCount: number;
  recurringPatternCount: number;
  closingOptionCount: number;
  irreversibleRiskCount: number;
  unresolvedCounselCount: number;
  repeatedBoardroomExposureCount: number;
  breachedCommitmentCount: number;
  worseningDivergenceCount: number;
  leadershipDecisionNowCount: number;
};

export type EnterpriseControlRoomSection<T> = {
  key:
    | "COMMAND_STATE"
    | "ACTIVE_GOVERNED_DECISIONS"
    | "PATTERN_RECURRENCE_MAP"
    | "COST_AND_IRREVERSIBILITY_REGISTER"
    | "ORGANISATION_DIVERGENCE_MEMORY"
    | "BOARDROOM_EXPOSURE_ARCHIVE"
    | "COUNSEL_ESCALATION_LEDGER"
    | "COMMITMENT_AND_OUTCOME_VERIFICATION"
    | "GOVERNANCE_EVIDENCE_COVERAGE"
    | "STRATEGIC_OPTIONS_CLOSING"
    | "DEPENDENCY_RISK_MAP"
    | "CADENCE_AND_SLA_STATE"
    | "SPONSOR_REQUIRED_ACTIONS"
    | "VISIBILITY_LOST_IF_OVERSIGHT_STOPS";
  title: string;
  status: EnterpriseControlRoomSectionStatus;
  summary: string;
  data: T | null;
};

export type EnterpriseControlRoomSnapshot = {
  accountId?: string | null;
  organisationId?: string | null;
  generatedAt: string;
  commandState: EnterpriseCommandState;
  cadence: OversightCadenceState | null;
  sections: Array<EnterpriseControlRoomSection<unknown>>;
  sponsorRequiredActions: string[];
  visibilityRetained: VisibilityRetainedSummary | null;
  warnings: string[];
};
