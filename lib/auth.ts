/* lib/auth.ts — SINGLE SOURCE OF TRUTH (JWT + Session) — ENTERPRISE SSOT */
import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  getTierLabel,
} from "@/lib/access/tier-policy";

import { prisma, safePrismaQuery } from "@/lib/prisma";
import { sha256Hex, safeParseFlags, hasInternalFlag } from "@/lib/auth-utils";
import { AoLClaims } from "@/types/auth";

/* ============================================================================
   Base Claims (NEVER undefined)
============================================================================ */
const BASE_CLAIMS: AoLClaims = {
  tier: "public",
  innerCircleAccess: false,
  isInternal: false,
  allowPrivate: false,
  memberId: null,
  emailHash: null,
  flags: [],
};

function computeAccess(tier: AccessTier, isInternal: boolean) {
  const innerCircleAccess = hasAccess(tier, "inner-circle");
  const allowPrivate = isInternal || hasAccess(tier, "architect");
  return { innerCircleAccess, allowPrivate };
}

function normalizeMemberTier(dbTier: unknown, flags: string[]): AccessTier {
  if (hasInternalFlag(flags)) return "owner";
  return normalizeUserTier(dbTier as any);
}

function roleMapsToOwner(role: string): boolean {
  const k = String(role || "").trim().toLowerCase();
  return k === "owner" || k === "admin" || k === "architect";
}

/* ============================================================================
   Claims Resolver (DB-backed)
============================================================================ */
async function resolveAoLClaimsByEmail(email?: string | null): Promise<AoLClaims> {
  if (!email) return BASE_CLAIMS;
  const normalizedEmail = email.trim().toLowerCase();
  const hashedEmail = sha256Hex(normalizedEmail);

  const member = await safePrismaQuery(
    "resolveAoLClaimsByEmail",
    () =>
      prisma.innerCircleMember.findFirst({
        where: {
          OR: [{ email: normalizedEmail }, { emailHash: hashedEmail }],
        },
      }),
    null,
  );

  if (!member) return { ...BASE_CLAIMS, emailHash: hashedEmail };

  const isActive = String(member.status || "").toLowerCase() === "active";
  if (!isActive) return { ...BASE_CLAIMS, emailHash: hashedEmail, memberId: member.id };

  const flags = safeParseFlags((member as any)?.flags);
  const isInternal = hasInternalFlag(flags);
  const tier: AccessTier = normalizeMemberTier(member.tier, flags);
  const { innerCircleAccess, allowPrivate } = computeAccess(tier, isInternal);

  return {
    tier,
    innerCircleAccess,
    isInternal,
    allowPrivate,
    memberId: member.id,
    emailHash: (member as any).emailHash || hashedEmail,
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
            role: "owner",
            tier: "owner"
          } as User;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "public";
        token.tier = (user as any).tier || "public";
      }

      const email = token.email;
      const resolved = await resolveAoLClaimsByEmail(email);
      const role = String(token.role || "public");

      // Elevation Logic
      const shouldElevate = roleMapsToOwner(role) || resolved.isInternal || resolved.tier === "owner";

      const aol: AoLClaims = shouldElevate
        ? {
            tier: "owner",
            innerCircleAccess: true,
            isInternal: true,
            allowPrivate: true,
            memberId: resolved.memberId ?? "admin-root",
            emailHash: resolved.emailHash ?? (email ? sha256Hex(email) : null),
            flags: Array.from(new Set([...(resolved.flags ?? []), "admin", "internal"])),
          }
        : resolved;

      token.aol = aol;
      token.tier = aol.tier;
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.aol) {
        const aol = token.aol as AoLClaims;
        session.user.id = String(token.id || "");
        session.user.tier = aol.tier;
        session.aol = aol;
      }
      return session;
    },
  },
};

/**
 * Server Session Helper
 */
export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export default authOptions;