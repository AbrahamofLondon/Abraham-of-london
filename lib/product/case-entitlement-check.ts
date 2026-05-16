/**
 * lib/product/case-entitlement-check.ts
 *
 * Checks whether a user can create a new active governed case
 * based on their tier and current active case count.
 *
 * Free tier: limited to FREE_TIER_MAX_ACTIVE_CASES active cases.
 * Professional tier: unlimited active cases.
 *
 * This module is Pages Router safe — no server-only imports.
 */

import { FREE_TIER_MAX_ACTIVE_CASES } from "./free-tier-limits";
import {
  isCountedActiveCaseStatus,
  normaliseGovernedCaseStatus,
} from "./case-status";

export type CaseEntitlementResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: "FREE_TIER_LIMIT_REACHED";
      activeCaseCount: number;
      maxActiveCases: number;
    };

/**
 * Checks whether the user is allowed to create a new active governed case.
 *
 * @param activeCaseCount - Current number of active governed cases for this user.
 * @param isProfessional - Whether the user has a Professional tier entitlement.
 * @returns CaseEntitlementResult
 */
export function checkCaseEntitlement(
  activeCaseCount: number,
  isProfessional: boolean,
): CaseEntitlementResult {
  if (isProfessional) {
    return { allowed: true };
  }

  if (activeCaseCount >= FREE_TIER_MAX_ACTIVE_CASES) {
    return {
      allowed: false,
      reason: "FREE_TIER_LIMIT_REACHED",
      activeCaseCount,
      maxActiveCases: FREE_TIER_MAX_ACTIVE_CASES,
    };
  }

  return { allowed: true };
}

/**
 * Counts active governed cases for a user from the API response.
 * A case is considered "active" if its status is not "resolved".
 *
 * @param cases - Array of case objects with a status field.
 * @returns Count of active cases.
 */
export function countActiveCases(
  cases: Array<{ status?: string | null; cognitiveState?: string; outcomeStatus?: string | null }>,
): number {
  return cases.filter((c) => {
    if (c.status) {
      return isCountedActiveCaseStatus(normaliseGovernedCaseStatus(c.status));
    }

    // Legacy fallback for call sites that have not yet adopted canonical status.
    if (c.outcomeStatus === "RESOLVED") return false;
    if (c.cognitiveState === "INSTITUTIONAL_INTELLIGENCE") return false;
    return true;
  }).length;
}
