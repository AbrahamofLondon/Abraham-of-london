import type { EvidenceTier } from "@/lib/product/living-intelligence-spine";

export type OrganisationScope =
  | "TEAM"
  | "BUSINESS_UNIT"
  | "ENTERPRISE"
  | "PORTFOLIO";

export type CampaignMode = "NAMED" | "ANONYMOUS" | "HYBRID";

export type CampaignStatus =
  | "DRAFT"
  | "ACTIVE"
  | "CLOSED"
  | "ANALYSED"
  | "INTERVENTION_READY"
  | "ARCHIVED";

export type ParticipantRole =
  | "SPONSOR"
  | "DECISION_OWNER"
  | "RESPONDENT"
  | "OBSERVER"
  | "OPERATOR"
  | "REVIEWER"
  | "FINANCE";

export type RespondentVisibility =
  | "RAW_HIDDEN"
  | "AGGREGATED_ONLY"
  | "NAMED_SUMMARY"
  | "OPERATOR_ONLY";

export type AggregationSafety =
  | "SAFE"
  | "SMALL_SAMPLE_SUPPRESSED"
  | "IDENTITY_RISK"
  | "INSUFFICIENT_RESPONSES";

export type AdmissionReadiness = {
  executiveReporting: "ADMITTED" | "RESTRICTED" | "NOT_EVALUATED";
  strategyRoom: "ADMITTED" | "RESTRICTED" | "NOT_EVALUATED";
  reason?: string;
};

export type MultiUserCampaignSummary = {
  campaignId: string;
  organisationId: string;
  title: string;
  scope: OrganisationScope;
  mode: CampaignMode;
  status: CampaignStatus;
  participantCount: number;
  responseCount: number;
  aggregationSafety: AggregationSafety;
  evidenceTier: EvidenceTier | string;
  divergenceCount: number;
  primaryDivergence?: string;
  admissionReadiness?: AdmissionReadiness;
  nextRequiredAction?: string;
};
