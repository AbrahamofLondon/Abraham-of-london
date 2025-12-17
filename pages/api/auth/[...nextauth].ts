import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * THE SECURITY AUTHORITY - NextAuth Configuration
 * Hardened for administrative access and session integrity.
 */
export const authOptions: NextAuthOptions = {
  // Use JWT strategy for stateless performance in static-leaning environments
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Encryption Authority - REQUIRED in production
  secret: process.env.NEXTAUTH_SECRET,

  // Callbacks: Synchronizes identity across the JWT lifecycle
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as any).role || "user"; // Prepared for RBAC
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).email = token.email as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },

  // Security Hardening: Fail-closed in production
  debug: process.env.NODE_ENV === "development",

  // Visual Authority: Synchronized with the Kingdom Vault brand
  theme: {
    colorScheme: "dark",
    brandColor: "#d4af37", // Official Gold Hex
    logo: "/assets/images/logo.png", // Ensure absolute path for reliability
  },

  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Vault Credentials",
      credentials: {
        email: { label: "Identity", type: "email", placeholder: "advisory@firm.com" },
        password: { label: "Passkey", type: "password" }
      },
      async authorize(credentials) {
        /**
         * PRODUCTION AUTHORITY LOGIC:
         * For the current architecture, we use a single Admin account 
         * managed via environment variables to prevent database complexity.
         */
        const ADMIN_EMAIL = process.env.ADMIN_USER_EMAIL;
        const ADMIN_PASS = process.env.ADMIN_USER_PASSWORD;

        if (
          credentials?.email === ADMIN_EMAIL && 
          credentials?.password === ADMIN_PASS &&
          ADMIN_EMAIL && ADMIN_PASS // Fail-closed if ENV is missing
        ) {
          return {
            id: "system-admin",
            email: ADMIN_EMAIL,
            name: "Vault Administrator",
            role: "admin",
          };
        }

        // Return null strictly on failure - prevents unauthorized entry
        return null;
      }
    }),
  ],

  pages: {
    signIn: "/inner-circle/admin/login", // Custom high-end login page
    error: "/inner-circle/error",
  },
};

export default NextAuth(authOptions);