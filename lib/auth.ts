// lib/auth.ts — SINGLE SOURCE OF TRUTH (JWT + Session) — ENTERPRISE SSOT
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  getTierLabel,
  getTierLevel,
  requiredTierFromDoc,
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

type MemberResult = {
  id: string;
  status: string | null;
  tier: string | null;     // DB AccessTier enum comes back as string
  flags: string | null;
  emailHash: string | null;
  email?: string | null;
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

/**
 * Compute access flags from tier and internal status
 */
function computeAccess(tier: AccessTier, isInternal: boolean) {
  const innerCircleAccess = hasAccess(tier, "inner-circle");
  const allowPrivate = isInternal || hasAccess(tier, "architect");
  return { innerCircleAccess, allowPrivate };
}

/**
 * Normalize member tier using SSOT
 */
function normalizeMemberTier(dbTier: string | null, flags: string[]): AccessTier {
  if (hasInternalFlag(flags)) return "owner";
  return normalizeUserTier(dbTier);
}

/**
 * Decide whether a string role should escalate to owner.
 * This is ONLY for legacy “role” values that might show up in tokens.
 */
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

  const member = await safePrismaQuery<MemberResult | null>(() =>
    prisma.innerCircleMember.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { emailHash: hashedEmail },
          { emailHash: normalizedEmail }, // Directorate master-key support (if used)
        ],
      },
      select: {
        id: true,
        status: true,
        tier: true,
        flags: true,
        emailHash: true,
        email: true,
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

  // Internal flags are the ONLY internal override at this layer
  const isInternal = hasInternalFlag(flags);

  const tier: AccessTier = normalizeMemberTier(member.tier, flags);
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
            role: "owner", // SSOT tier
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
      // Stabilize token identity
      if (user) {
        (token as any).id = (user as any).id;
        (token as any).role = (user as any).role || "public";
        token.email = (user as any).email || token.email;
      }

      const role = String((token as any).role || "public").trim();
      const email = typeof token.email === "string" ? token.email : undefined;

      // DB-backed claims (SSOT)
      const resolved = await resolveAoLClaimsByEmail(email);

      // Escalation rules:
      // - if role maps to owner via SSOT alias map
      // - or role tier >= architect (legacy)
      // - or resolved says internal/owner already
      const roleTier = normalizeUserTier(role);
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
        : resolved;

      // Hard guarantee: never undefined
      (token as any).aol = aol;

      // Keep normalized tier stable across app (legacy compatibility)
      (token as any).id = String((token as any).id || token.sub || "");
      (token as any).role = aol.tier;
      (token as any).tierLevel = TIER_HIERARCHY[aol.tier];

      return token;
    },

    async session({ session, token }) {
      const aol = ((token as any).aol as AoLClaims | undefined) ?? BASE_CLAIMS;

      if (session.user) {
        (session.user as any).id = String((token as any).id || "");
        (session.user as any).tier = aol.tier;
        (session.user as any).tierLabel = getTierLabel(aol.tier);
        (session.user as any).tierLevel = TIER_HIERARCHY[aol.tier];
        (session.user as any).role = aol.tier; // backward compatibility
        (session.user as any).flags = aol.flags ?? [];
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

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUserTier(): Promise<AccessTier> {
  const session = await getAuthSession();
  return ((session as any)?.aol?.tier as AccessTier) || "public";
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

export function resolveTierFromSessionLike(session: any): AccessTier {
  const rawTier =
    session?.user?.tier ??
    session?.user?.role ??
    session?.tier ??
    session?.role ??
    "public";

  const flags: string[] = Array.isArray(session?.user?.flags)
    ? session.user.flags.map(String)
    : Array.isArray(session?.flags)
    ? session.flags.map(String)
    : [];

  // Internal markers => owner
  const INTERNAL_MARKERS = new Set(["admin", "internal", "staff", "director", "root", "superadmin", "private_access"]);
  if (flags.some((f) => INTERNAL_MARKERS.has(String(f).toLowerCase()))) return "owner";

  return normalizeUserTier(rawTier);
}

export function isOwnerOrArchitect(session: any): boolean {
  const tier = resolveTierFromSessionLike(session);
  return hasAccess(tier, "architect");
}

export default authOptions;