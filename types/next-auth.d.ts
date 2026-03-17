// types/next-auth.d.ts
import type { DefaultSession, DefaultUser } from "next-auth";
import type { AccessTier } from "@/lib/access/tier-policy";
import type { AoLClaims } from "@/types/auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    id?: string;
    role?: string;
    tier?: AccessTier;
    aol?: AoLClaims;
  }

  interface Session {
    id?: string;
    tier?: AccessTier;
    aol?: AoLClaims;
    user?: DefaultSession["user"] & {
      id?: string;
      role?: string;
      tier?: AccessTier;
    };
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