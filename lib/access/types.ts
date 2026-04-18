export type AccessTier =
  | "public"
  | "member"
  | "inner-circle"
  | "restricted"
  | "client"
  | "legacy"
  | "architect"
  | "owner"
  | "top-secret";

export type AccessRole = "USER" | "ADMIN" | "OWNER";

export type EntitlementGrant =
  | { type: "tier"; key: AccessTier }
  | { type: "product"; key: string }
  | { type: "artifact"; key: string };

export type EffectiveAccess = {
  userId: string | null;
  email: string | null;
  role: AccessRole | null;
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
