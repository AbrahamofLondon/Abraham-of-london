import { DefaultSession, DefaultUser } from "next-auth";
import type { AccessTier } from "@/lib/access/tier-policy";
import type { AoLClaims } from "@/types/auth";

declare module "next-auth" {
  /**
   * Extends the built-in User item
   */
  interface User extends DefaultUser {
    id: string;
    role?: string;
    tier?: AccessTier;
    aol?: AoLClaims;
    isInternal?: boolean;
  }

  /**
   * Extends the built-in Session
   *
   * The `innerCircle` field is populated only when the session is resolved
   * through `getUnifiedSession()` (lib/auth/session-helpers.ts). Raw
   * NextAuth sessions do not carry it.
   */
  interface Session {
    id?: string;
    tier?: AccessTier;
    aol?: AoLClaims;
    user: {
      id: string;
      role?: string;
      tier?: AccessTier;
      aol?: AoLClaims;
      isInternal?: boolean;
    } & DefaultSession["user"];
    innerCircle?: {
      hasValidToken: boolean;
      tier: AccessTier;
      expiresAt: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    tier?: AccessTier;
    aol?: AoLClaims;
    isInternal?: boolean;
  }
}

export {};
