// lib/auth.ts — SINGLE SOURCE OF TRUTH (JWT + Session) — ENTERPRISE SSOT
import type { NextAuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";
import { JWT } from "next-auth/jwt";

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  getTierLabel,
  TIER_HIERARCHY,
  TIER_ALIASES,
} from "@/lib/access/tier-policy";

import { prisma, safePrismaQuery } from "@/lib/prisma";
import { sha256Hex, safeParseFlags, hasInternalFlag } from "@/lib/auth-utils";

/* ============================================================================
   Types (SSOT Aligned)
============================================================================ */

export type AoLClaims = {
  tier: AccessTier;
  innerCircleAccess: boolean;
  isInternal: boolean;
  allowPrivate: boolean;
  memberId: string | null;
  emailHash: string | null;
  flags: string[];
};

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
  if (!k) return false;
  return TIER_ALIASES[k] === "owner" || k === "owner";
}

/* ============================================================================
   Claims Resolver (DB-backed)
============================================================================ */

async function resolveAoLClaimsByEmail(email?: string | null): Promise<AoLClaims> {
  if (!email) return BASE_CLAIMS;

  const normalizedEmail = email.trim().toLowerCase();
  const hashedEmail = sha256Hex(normalizedEmail);

  const member = await safePrismaQuery(() =>
    prisma.innerCircleMember.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { emailHash: hashedEmail }, { emailHash: normalizedEmail }],
      },
      select: {
        id: true,
        status: true,
        tier: true,
        emailHash: true,
        email: true,
      },
    }),
  );

  if (!member) {
    return { ...BASE_CLAIMS, emailHash: hashedEmail };
  }

  const isActive = String(member.status || "").toLowerCase() === "active";
  if (!isActive) {
    return { ...BASE_CLAIMS, emailHash: hashedEmail, memberId: member.id };
  }

  const flags = safeParseFlags((member as any)?.flags);
  const isInternal = hasInternalFlag(flags);
  const tier: AccessTier = normalizeMemberTier((member as any).tier, flags);
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
          } as User;
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
      /**
       * SYSTEM BYPASS: 
       * Next-Auth's 'user' object in the JWT callback defaults to a union
       * that excludes custom properties. We cast to 'any' here specifically
       * to extract the institutional role during the initial sign-in event.
       */
      if (user) {
        const u = user as any;
        token.id = u.id;
        token.role = u.role || "public";
        token.email = u.email || token.email;
      }

      // 1. Resolve institutional context
      const role = String(token.role || "public").trim();
      const email = typeof token.email === "string" ? token.email : undefined;

      const resolved = await resolveAoLClaimsByEmail(email);
      const roleTier = normalizeUserTier(role);

      // 2. Elevation Logic
      const shouldElevateToOwner =
        roleMapsToOwner(role) ||
        hasAccess(roleTier, "architect") ||
        resolved.isInternal ||
        resolved.tier === "owner";

      const aol: AoLClaims = shouldElevateToOwner
        ? {
            tier: "owner",
            innerCircleAccess: true,
            isInternal: true,
            allowPrivate: true,
            memberId: resolved.memberId ?? "admin-root",
            emailHash: resolved.emailHash ?? (email ? sha256Hex(email) : null),
            flags: Array.from(new Set([...(resolved.flags ?? []), "admin", "internal"])),
          }
        : (resolved as AoLClaims);

      // 3. Update Token with local interface bypass
      (token as any).aol = aol;
      token.id = String(token.id || token.sub || "");
      token.role = aol.tier;

      return token;
    },

    async session({ session, token }) {
      // Use cast to bypass the 'Session' interface restriction in production
      const t = token as any;
      const aol = (t.aol as AoLClaims) ?? BASE_CLAIMS;

      if (session.user) {
        const sUser = session.user as any;
        sUser.id = String(t.id || "");
        sUser.role = aol.tier;
        sUser.tier = aol.tier;
        sUser.tierLabel = getTierLabel(aol.tier);
        sUser.flags = aol.flags ?? [];
      }

      (session as any).aol = aol;
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
};

/* ============================================================================
   Server Session Helpers (SSOT)
============================================================================ */

/**
 * Retrieves the session from the server context.
 * Casts to any to ensure 'aol' claims are accessible in the production runner.
 */
export async function getAuthSession() {
  return await getServerSession(authOptions) as any;
}

export async function getCurrentUserTier(): Promise<AccessTier> {
  const session = await getAuthSession();
  // Safe access via any-cast from getAuthSession
  return session?.aol?.tier || "public";
}

export async function getCurrentUserTierLevel(): Promise<number> {
  const tier = await getCurrentUserTier();
  return TIER_HIERARCHY[tier];
}

export async function currentUserHasAccess(requiredTier: AccessTier | string): Promise<boolean> {
  const userTier = await getCurrentUserTier();
  const required = normalizeRequiredTier(requiredTier);
  return hasAccess(userTier, required);
}

/**
 * Resolves a tier from various session-like objects.
 * Hardened against the missing 'aol' property in strict environments.
 */
export function resolveTierFromSessionLike(session: any): AccessTier {
  const rawTier = 
    session?.aol?.tier ?? 
    session?.user?.tier ?? 
    session?.user?.role ?? 
    session?.role ?? 
    "public";

  const flags: string[] = session?.aol?.flags ?? session?.user?.flags ?? [];

  const INTERNAL_MARKERS = new Set([
    "admin", "internal", "staff", "director", "root", "superadmin", "private_access"
  ]);

  if (flags.some((f) => INTERNAL_MARKERS.has(String(f).toLowerCase()))) {
    return "owner";
  }

  return normalizeUserTier(rawTier);
}

export function isOwnerOrArchitect(session: any): boolean {
  const tier = resolveTierFromSessionLike(session);
  return hasAccess(tier, "architect");
}

export default authOptions;