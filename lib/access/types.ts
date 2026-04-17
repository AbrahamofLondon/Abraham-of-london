export type AccessTier =
  | "public"
  | "member"
  | "inner-circle"
  | "architect"
  | "owner";

export type EntitlementGrant =
  | { type: "tier"; key: AccessTier }
  | { type: "product"; key: string }
  | { type: "artifact"; key: string };

export type EffectiveAccess = {
  userId: string | null;
  role: "USER" | "ADMIN" | "OWNER" | null;
  tier: AccessTier;
  entitlements: {
    tiers: AccessTier[];
    products: string[];
    artifacts: string[];
  };
  permissions: {
    isAuthenticated: boolean;
    isAdmin: boolean;
    isOwner: boolean;
  };
};