import type { AccessTier } from "./types";

const TIER_RANK: Record<AccessTier, number> = {
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

const TIER_ALIASES: Record<string, AccessTier> = {
  public: "public",
  open: "public",
  free: "public",
  member: "member",
  members: "member",
  basic: "member",
  standard: "member",
  "inner-circle": "inner-circle",
  inner_circle: "inner-circle",
  innercircle: "inner-circle",
  ic: "inner-circle",
  premium: "inner-circle",
  restricted: "restricted",
  confidential: "restricted",
  sensitive: "restricted",
  client: "client",
  private: "client",
  paid: "client",
  legacy: "legacy",
  elite: "legacy",
  architect: "architect",
  admin: "architect",
  founder: "architect",
  owner: "owner",
  sovereign: "owner",
  root: "owner",
  "top-secret": "top-secret",
  top_secret: "top-secret",
  topsecret: "top-secret",
};

const ALL_TIERS: AccessTier[] = [
  "public",
  "member",
  "inner-circle",
  "restricted",
  "client",
  "legacy",
  "architect",
  "owner",
  "top-secret",
];

export function normalizeTier(input: string | null | undefined): AccessTier {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return "public";

  const direct = TIER_ALIASES[raw];
  if (direct) return direct;

  const normalized = raw.replace(/_/g, "-");
  return (ALL_TIERS as string[]).includes(normalized)
    ? (normalized as AccessTier)
    : "public";
}

export function hasTier(userTier: AccessTier, requiredTier: AccessTier): boolean {
  return (TIER_RANK[userTier] ?? 0) >= (TIER_RANK[requiredTier] ?? 0);
}

export function maxTier(tiers: Array<string | AccessTier>): AccessTier {
  let best: AccessTier = "public";
  let bestRank = 0;

  for (const candidate of tiers) {
    const tier = normalizeTier(candidate);
    const rank = TIER_RANK[tier] ?? 0;
    if (rank > bestRank) {
      best = tier;
      bestRank = rank;
    }
  }

  return best;
}

export function allTiers(): readonly AccessTier[] {
  return ALL_TIERS;
}
