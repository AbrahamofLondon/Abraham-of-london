// lib/auth/tiers.ts — CANONICAL TIER MODEL (auth-migration/02-tier-model.md)
//
// This is the SINGLE SOURCE OF TRUTH for the tier hierarchy.
// Every enforcement point (middleware, server guards, pages, APIs,
// client helpers) must import from here. Do not declare a parallel
// hierarchy anywhere else.

export type Tier =
  | "public"
  | "member"
  | "inner_circle"
  | "client"
  | "architect"
  | "owner";

export const TIER_ORDER: Record<Tier, number> = {
  public: 0,
  member: 1,
  inner_circle: 2,
  client: 3,
  architect: 4,
  owner: 5,
} as const;

/**
 * Canonical access check. A subject satisfies a required tier when
 * their resolved tier level >= the required tier level.
 */
export function hasAccess(subjectTier: Tier, requiredTier: Tier): boolean {
  return (TIER_ORDER[subjectTier] ?? 0) >= (TIER_ORDER[requiredTier] ?? 999);
}

/**
 * Normalize any string to a canonical Tier. Handles legacy aliases,
 * hyphenated variants, and case variations. Returns "public" for
 * unrecognized input.
 */
export function normalizeTier(input: unknown): Tier {
  if (!input || typeof input !== "string") return "public";

  const key = input.trim().toLowerCase().replace(/-/g, "_");

  // Direct match
  if (key in TIER_ORDER) return key as Tier;

  // Legacy / alias mapping
  const ALIASES: Record<string, Tier> = {
    // public aliases
    free: "public",
    anonymous: "public",
    guest: "public",
    viewer: "public",

    // member aliases
    registered: "member",
    basic: "member",
    patron: "member",

    // inner_circle aliases
    inner_circle: "inner_circle",
    innercircle: "inner_circle",
    premium: "inner_circle",
    ic: "inner_circle",

    // client aliases
    consulting: "client",
    enterprise: "client",
    restricted: "client", // retired tier → maps to client

    // architect aliases
    founder: "architect",
    legacy: "architect", // retired tier → maps to architect
    editor: "architect",
    admin: "architect",
    superadmin: "architect",

    // owner aliases
    sovereign: "owner",
    top_secret: "owner", // retired tier → maps to owner
    operator: "owner",
    system: "owner",
  };

  return ALIASES[key] ?? "public";
}

/**
 * Compare two tiers. Returns positive if a > b, negative if a < b, 0 if equal.
 */
export function compareTiers(a: Tier, b: Tier): number {
  return (TIER_ORDER[a] ?? 0) - (TIER_ORDER[b] ?? 0);
}

/**
 * Return the higher of two tiers.
 */
export function maxTier(a: Tier, b: Tier): Tier {
  return compareTiers(a, b) >= 0 ? a : b;
}
