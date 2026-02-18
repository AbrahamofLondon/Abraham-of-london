// lib/auth.ts — SINGLE SOURCE OF TRUTH (JWT + Session) — HARD GUARANTEES
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";

import type { AoLTier } from "@/types/next-auth";
import { safePrismaQuery, prisma } from "@/lib/prisma";
import {
  sha256Hex,
  safeParseFlags,
  mapMemberTierToAoLTier,
  hasInternalFlag,
} from "@/lib/auth-utils";

/* ============================================================================
   Types
============================================================================ */
type AoLClaims = {
  tier: AoLTier;
  innerCircleAccess: boolean;
  isInternal: boolean;
  allowPrivate: boolean;
  memberId: string | null;
  emailHash: string | null;
  flags: string[];
};

type MemberResult = {
  id: string;
  status: string | null;
  tier: string | null;
  flags: string | null;
  emailHash: string | null;
};

/* ============================================================================
   Base Claims (NEVER undefined)
============================================================================ */
const BASE_CLAIMS: AoLClaims = {
  tier: "public" as AoLTier,
  innerCircleAccess: false,
  isInternal: false,
  allowPrivate: false,
  memberId: null,
  emailHash: null,
  flags: [],
};

function computeAccess(tier: AoLTier, isInternal: boolean) {
  // Treat anything not public/free as having inner-circle access
  const innerCircleAccess =
    tier !== ("public" as AoLTier) && tier !== ("free" as AoLTier);

  const allowPrivate =
    isInternal ||
    tier === ("private" as AoLTier) ||
    tier === ("architect" as AoLTier);

  return { innerCircleAccess, allowPrivate };
}

/* ============================================================================
   Claims Resolver
============================================================================ */
async function resolveAoLClaimsByEmail(email?: string | null): Promise<AoLClaims> {
  if (!email) return BASE_CLAIMS;

  const normalizedEmail = email.trim().toLowerCase();
  const hashedEmail = sha256Hex(normalizedEmail);

  const member = await safePrismaQuery<MemberResult | null>(() =>
    prisma.innerCircleMember.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { emailHash: hashedEmail },
          { emailHash: normalizedEmail }, // Directorate Master Keys support
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

  if (!member) {
    return { ...BASE_CLAIMS, emailHash: hashedEmail };
  }

  const isActive = member.status === "active";
  if (!isActive) {
    return { ...BASE_CLAIMS, emailHash: hashedEmail, memberId: member.id };
  }

  const flags = safeParseFlags(member.flags);

  const isInternal = hasInternalFlag(flags) || member.tier === "Director";

  const tier: AoLTier = isInternal
    ? ("private" as AoLTier)
    : (mapMemberTierToAoLTier(member.tier, flags) as AoLTier);

  const { innerCircleAccess, allowPrivate } = computeAccess(tier, isInternal);

  return {
    tier,
    innerCircleAccess,
    isInternal,
    allowPrivate,
    memberId: member.id,
    emailHash: member.emailHash || hashedEmail,
    flags,
  };
}

/* ============================================================================
   NextAuth Options
============================================================================ */
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

        if (ADMIN_EMAIL && email === ADMIN_EMAIL && password === ADMIN_PASS) {
          return {
            id: "system-admin",
            email: ADMIN_EMAIL,
            name: "Vault Administrator",
            role: "admin",
          };
        }

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
      // Ensure these exist deterministically
      if (user) {
        (token as any).id = (user as any).id;
        (token as any).role = (user as any).role || "user";
        token.email = (user as any).email || token.email;
      }

      const role = String((token as any).role || "user");
      const email = typeof token.email === "string" ? token.email : undefined;

      const resolved = await resolveAoLClaimsByEmail(email);

      // Admin escalation
      const aol: AoLClaims =
        role === "admin"
          ? {
              tier: "private" as AoLTier,
              innerCircleAccess: true,
              isInternal: true,
              allowPrivate: true,
              memberId: resolved.memberId ?? "admin-root",
              emailHash: resolved.emailHash ?? (email ? sha256Hex(email) : null),
              flags: Array.from(
                new Set([...(resolved.flags ?? []), "admin", "internal"])
              ),
            }
          : resolved;

      // ✅ HARD GUARANTEE: token.aol is NEVER undefined
      (token as any).aol = aol;

      // Also keep id/role stable
      (token as any).id = String((token as any).id || token.sub || "");
      (token as any).role = role;

      return token;
    },

    async session({ session, token }) {
      // Ensure required session.user fields (per your Session augmentation)
      if (session.user) {
        (session.user as any).id = String((token as any).id || "");
        (session.user as any).role = String((token as any).role || "user");
      }

      // ✅ HARD GUARANTEE: session.aol is NEVER undefined
      const aol = ((token as any).aol as AoLClaims | undefined) ?? BASE_CLAIMS;
      (session as any).aol = aol;

      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
};

/* ============================================================================
   Server Session Helper
============================================================================ */
/**
 * Get the current auth session on the server
 * @returns The session or null if not authenticated
 */
export async function getAuthSession() {
  return getServerSession(authOptions);
}

export default authOptions;