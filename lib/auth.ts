import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import type { AoLTier } from "@/types/next-auth";
import { safePrismaQuery, prisma } from "@/lib/prisma";
import { 
  sha256Hex, 
  safeParseFlags, 
  mapMemberTierToAoLTier, 
  hasInternalFlag 
} from "@/lib/auth-utils";

/**
 * CLAIMS RESOLVER: The "Handshake" between DB and JWT
 * Synchronizes the identity against the Neon PostgreSQL registry.
 */
async function resolveAoLClaimsByEmail(email?: string | null) {
  const baseClaims = {
    tier: "public" as AoLTier,
    innerCircleAccess: false,
    isInternal: false,
    allowPrivate: false,
    memberId: null as string | null,
    emailHash: null as string | null,
    flags: [] as string[],
  };

  if (!email) return baseClaims;

  const normalizedEmail = email.trim().toLowerCase();
  const hashedEmail = sha256Hex(normalizedEmail);

  // High-integrity query using the proxy-safe prisma instance
  const member = await safePrismaQuery(() =>
    prisma.innerCircleMember.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { emailHash: hashedEmail },
          { emailHash: normalizedEmail } // Support for Directorate Master Keys
        ],
      },
      select: {
        id: true,
        status: true,
        tier: true,
        flags: true,
        emailHash: true,
      },
    })
  );

  if (!member || member.status !== "active") {
    return { ...baseClaims, emailHash: hashedEmail, memberId: member?.id ?? null };
  }

  const flags = safeParseFlags(member.flags);
  
  // Escalation Logic: Directors or specific flags grant Private Clearance
  const isInternal = hasInternalFlag(flags) || member.tier === "Director";
  const tier = isInternal ? "private" : mapMemberTierToAoLTier(member.tier, flags);

  return {
    tier,
    innerCircleAccess: true,
    isInternal,
    allowPrivate: isInternal,
    memberId: member.id,
    emailHash: member.emailHash,
    flags,
  };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Vault Credentials",
      credentials: {
        email: { label: "Identity", type: "email" },
        password: { label: "Passkey", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        const ADMIN_EMAIL = process.env.ADMIN_USER_EMAIL?.trim().toLowerCase();
        const ADMIN_PASS = process.env.ADMIN_USER_PASSWORD ?? "";

        // Admin environment check (Vault Administrator)
        if (ADMIN_EMAIL && email === ADMIN_EMAIL && password === ADMIN_PASS) {
          return {
            id: "system-admin",
            email: ADMIN_EMAIL,
            name: "Vault Administrator",
            role: "admin",
          };
        }
        // Members typically enter via the AccessGate/Proxy route
        return null;
      },
    }),
  ],
  theme: { colorScheme: "dark", brandColor: "#d4af37" },
  pages: {
    signIn: "/inner-circle/admin/login",
    error: "/inner-circle/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role || "user";
      }

      const email = token?.email as string | undefined;
      const aol = await resolveAoLClaimsByEmail(email ?? null);

      // System Admin Escalation (Hard-coded for the root environment user)
      if ((token as any).role === "admin") {
        (token as any).aol = {
          tier: "private",
          innerCircleAccess: true,
          isInternal: true,
          allowPrivate: true,
          memberId: aol.memberId ?? "admin-root",
          emailHash: aol.emailHash ?? (email ? sha256Hex(email) : null),
          flags: Array.from(new Set([...(aol.flags ?? []), "admin", "internal"])),
        };
      } else {
        (token as any).aol = aol;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = (token as any).role as string;
      }
      (session as any).aol = (token as any).aol;
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};