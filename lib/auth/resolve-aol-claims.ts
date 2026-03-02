// lib/auth/resolve-aol-claims.ts — SSOT Bridge (Legacy Imports Safe)
import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";
import { safeParseFlags, hasInternalFlag } from "@/lib/auth-utils";

/**
 * Legacy helper: map DB tier + flags -> SSOT AccessTier.
 */
export function mapMemberTierToAccessTier(dbTier: string | null, flagsRaw: unknown): AccessTier {
  const flags = safeParseFlags(flagsRaw as any);
  if (hasInternalFlag(flags)) return "owner";
  return normalizeUserTier(dbTier);
}

/**
 * Legacy resolver that callers might use for quick gating.
 */
export function canAccessTier(userTier: unknown, requiredTier: unknown): boolean {
  return hasAccess(normalizeUserTier(userTier), normalizeUserTier(requiredTier));
}