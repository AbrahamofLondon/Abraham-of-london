/**
 * lib/product/action-entitlement.ts
 *
 * Entitlement check for Professional-only actions.
 * Used by API endpoints to gate actions behind the Professional tier.
 *
 * Returns a structured result that the caller can use to return
 * the appropriate HTTP status code and error message.
 */

import { hasProfessionalAccess } from "./professional-trial";

export type ActionEntitlementResult =
  | { allowed: true }
  | { allowed: false; reason: "PROFESSIONAL_REQUIRED"; message: string };

const ACTION_MESSAGES: Record<string, string> = {
  return_brief_generation:
    "Generating a Return Brief is a Professional continuity feature. Your case remains readable and active in Decision Centre.",
  evidence_export:
    "Exporting client-safe evidence is a Professional continuity feature. Your case remains readable.",
  case_sharing:
    "Sharing cases with reviewers is a Professional collaboration feature. Your case remains private and readable only by you.",
  organisation_invite:
    "Inviting organisation members is a Professional workspace feature.",
  benchmark_access:
    "Accessing advanced benchmark comparisons is a Professional intelligence feature.",
  api_key_creation:
    "Creating API keys is a Professional integration feature.",
};

/**
 * Checks whether the user is entitled to perform a Professional-only action.
 * If not allowed, returns a specific message for the action.
 */
export async function checkActionEntitlement(
  email: string,
  action: string,
): Promise<ActionEntitlementResult> {
  const hasAccess = await hasProfessionalAccess(email);
  if (hasAccess) {
    return { allowed: true };
  }

  const message = ACTION_MESSAGES[action] ?? "This action requires a Professional subscription.";
  return { allowed: false, reason: "PROFESSIONAL_REQUIRED", message };
}
