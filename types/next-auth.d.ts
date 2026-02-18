// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";
import type { AoLTier } from "@/types/next-auth";

type AoLClaims = {
  tier: AoLTier;
  innerCircleAccess: boolean;
  isInternal: boolean;
  allowPrivate: boolean;
  memberId: string | null;
  emailHash: string | null;
  flags: string[];
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
    aol: AoLClaims;
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: string;
    aol?: AoLClaims;
  }
}