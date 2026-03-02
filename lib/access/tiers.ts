// lib/access/tiers.ts — SSOT WRAPPER (import policy only)

export {
  TIER_ORDER,
  TIER_LABELS,
  TIER_ALIASES,
  type AccessTier,
  toKey,
  isAccessTier,
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  getTierLabel,
  requiredTierFromDoc,
  requiredTierFromVaultPath,
} from "@/lib/access/tier-policy";

import {
  TIER_ORDER,
  TIER_LABELS,
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  getTierLabel,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";

// Backward-compatible object API used across your app
export const tiers = {
  order: TIER_ORDER,
  labels: TIER_LABELS,
  normalizeUser: normalizeUserTier,
  normalizeRequired: normalizeRequiredTier,
  hasAccess,
  getLabel: getTierLabel,
  fromDoc: requiredTierFromDoc,
};

export default tiers;