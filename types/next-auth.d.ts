// types/next-auth.d.ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
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
  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
  
  /**
   * JSON Web Token payload
   */
  interface JWT {
    id: string;
    email: string;
    name?: string;
    image?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Returned by the `jwt` callback and `getToken`, when using JWT sessions
   */
  interface JWT {
    id: string;
    email: string;
    name?: string;
    image?: string;
  }
}