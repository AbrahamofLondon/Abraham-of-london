/* lib/access/tiers.ts — SSOT WRAPPER (V1.2) */

// 1. Export the named functions for modern imports
export {
  TIER_ORDER,
  TIER_LABELS,
  TIER_ALIASES,
  type AccessTier,
  toKey,
  isAccessTier,
  normalizeUserTier,
  normalizeRequiredTier,
  normalizeRuntimeTier,
  hasAccess,
  getTierLabel,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";

export { requiredTierFromVaultPath } from "@/lib/access/vault-policy";

// 2. Import for the default object creation
import {
  TIER_ORDER,
  TIER_LABELS,
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  getTierLabel,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";

// 3. Backward-compatible object API (Crucial for fixing the 100+ flagged files)
export const tiers = {
  order: TIER_ORDER,
  labels: TIER_LABELS,
  // These specific mappings fix the "Property does not exist" errors
  normalizeUser: normalizeUserTier,
  normalizeRequired: normalizeRequiredTier,
  hasAccess: hasAccess,
  getLabel: getTierLabel,
  fromDoc: requiredTierFromDoc,
};

// Satisfies: import tiers from "@/lib/access/tiers"
export default tiers;