/* lib/content/access.ts — SSOT Content Access Engine (Client-safe) */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeRequiredTier, normalizeUserTier, hasAccess, requiredTierFromDoc } from "@/lib/access/tier-policy";

/**
 * Get required tier for a doc (SSOT).
 */
export function getRequiredTier(doc: unknown): AccessTier {
  return requiredTierFromDoc(doc as any);
}

/**
 * Can userTier access doc? (SSOT)
 */
export function canAccessDoc(doc: unknown, userTier: unknown = "public"): boolean {
  const required = getRequiredTier(doc);
  const user = normalizeUserTier(userTier);
  return hasAccess(user, required);
}

/**
 * Convenience helpers
 */
export function isPublic(doc: unknown): boolean {
  return getRequiredTier(doc) === "public";
}

export function requiresAuth(doc: unknown): boolean {
  return getRequiredTier(doc) !== "public";
}

export function getAccessLevel(doc: unknown): {
  requiredTier: AccessTier;
  requiresAuth: boolean;
  requiresInnerCircle: boolean;
  requiresClient: boolean;
  requiresArchitect: boolean;
} {
  const requiredTier = getRequiredTier(doc);
  return {
    requiredTier,
    requiresAuth: requiredTier !== "public",
    requiresInnerCircle: hasAccess(requiredTier, "inner-circle"),
    requiresClient: hasAccess(requiredTier, "client"),
    requiresArchitect: hasAccess(requiredTier, "architect"),
  };
}

/**
 * Optional: normalize raw classification/tier strings if a caller needs it.
 */
export function normalizeTier(input: unknown): AccessTier {
  return normalizeRequiredTier(input);
}

export default {
  getRequiredTier,
  canAccessDoc,
  isPublic,
  requiresAuth,
  getAccessLevel,
  normalizeTier,
};