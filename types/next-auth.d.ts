import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extends the built-in session.user and session objects
   */
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
    aol: {
      tier: "public" | "inner-circle" | "inner-circle-plus" | "inner-circle-elite" | "private";
      innerCircleAccess: boolean;
      isInternal: boolean;
      allowPrivate: boolean;
      memberId: string | null;
      emailHash: string | null;
      flags: string[];
    };
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extends the built-in JWT with institutional claims
   */
  interface JWT {
    id: string;
    role: string;
    aol: {
      tier: "public" | "inner-circle" | "inner-circle-plus" | "inner-circle-elite" | "private";
      innerCircleAccess: boolean;
      isInternal: boolean;
      allowPrivate: boolean;
      memberId: string | null;
      emailHash: string | null;
      flags: string[];
    };
  }
}