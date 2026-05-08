import type {
  AggregationSafety,
  CampaignMode,
  RespondentVisibility,
} from "@/lib/product/multi-user-contract";
import type { OversightCycleAudience } from "@/lib/product/oversight-cycle-ledger-contract";

export const DEFAULT_MINIMUM_SAFE_RESPONSES = 5;

export function evaluateAggregationSafety(input: {
  campaignMode: CampaignMode;
  responseCount: number;
  minimumSafeResponses?: number;
  namedConsent?: boolean;
}): AggregationSafety {
  const minimumSafeResponses = Math.max(
    1,
    input.minimumSafeResponses ?? DEFAULT_MINIMUM_SAFE_RESPONSES,
  );
  const responseCount = Math.max(0, input.responseCount);

  if (responseCount === 0) {
    return "INSUFFICIENT_RESPONSES";
  }

  if (responseCount < minimumSafeResponses) {
    return "SMALL_SAMPLE_SUPPRESSED";
  }

  if (
    (input.campaignMode === "NAMED" || input.campaignMode === "HYBRID") &&
    !input.namedConsent
  ) {
    return "IDENTITY_RISK";
  }

  return "SAFE";
}

export function defaultRespondentVisibility(input: {
  campaignMode: CampaignMode;
  aggregationSafety: AggregationSafety;
}): RespondentVisibility {
  if (input.aggregationSafety !== "SAFE") {
    return "AGGREGATED_ONLY";
  }

  if (input.campaignMode === "NAMED") {
    return "NAMED_SUMMARY";
  }

  return "AGGREGATED_ONLY";
}

export function canExposeRespondentIdentity(input: {
  visibility: RespondentVisibility;
  aggregationSafety: AggregationSafety;
}): boolean {
  return (
    input.aggregationSafety === "SAFE" &&
    input.visibility === "NAMED_SUMMARY"
  );
}

export function sponsorPrivacyNotice(input: {
  campaignMode: CampaignMode;
  aggregationSafety: AggregationSafety;
}): string {
  if (input.aggregationSafety === "INSUFFICIENT_RESPONSES") {
    return "Insufficient responses. Sponsor view is withheld until the evidence base is established.";
  }

  if (input.aggregationSafety === "SMALL_SAMPLE_SUPPRESSED") {
    return "Small-sample suppression is active. Sponsor view is limited to organisation-safe aggregation.";
  }

  if (input.aggregationSafety === "IDENTITY_RISK") {
    return "Identity risk detected. Respondent identity and raw text remain restricted pending explicit named consent.";
  }

  if (input.campaignMode === "NAMED") {
    return "Named campaign. Identity may appear in sponsor summaries only where the campaign explicitly permits it.";
  }

  if (input.campaignMode === "HYBRID") {
    return "Hybrid campaign. Sponsor view defaults to aggregation unless named consent is established for the relevant slice.";
  }

  return "Anonymous campaign. Sponsor view is aggregation-only by default.";
}

export function canViewOversightAudience(input: {
  audience: OversightCycleAudience;
  aggregationSafety: AggregationSafety;
  namedConsent?: boolean;
}): boolean {
  if (input.audience === "INTERNAL_OPERATOR") return true;
  if (input.audience === "RESPONDENT_SAFE") return true;
  if (input.audience === "CLIENT_SPONSOR") {
    return input.aggregationSafety === "SAFE" || input.aggregationSafety === "SMALL_SAMPLE_SUPPRESSED";
  }
  if (input.audience === "BOARD_LEVEL") {
    return input.aggregationSafety !== "INSUFFICIENT_RESPONSES";
  }
  return false;
}
