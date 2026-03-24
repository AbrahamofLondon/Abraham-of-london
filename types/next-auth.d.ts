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
  }

  /**
   * Extends the built-in Session
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
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    tier?: AccessTier;
    aol?: AoLClaims;
  }
}

export {};