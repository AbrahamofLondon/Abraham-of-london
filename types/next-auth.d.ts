// types/next-auth.d.ts
import type { DefaultSession, DefaultUser } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

// -----------------------------------------------------------------------------
// AoL Access Claims (canonical)
// -----------------------------------------------------------------------------
export type AoLTier =
  | "public"
  | "inner-circle"
  | "inner-circle-plus"
  | "inner-circle-elite"
  | "private";

export interface AoLAccessClaims {
  aol: {
    tier: AoLTier;
    innerCircleAccess: boolean;
    isInternal: boolean;
    allowPrivate: boolean;

    // Correlation keys (safe for audit, avoid raw identifiers if you can)
    memberId?: string | null;
    emailHash?: string | null;

    // Optional meta
    flags?: string[];
  };
}

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider`.
   */
  interface Session extends AoLAccessClaims {
    user: {
      /** The user's unique identifier. */
      id: string;
      /** The user's email address. */
      email: string;
      /** The user's full name. */
      name?: string | null;
      /** The user's profile image URL. */
      image?: string | null;
    } & DefaultSession["user"];
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `credentials` authorization callback.
   */
  interface User extends DefaultUser {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  /**
   * JWT payload returned by the `jwt` callback and `getToken`, when using JWT sessions.
   */
  interface JWT extends DefaultJWT, Partial<AoLAccessClaims> {
    id: string;
    email: string;
    name?: string;
    image?: string;
  }
}