export const PUBLIC_TIER_ORDER = [
  "public",
  "member",
  "inner_circle",
  "restricted",
  "client",
  "legacy",
  "architect",
  "owner",
  "top_secret",
] as const;

export type AccessTier = (typeof PUBLIC_TIER_ORDER)[number];

const PUBLIC_TIER_HIERARCHY: Record<AccessTier, number> = {
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

const TIER_ALIASES: Record<string, AccessTier> = {
  public: "public",
  open: "public",
  free: "public",
  guest: "public",
  unclassified: "public",
  member: "member",
  members: "member",
  basic: "member",
  standard: "member",
  "inner-circle": "inner_circle",
  innercircle: "inner_circle",
  inner_circle: "inner_circle",
  ic: "inner_circle",
  premium: "inner_circle",
  verified: "inner_circle",
  "verified-member": "inner_circle",
  restricted: "restricted",
  classified: "restricted",
  confidential: "restricted",
  sensitive: "restricted",
  client: "client",
  plus: "client",
  paid: "client",
  private: "client",
  legacy: "legacy",
  elite: "legacy",
  secret: "legacy",
  architect: "architect",
  founder: "architect",
  partner: "architect",
  owner: "owner",
  admin: "owner",
  root: "owner",
  sovereign: "owner",
  "top-secret": "top_secret",
  "top secret": "top_secret",
  top_secret: "top_secret",
  topsecret: "top_secret",
  ts: "top_secret",
};

function toKey(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]/g, "_");
}

function isAccessTier(value: string): value is AccessTier {
  return (PUBLIC_TIER_ORDER as readonly string[]).includes(value);
}

export function normalizeUserTier(input?: unknown): AccessTier {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return "public";
  if (TIER_ALIASES[raw]) return TIER_ALIASES[raw];

  const transformed = toKey(raw);
  return isAccessTier(transformed) ? transformed : "public";
}

export function normalizeRequiredTier(input?: unknown): AccessTier {
  return normalizeUserTier(input);
}

export function hasAccess(userTier: unknown, requiredTier: unknown): boolean {
  const user = normalizeUserTier(userTier);
  const required = normalizeRequiredTier(requiredTier);
  return PUBLIC_TIER_HIERARCHY[user] >= PUBLIC_TIER_HIERARCHY[required];
}

export function getTierLabel(tier: unknown): string {
  return TIER_LABELS[normalizeRequiredTier(tier)] || "Public";
}
