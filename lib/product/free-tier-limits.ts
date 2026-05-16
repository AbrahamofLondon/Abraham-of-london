/**
 * lib/product/free-tier-limits.ts
 *
 * Free tier entitlement limits.
 *
 * Free users get 3 active governed cases. Existing and archived cases
 * remain readable. The limit only applies to creating/saving new active cases.
 *
 * Professional tier removes this limit and unlocks additional features.
 */

export const FREE_TIER_MAX_ACTIVE_CASES = 3;

export type TierPlan = "free" | "professional";

export type TierFeature =
  | "active_case_limit"
  | "return_brief_generation"
  | "client_safe_evidence_export"
  | "case_sharing"
  | "strategy_room_eligibility"
  | "executive_reporting_eligibility"
  | "organisation_workspace";

/**
 * Features available per tier.
 */
export const TIER_FEATURES: Record<TierPlan, TierFeature[]> = {
  free: [
    "active_case_limit", // limited to FREE_TIER_MAX_ACTIVE_CASES
  ],
  professional: [
    "active_case_limit", // unlimited
    "return_brief_generation",
    "client_safe_evidence_export",
    "case_sharing",
    "strategy_room_eligibility",
    "executive_reporting_eligibility",
    "organisation_workspace",
  ],
};

/**
 * Human-readable label for each tier feature.
 */
export function describeTierFeature(feature: TierFeature): string {
  switch (feature) {
    case "active_case_limit":
      return "Active governed cases";
    case "return_brief_generation":
      return "Return Brief generation";
    case "client_safe_evidence_export":
      return "Client-safe evidence export";
    case "case_sharing":
      return "Client-safe case sharing";
    case "strategy_room_eligibility":
      return "Strategy Room eligibility";
    case "executive_reporting_eligibility":
      return "Executive Reporting eligibility";
    case "organisation_workspace":
      return "Organisation collaboration";
  }
}

/**
 * Professional upgrade modal copy.
 */
export const UPGRADE_MODAL_TITLE = "You have reached the free active case limit.";

export const UPGRADE_MODAL_BODY =
  "Your existing records remain readable. To keep governing new active cases, upgrade to Professional.";

export const PROFESSIONAL_FEATURE_LIST: TierFeature[] = [
  "active_case_limit",
  "return_brief_generation",
  "client_safe_evidence_export",
  "case_sharing",
  "organisation_workspace",
];
