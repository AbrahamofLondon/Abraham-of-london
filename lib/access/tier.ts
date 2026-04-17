/**
 * Tier hierarchy — canonical ranking and comparison.
 *
 * This is the ONLY place tier order is defined.
 * Every tier check flows through hasTier() or maxTier().
 */

import type { AccessTier } from "./types";

const TIER_RANK: Record<AccessTier, number> = {
  public: 0,
  member: 1,
  "inner-circle": 2,
  architect: 3,
  owner: 4,
};

const ALL_TIERS: AccessTier[] = ["public", "member", "inner-circle", "architect", "owner"];

/**
 * Does `userTier` meet or exceed `requiredTier`?
 */
export function hasTier(userTier: AccessTier, requiredTier: AccessTier): boolean {
  return (TIER_RANK[userTier] ?? 0) >= (TIER_RANK[requiredTier] ?? 0);
}

/**
 * Return the highest tier from a list of tier keys.
 * Returns "public" if the list is empty.
 */
export function maxTier(tiers: AccessTier[]): AccessTier {
  if (tiers.length === 0) return "public";

  let best: AccessTier = "public";
  let bestRank = 0;

  for (const t of tiers) {
    const rank = TIER_RANK[t] ?? 0;
    if (rank > bestRank) {
      best = t;
      bestRank = rank;
    }
  }

  return best;
}

/**
 * Normalize a loose tier string to a canonical AccessTier.
 * Handles common aliases and formatting differences.
 */
export function normalizeTier(input: string | null | undefined): AccessTier {
  if (!input) return "public";
  const s = input.trim().toLowerCase().replace(/_/g, "-");

  // Exact match
  if (s in TIER_RANK) return s as AccessTier;

  // Aliases
  const aliases: Record<string, AccessTier> = {
    "inner_circle": "inner-circle",
    "innercircle": "inner-circle",
    "ic": "inner-circle",
    "restricted": "inner-circle",
    "client": "inner-circle",
    "legacy": "architect",
    "admin": "architect",
    "top-secret": "owner",
    "top_secret": "owner",
  };

  return aliases[s] ?? "public";
}

/**
 * All defined tiers in ascending order.
 */
export function allTiers(): readonly AccessTier[] {
  return ALL_TIERS;
}
