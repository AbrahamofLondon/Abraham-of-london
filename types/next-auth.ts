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
  }

  interface Session {
    user?: User;
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