/* ============================================================================
   FILE: lib/access/tier-policy.ts — V7.1 (DATABASE ALIGNED)
   STATUS: Canonical relationship ladder for Abraham of London
============================================================================ */

export const TIER_ORDER = [
  "public",
  "member",
  "inner_circle", // Synchronized with Prisma
  "restricted",
  "client",
  "legacy",
  "architect",
  "owner",
  "top_secret", // Synchronized with Prisma
] as const;

export type AccessTier = (typeof TIER_ORDER)[number];

export const TIER_HIERARCHY: Record<AccessTier, number> = {
  public: 0,
  member: 1,
  inner_circle: 2,
  restricted: 3,
  client: 4,
  legacy: 5,
  architect: 6,
  owner: 7,
  top_secret: 8,
};

export const TIER_LABELS: Record<AccessTier, string> = {
  public: "Public",
  member: "Member",
  inner_circle: "Inner Circle",
  restricted: "Restricted",
  client: "Client",
  legacy: "Legacy",
  architect: "Architect",
  owner: "Owner",
  top_secret: "Top Secret",
};

/**
 * Aliases: Mapping hyphenated, legacy, or loose strings 
 * to the canonical Database Enum keys.
 */
export const TIER_ALIASES: Record<string, AccessTier> = {
  // public
  public: "public",
  open: "public",
  free: "public",
  guest: "public",
  unclassified: "public",

  // member
  member: "member",
  members: "member",
  basic: "member",
  standard: "member",

  // inner-circle -> inner_circle
  "inner-circle": "inner_circle",
  innercircle: "inner_circle",
  inner_circle: "inner_circle",
  ic: "inner_circle",
  premium: "inner_circle",
  verified: "inner_circle",
  "verified-member": "inner_circle",

  // restricted
  restricted: "restricted",
  classified: "restricted",
  confidential: "restricted",
  sensitive: "restricted",

  // client
  client: "client",
  plus: "client",
  paid: "client",
  private: "client",

  // legacy
  legacy: "legacy",
  elite: "legacy",
  secret: "legacy",

  // architect
  architect: "architect",
  founder: "architect",
  partner: "architect",

  // owner
  owner: "owner",
  admin: "owner",
  root: "owner",
  sovereign: "owner",

  // top-secret -> top_secret
  "top-secret": "top_secret",
  "top secret": "top_secret",
  "top_secret": "top_secret",
  topsecret: "top_secret",
  ts: "top_secret",
};

type TierDocLike = {
  accessLevelSafe?: unknown;
  accessLevel?: unknown;
  tier?: unknown;
  requiresAuth?: unknown;
  classification?: unknown;
  clearance?: unknown;
};

/**
 * Normalizes input to a lowercase string, replacing hyphens and spaces 
 * with underscores to match canonical TIER_ORDER.
 */
export function toKey(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]/g, '_');
}

export function isAccessTier(x: string): x is AccessTier {
  return (TIER_ORDER as readonly string[]).includes(x);
}

/**
 * The primary engine for resolving strings/objects into valid AccessTiers.
 */
export function normalizeUserTier(input?: unknown): AccessTier {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return "public";

  // 1. Direct match in aliases (handles 'verified-member' etc.)
  if (TIER_ALIASES[raw]) return TIER_ALIASES[raw];

  // 2. Transformed match (handles 'inner-circle' -> 'inner_circle')
  const transformed = toKey(raw);
  if (isAccessTier(transformed)) return transformed;

  // 3. Fallback
  return "public";
}

export function getTierLabel(tier: unknown): string {
  const normalized = normalizeRequiredTier(tier);
  return TIER_LABELS[normalized] || "Public";
}

/**
 * Extraction logic for MDX Frontmatter or DB metadata
 */
export function requiredTierFromDoc(doc: TierDocLike): AccessTier {
  if (!doc) return "public";

  const rawTier = doc.accessLevelSafe || doc.accessLevel || doc.tier || doc.classification || doc.clearance;
  
  if (rawTier) return normalizeRequiredTier(rawTier);

  // Default to member if explicitly marked as requiring auth but no tier provided
  if (doc.requiresAuth === true) return "member";

  return "public";
}

export function normalizeRequiredTier(input?: unknown): AccessTier {
  return normalizeUserTier(input);
}

/**
 * Core clearance check: Is the user's rank >= the requirement?
 */
export function hasAccess(userTier: unknown, requiredTier: unknown): boolean {
  const u = normalizeUserTier(userTier);
  const r = normalizeRequiredTier(requiredTier);
  return TIER_HIERARCHY[u] >= TIER_HIERARCHY[r];
}

/**
 * Path-based auto-classification for the file system / Vault
 */
export function requiredTierFromVaultPath(vaultPath: string): AccessTier {
  const p = String(vaultPath || "").replace(/\\/g, "/").toLowerCase();

  if (p.includes("/top-secret/") || p.includes("/top_secret/")) return "top_secret";
  if (p.includes("/owner/")) return "owner";
  if (p.includes("/architect/")) return "architect";
  if (p.includes("/legacy/")) return "legacy";
  if (p.includes("/client/")) return "client";
  if (p.includes("/restricted/")) return "restricted";
  if (p.includes("/inner-circle/") || p.includes("/inner_circle/")) return "inner_circle";
  if (p.includes("/member/")) return "member";

  return "member";
}