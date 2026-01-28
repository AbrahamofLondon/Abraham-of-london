// lib/inner-circle/access.server.ts — SINGLE SOURCE OF TRUTH (SERVER ONLY)
import "server-only";

export type InnerCircleTier = "public" | "basic" | "premium" | "enterprise" | "restricted";

export type InnerCircleAccess = {
  ok: boolean;
  tier: InnerCircleTier;
  isAuthenticated: boolean;
  // For route guards:
  canAccessBasic: boolean;
  canAccessPremium: boolean;
  canAccessEnterprise: boolean;
  canAccessRestricted: boolean;
};

function envTier(): InnerCircleTier | null {
  const raw = (process.env.DEFAULT_ACCESS_TIER || "").toLowerCase().trim();
  if (!raw) return null;
  if (raw === "public" || raw === "basic" || raw === "premium" || raw === "enterprise" || raw === "restricted")
    return raw;
  return null;
}

function tierToFlags(tier: InnerCircleTier) {
  const rank: Record<InnerCircleTier, number> = {
    public: 0,
    basic: 1,
    premium: 2,
    enterprise: 3,
    restricted: 4,
  };
  const r = rank[tier];
  return {
    canAccessBasic: r >= 1,
    canAccessPremium: r >= 2,
    canAccessEnterprise: r >= 3,
    canAccessRestricted: r >= 4,
  };
}

/**
 * getInnerCircleAccess(session)
 * Works with NextAuth v4 session objects, but doesn't require them.
 * If you pass nothing, it returns "public".
 */
export async function getInnerCircleAccess(session?: any): Promise<InnerCircleAccess> {
  // If you want a quick “keep deploying” override:
  const forced = envTier();
  if (forced) {
    return {
      ok: true,
      tier: forced,
      isAuthenticated: Boolean(session),
      ...tierToFlags(forced),
    };
  }

  // Default behavior (safe):
  // - If authenticated and has a tier on session.user.tier, use it
  // - else "public"
  const tier =
    (session?.user?.tier as InnerCircleTier) ||
    (session?.user?.accessLevel as InnerCircleTier) ||
    "public";

  const normalized: InnerCircleTier =
    tier === "basic" || tier === "premium" || tier === "enterprise" || tier === "restricted" ? tier : "public";

  return {
    ok: true,
    tier: normalized,
    isAuthenticated: Boolean(session),
    ...tierToFlags(normalized),
  };
}