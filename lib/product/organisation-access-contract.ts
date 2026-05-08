/**
 * lib/product/organisation-access-contract.ts — Organisation access types.
 *
 * Defines who can see organisation-level decision intelligence,
 * what they can see, and what is suppressed.
 *
 * Control Room is premium enterprise infrastructure.
 * Sponsors see aggregated intelligence.
 * Operators see operational state according to role.
 * Raw respondent data is protected.
 * Anonymous campaigns remain anonymous.
 * Small samples are suppressed.
 */

// ─────────────────────────────────────────────────────────────────────────────
// ROLES
// ─────────────────────────────────────────────────────────────────────────────

export type OrganisationAccessRole =
  | "OWNER"
  | "SPONSOR"
  | "DECISION_OWNER"
  | "OPERATOR"
  | "REVIEWER"
  | "FINANCE"
  | "RESPONDENT"
  | "OBSERVER";

// ─────────────────────────────────────────────────────────────────────────────
// SCOPES
// ─────────────────────────────────────────────────────────────────────────────

export type OrganisationAccessScope =
  | "CONTROL_ROOM_VIEW"
  | "CAMPAIGN_MANAGE"
  | "CAMPAIGN_VIEW_AGGREGATE"
  | "RESPONDENT_VIEW_SELF"
  | "RAW_RESPONSE_VIEW"
  | "ENTITLEMENT_MANAGE"
  | "ADMISSION_REVIEW"
  | "EVIDENCE_REVIEW"
  | "OPERATOR_ADMIN";

// ─────────────────────────────────────────────────────────────────────────────
// PRIVACY BOUNDARY
// ─────────────────────────────────────────────────────────────────────────────

export type PrivacyBoundary = {
  canViewRawResponses: boolean;
  canViewNamedRespondents: boolean;
  canViewAggregates: boolean;
  smallSampleSuppressionApplies: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCESS DECISION
// ─────────────────────────────────────────────────────────────────────────────

export type OrganisationAccessDecision = {
  allowed: boolean;
  role?: OrganisationAccessRole;
  scopes: OrganisationAccessScope[];
  reason: string;
  privacyBoundary: PrivacyBoundary;
};

// ─────────────────────────────────────────────────────────────────────────────
// ROLE → SCOPE MAPPING
// ─────────────────────────────────────────────────────────────────────────────

/** Conservative v0 scope grants per role. */
export const ROLE_SCOPES: Record<OrganisationAccessRole, OrganisationAccessScope[]> = {
  OWNER: ["CONTROL_ROOM_VIEW", "CAMPAIGN_MANAGE", "CAMPAIGN_VIEW_AGGREGATE", "ENTITLEMENT_MANAGE", "ADMISSION_REVIEW", "EVIDENCE_REVIEW"],
  SPONSOR: ["CONTROL_ROOM_VIEW", "CAMPAIGN_MANAGE", "CAMPAIGN_VIEW_AGGREGATE", "ADMISSION_REVIEW"],
  DECISION_OWNER: ["CAMPAIGN_VIEW_AGGREGATE", "RESPONDENT_VIEW_SELF"],
  OPERATOR: ["CONTROL_ROOM_VIEW", "CAMPAIGN_VIEW_AGGREGATE", "ADMISSION_REVIEW", "EVIDENCE_REVIEW", "OPERATOR_ADMIN"],
  REVIEWER: ["CAMPAIGN_VIEW_AGGREGATE", "EVIDENCE_REVIEW"],
  FINANCE: ["ENTITLEMENT_MANAGE"],
  RESPONDENT: ["RESPONDENT_VIEW_SELF"],
  OBSERVER: ["CAMPAIGN_VIEW_AGGREGATE"],
};

/** Conservative v0 privacy boundaries per role. */
export const ROLE_PRIVACY: Record<OrganisationAccessRole, PrivacyBoundary> = {
  OWNER: { canViewRawResponses: false, canViewNamedRespondents: true, canViewAggregates: true, smallSampleSuppressionApplies: true },
  SPONSOR: { canViewRawResponses: false, canViewNamedRespondents: true, canViewAggregates: true, smallSampleSuppressionApplies: true },
  DECISION_OWNER: { canViewRawResponses: false, canViewNamedRespondents: false, canViewAggregates: true, smallSampleSuppressionApplies: true },
  OPERATOR: { canViewRawResponses: false, canViewNamedRespondents: false, canViewAggregates: true, smallSampleSuppressionApplies: true },
  REVIEWER: { canViewRawResponses: false, canViewNamedRespondents: false, canViewAggregates: true, smallSampleSuppressionApplies: true },
  FINANCE: { canViewRawResponses: false, canViewNamedRespondents: false, canViewAggregates: false, smallSampleSuppressionApplies: true },
  RESPONDENT: { canViewRawResponses: false, canViewNamedRespondents: false, canViewAggregates: false, smallSampleSuppressionApplies: true },
  OBSERVER: { canViewRawResponses: false, canViewNamedRespondents: false, canViewAggregates: true, smallSampleSuppressionApplies: true },
};
