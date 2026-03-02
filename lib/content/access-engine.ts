/* ============================================================================
 * SOVEREIGN CONTENT ENGINE [CLIENT-SAFE] — SSOT ALIGNED
 * ============================================================================ */

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeUserTier,
  requiredTierFromDoc,
  hasAccess,
  getTierLabel,
} from "@/lib/access/tier-policy";

export type { AccessTier };

export function getRequiredTier(doc: unknown): AccessTier {
  return requiredTierFromDoc(doc as any);
}

export function canAccessDoc(
  doc: unknown,
  userTier: unknown = "public",
  options?: { debug?: boolean }
): boolean {
  try {
    const required = getRequiredTier(doc);
    const user = normalizeUserTier(userTier);
    const ok = hasAccess(user, required);

    if (options?.debug) {
      console.debug("[Access]", {
        doc: (doc as any)?.title || (doc as any)?.slug || "unknown",
        userTier: user,
        requiredTier: required,
        requiredLabel: getTierLabel(required),
        ok,
      });
    }

    return ok;
  } catch (error) {
    console.error("[Access] Error checking document access:", error);
    return false; // fail closed
  }
}

export function isPublic(doc: unknown): boolean {
  return getRequiredTier(doc) === "public";
}

export function requiresAuth(doc: unknown): boolean {
  return getRequiredTier(doc) !== "public";
}

export function getAccessibleTiers(doc: unknown): AccessTier[] {
  // tiers that can access are those >= required tier
  const required = getRequiredTier(doc);
  const order: AccessTier[] = [
    "public",
    "member",
    "inner-circle",
    "client",
    "legacy",
    "architect",
    "owner",
  ];
  const idx = order.indexOf(required);
  return idx === -1 ? order : order.slice(idx);
}

export function validateDocumentAccess(doc: unknown): {
  valid: boolean;
  requiredTier: AccessTier;
  issues?: string[];
} {
  const issues: string[] = [];
  try {
    const requiredTier = getRequiredTier(doc);

    // Basic sanity: requiredTier always resolves to a valid SSOT tier
    if (!requiredTier) issues.push("Required tier resolved empty");

    return {
      valid: issues.length === 0,
      requiredTier,
      issues: issues.length ? issues : undefined,
    };
  } catch (error) {
    return {
      valid: false,
      requiredTier: "public",
      issues: [`Validation error: ${String(error)}`],
    };
  }
}

export const AccessEngine = {
  getRequiredTier,
  canAccessDoc,
  isPublic,
  requiresAuth,
  getAccessibleTiers,
  validateDocumentAccess,
};

export default AccessEngine;