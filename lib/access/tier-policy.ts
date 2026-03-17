// lib/access/tier-policy.ts — SINGLE POLICY TABLE (SSOT)
// Canonical relationship ladder for Abraham of London

export const TIER_ORDER = [
  "public",
  "member",
  "inner-circle",
  "restricted",
  "client",
  "legacy",
  "architect",
  "owner",
  "top-secret",
] as const;

export type AccessTier = (typeof TIER_ORDER)[number];

export const TIER_HIERARCHY: Record<AccessTier, number> = {
  public: 0,
  member: 1,
  "inner-circle": 2,
  restricted: 3,
  client: 4,
  legacy: 5,
  architect: 6,
  owner: 7,
  "top-secret": 8,
};

export const TIER_LABELS: Record<AccessTier, string> = {
  public: "Public",
  member: "Member",
  "inner-circle": "Inner Circle",
  restricted: "Restricted",
  client: "Client",
  legacy: "Legacy",
  architect: "Architect",
  owner: "Owner",
  "top-secret": "Top Secret",
};

/**
 * ONE alias map to rule them all.
 * - keys MUST be lowercase
 * - values MUST be AccessTier
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

  // inner-circle
  "inner-circle": "inner-circle",
  innercircle: "inner-circle",
  inner_circle: "inner-circle",
  ic: "inner-circle",
  premium: "inner-circle",
  verified: "inner-circle",
  verification: "inner-circle",
  "verified-member": "inner-circle",

  // restricted
  restricted: "restricted",
  classified: "restricted",
  confidential: "restricted",
  sensitive: "restricted",
  "need-to-know": "restricted",
  compartmentalized: "restricted",

  // client
  client: "client",
  "inner-circle-plus": "client",
  "inner-circle-pro": "client",
  plus: "client",
  paid: "client",
  private: "client",

  // legacy
  legacy: "legacy",
  elite: "legacy",
  enterprise: "legacy",
  secret: "legacy",
  "inner-circle-elite": "legacy",

  // architect
  architect: "architect",
  founder: "architect",
  partner: "architect",
  director: "architect",
  editor: "architect",

  // owner
  owner: "owner",
  admin: "owner",
  root: "owner",
  superadmin: "owner",
  sovereign: "owner",
  hardened: "owner",

  // top-secret
  "top-secret": "top-secret",
  "top secret": "top-secret",
  "top_secret": "top-secret",
  topsecret: "top-secret",
  tops: "top-secret",
  tsc: "top-secret",
  ts: "top-secret",
};

type TierDocLike = {
  accessLevelSafe?: unknown;
  accessLevel?: unknown;
  tier?: unknown;
  requiresAuth?: unknown;
  classification?: unknown;
  clearance?: unknown;
};

function assertNoDuplicateAliasKeys(): void {
  if (process.env.NODE_ENV === "production") return;
}

assertNoDuplicateAliasKeys();

export function toKey(input: unknown): string {
  return String(input ?? "").trim().toLowerCase();
}

export function isAccessTier(x: string): x is AccessTier {
  return (TIER_ORDER as readonly string[]).includes(x);
}

export function getTierLevel(tier: unknown): number {
  const normalized = normalizeRequiredTier(tier);
  return TIER_HIERARCHY[normalized];
}

export function normalizeUserTier(input?: unknown): AccessTier {
  const key = toKey(input);
  if (!key) return "public";

  const mapped = TIER_ALIASES[key];
  if (mapped) return mapped;

  if (isAccessTier(key)) return key;

  console.warn(`[TIER][USER] Unknown tier "${String(input)}" -> "public"`);
  return "public";
}

export function normalizeRequiredTier(input?: unknown): AccessTier {
  const key = toKey(input);
  if (!key) return "public";

  const mapped = TIER_ALIASES[key];
  if (mapped) return mapped;

  if (isAccessTier(key)) return key;

  console.warn(`[TIER][REQUIRED] Unknown tier "${String(input)}" -> "public"`);
  return "public";
}

export function hasAccess(userTier: unknown, requiredTier: unknown): boolean {
  const u = normalizeUserTier(userTier);
  const r = normalizeRequiredTier(requiredTier);
  return TIER_HIERARCHY[u] >= TIER_HIERARCHY[r];
}

export function getTierLabel(tier: unknown): string {
  return TIER_LABELS[normalizeRequiredTier(tier)];
}

export function requiredTierFromDoc(doc: TierDocLike | null | undefined): AccessTier {
  if (!doc) return "public";

  const accessLevel = doc.accessLevelSafe ?? doc.accessLevel ?? "";
  if (accessLevel) {
    const a = normalizeRequiredTier(accessLevel);
    if (a === "public") return "public";
    return a;
  }

  if (doc.tier) return normalizeRequiredTier(doc.tier);

  if (doc.requiresAuth === true) {
    const hinted =
      doc.tier ?? doc.accessLevel ?? doc.classification ?? doc.clearance;
    return hinted ? normalizeRequiredTier(hinted) : "client";
  }

  if (doc.classification) {
    const c = normalizeRequiredTier(doc.classification);
    if (c !== "public") return c;
  }

  if (doc.clearance) {
    const c = normalizeRequiredTier(doc.clearance);
    if (c !== "public") return c;
  }

  return "public";
}

export function requiredTierFromVaultPath(vaultPath: string): AccessTier {
  const p = String(vaultPath || "").replace(/\\/g, "/").toLowerCase();

  if (p.includes("/top-secret/")) return "top-secret";
  if (p.includes("/owner/")) return "owner";
  if (p.includes("/architect/")) return "architect";
  if (p.includes("/legacy/")) return "legacy";
  if (p.includes("/client/")) return "client";
  if (p.includes("/restricted/")) return "restricted";
  if (p.includes("/inner-circle/")) return "inner-circle";
  if (p.includes("/member/")) return "member";
  if (p.includes("/public-teasers/")) return "public";

  return "member";
}