// lib/access/tiers.ts — SSOT WRAPPER (policy + vault path policy)

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
} from "@/lib/access/tier-policy";

export { requiredTierFromVaultPath } from "@/lib/access/vault-policy";

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