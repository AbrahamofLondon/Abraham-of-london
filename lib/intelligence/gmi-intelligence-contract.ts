import {
  getMarketIntelligenceRecord,
  type MarketIntelligenceLifecycleRecord,
} from "./market-intelligence-lifecycle";

export type GmiReportState =
  | "DRAFT"
  | "EVIDENCE_COLLECTION"
  | "CALL_REVIEW"
  | "RELEASE_CANDIDATE"
  | "ACTIVE_UNTIL_SUPERSEDED"
  | "SUPERSEDED"
  | "ARCHIVED"
  | "RETIRED";

export type GmiEvidencePosture =
  | "CONFIRMED"
  | "DIRECTIONAL"
  | "MONITORING"
  | "SCENARIO_ASSUMPTION"
  | "OPERATOR_JUDGEMENT";

export type GmiReportReleaseStage = {
  reportId: string;
  state: GmiReportState;
  requiredActions: string[];
  blockers: string[];
  nextEligibleTransition: string | null;
};

export function mapLifecycleToGmiReportState(
  record: MarketIntelligenceLifecycleRecord,
): GmiReportState {
  switch (record.lifecycleState) {
    case "ACTIVE":
    case "ACTIVE_UNTIL_SUPERSEDED":
      return "ACTIVE_UNTIL_SUPERSEDED";
    case "SUPERSEDED":
      return "SUPERSEDED";
    case "ARCHIVED":
      return "ARCHIVED";
    case "RETIRED":
      return "RETIRED";
    case "DRAFT":
    case "SCHEDULED":
    default:
      return "DRAFT";
  }
}

export function getGmiReportState(reportId: string): GmiReportState | null {
  const record = getMarketIntelligenceRecord(reportId);
  return record ? mapLifecycleToGmiReportState(record) : null;
}
