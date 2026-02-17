// types/next-auth.ts
// Institutional NextAuth type extensions + AoLTier export

import "next-auth";

/**
 * 🎖️ Abraham of London – Clearance Tiers
 * Extends the built‑in NextAuth User and Session types
 */
declare module "next-auth" {
  interface User {
    /** Access level / clearance tier */
    tier?: AoLTier;
    /** Optional: whether the user is an administrator */
    isAdmin?: boolean;
    /** User's role */
    role?: string;
  }

  interface Session {
    user?: User;
    /** AOL claims - institutional access metadata */
    aol?: {
      tier: AoLTier;
      innerCircleAccess: boolean;
      isInternal: boolean;
      allowPrivate: boolean;
      memberId?: string | null;
      emailHash?: string | null;
      flags?: string[];
    };
  }
  
  interface JWT {
    id?: string;
    role?: string;
    aol?: Session['aol'];
  }
}

/**
 * 📋 Institutional tier hierarchy
 * Used across access gates, API middleware, and content filters
 */
export type AoLTier =
  | "public"
  | "member"
  | "inner-circle"
  | "architect"
  | "free"
  | "premium"
  | "private";