/**
 * Role Contract — Decision Infrastructure role and permission system.
 *
 * Defines the canonical role hierarchy and permission mapping for
 * Abraham of London's Decision Infrastructure product.
 */

export type DecisionRole =
  | "OWNER"
  | "SPONSOR"
  | "CLIENT"
  | "RESPONDENT"
  | "OPERATOR"
  | "COUNSEL_REVIEWER"
  | "ADMIN";

export type DecisionPermission =
  | "OVERSIGHT_VIEW"
  | "OVERSIGHT_DELIVER"
  | "OVERSIGHT_REVIEW"
  | "PROOF_VIEW"
  | "PROOF_GENERATE"
  | "COUNSEL_VIEW"
  | "COUNSEL_WORKFLOW"
  | "PORTFOLIO_VIEW"
  | "ADMIN_FULL"
  | "CLIENT_SAFE_VIEW"
  | "DELIVERY_APPROVE"
  | "SUPPRESSION_REVIEW"
  | "INSTITUTIONAL_CASE_VIEW"
  | "STRATEGY_EXECUTION_VIEW"
  | "BOARDROOM_VIEW"
  | "DELIVERY_MANAGE"
  | "CADENCE_MANAGE";

const ALL_PERMISSIONS: DecisionPermission[] = [
  "OVERSIGHT_VIEW",
  "OVERSIGHT_DELIVER",
  "OVERSIGHT_REVIEW",
  "PROOF_VIEW",
  "PROOF_GENERATE",
  "COUNSEL_VIEW",
  "COUNSEL_WORKFLOW",
  "PORTFOLIO_VIEW",
  "ADMIN_FULL",
  "CLIENT_SAFE_VIEW",
  "DELIVERY_APPROVE",
  "SUPPRESSION_REVIEW",
  "INSTITUTIONAL_CASE_VIEW",
  "STRATEGY_EXECUTION_VIEW",
  "BOARDROOM_VIEW",
  "DELIVERY_MANAGE",
  "CADENCE_MANAGE",
];

export const ROLE_PERMISSIONS: Record<DecisionRole, DecisionPermission[]> = {
  OWNER: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS,
  OPERATOR: [
    "OVERSIGHT_VIEW",
    "OVERSIGHT_DELIVER",
    "OVERSIGHT_REVIEW",
    "PROOF_VIEW",
    "PROOF_GENERATE",
    "COUNSEL_WORKFLOW",
    "PORTFOLIO_VIEW",
    "DELIVERY_APPROVE",
    "SUPPRESSION_REVIEW",
    "INSTITUTIONAL_CASE_VIEW",
    "STRATEGY_EXECUTION_VIEW",
    "BOARDROOM_VIEW",
    "DELIVERY_MANAGE",
    "CADENCE_MANAGE",
  ],
  SPONSOR: [
    "OVERSIGHT_VIEW",
    "PROOF_VIEW",
    "CLIENT_SAFE_VIEW",
    "PORTFOLIO_VIEW",
    "INSTITUTIONAL_CASE_VIEW",
    "BOARDROOM_VIEW",
  ],
  CLIENT: [
    "PROOF_VIEW",
    "CLIENT_SAFE_VIEW",
    "COUNSEL_VIEW",
    "INSTITUTIONAL_CASE_VIEW",
    "STRATEGY_EXECUTION_VIEW",
  ],
  RESPONDENT: [
    "CLIENT_SAFE_VIEW",
  ],
  COUNSEL_REVIEWER: [
    "COUNSEL_VIEW",
    "COUNSEL_WORKFLOW",
    "INSTITUTIONAL_CASE_VIEW",
  ],
};

/**
 * Surface permission requirements.
 * Maps UI surface identifiers to the minimum permission required for access.
 */
export const SURFACE_PERMISSIONS: Record<string, DecisionPermission> = {
  "oversight": "OVERSIGHT_VIEW",
  "oversight/brief": "OVERSIGHT_VIEW",
  "oversight/portfolio": "PORTFOLIO_VIEW",
  "boardroom": "BOARDROOM_VIEW",
  "boardroom/dossier": "BOARDROOM_VIEW",
  "counsel/status": "COUNSEL_VIEW",
  "counsel/intake": "COUNSEL_VIEW",
  "account/proof-pack": "PROOF_VIEW",
  "admin/delivery-queue": "DELIVERY_MANAGE",
  "admin/suppression-ledger": "SUPPRESSION_REVIEW",
  "admin/retained-cadence": "CADENCE_MANAGE",
  "admin/retainer-readiness": "ADMIN_FULL",
  "admin/full": "ADMIN_FULL",
  "institutional-case": "INSTITUTIONAL_CASE_VIEW",
  "strategy-room": "STRATEGY_EXECUTION_VIEW",
};

/**
 * Check whether a role has a specific permission.
 */
export function hasPermission(role: DecisionRole, permission: DecisionPermission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Check whether a role can view a named surface.
 * Returns true if the surface has no explicit permission requirement.
 */
export function canViewSurface(role: DecisionRole, surface: string): boolean {
  const required = SURFACE_PERMISSIONS[surface];
  if (!required) return true; // no restriction on unknown surfaces
  return hasPermission(role, required);
}
