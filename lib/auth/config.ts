// lib/auth/config.ts — CANONICAL NextAuth configuration (SSOT)
//
// This file replaces the three formerly-competing auth configs:
//   - lib/auth.ts                      → re-export shim
//   - lib/auth/options.ts              → re-export shim
//   - pages/api/auth/[...nextauth].ts  → thin handler that imports from here
//
// Architecture: Option 3 Hybrid
//   NextAuth owns IDENTITY    (who you are — email, role, tier in DB)
//   AL token owns ENTITLEMENT (what you can access — Inner Circle vault)
//   Both must be valid for premium pages.

import type { NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession } from "next-auth/next";

import { prisma, safePrismaQuery } from "@/lib/prisma";
import { logger } from "@/lib/logging";
import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";
import type { AoLClaims } from "@/types/auth";
import { sha256Hex, safeParseFlags, hasInternalFlag } from "@/lib/auth-utils";

// ============================================================================
// LOCAL TYPE SHAPES (global augmentation lives in types/next-auth.d.ts)
// ============================================================================

type SessionUserExtended = NonNullable<Session["user"]> & {
  id?: string;
  role?: string;
  tier?: AccessTier;
  aol?: AoLClaims;
};

type SessionExtended = Session & {
  id?: string;
  tier?: AccessTier;
  aol?: AoLClaims;
  user?: SessionUserExtended;
};

type JWTWithClaims = JWT & {
  id?: string;
  role?: string;
  tier?: AccessTier;
  aol?: AoLClaims;
  isInternal?: boolean;
};

type AuthUser = User & {
  id?: string;
  role?: string;
  tier?: AccessTier;
  aol?: AoLClaims;
};

// ============================================================================
// BASE CLAIMS + RESOLVERS (folded from lib/auth.ts)
// ============================================================================

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
  const innerCircleAccess = hasAccess(tier, "inner_circle");
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
  if (!isActive) {
    return { ...BASE_CLAIMS, emailHash: hashedEmail, memberId: member.id };
  }

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

// ============================================================================
// CANONICAL authOptions
// ============================================================================

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),

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
            tier: "owner",
          } as User;
        }
        return null;
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days — matches Inner Circle token lifetime
    updateAge: 24 * 60 * 60,
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",

  pages: {
    signIn: "/admin/login",
    error: "/admin/error",
    verifyRequest: "/admin/verify",
    newUser: "/admin/welcome",
  },

  callbacks: {
    async jwt({ token, user }) {
      const nextToken = token as JWTWithClaims;

      if (user) {
        const authUser = user as AuthUser;
        nextToken.id =
          typeof authUser.id === "string" ? authUser.id : nextToken.id;
        nextToken.role =
          typeof authUser.role === "string" ? authUser.role : "public";
        nextToken.tier = normalizeUserTier(
          authUser.tier ?? authUser.role ?? "public",
        );
      }

      // Resolve claims from the DB for every token pass, so tier/flag
      // changes propagate without requiring the member to re-authenticate.
      const email = nextToken.email;
      const resolved = await resolveAoLClaimsByEmail(email);
      const role = String(nextToken.role ?? "public");

      // Role → tier elevation (folded from lib/auth.ts)
      const shouldElevate =
        roleMapsToOwner(role) || resolved.isInternal || resolved.tier === "owner";

      const aol: AoLClaims = shouldElevate
        ? {
            tier: "owner",
            innerCircleAccess: true,
            isInternal: true,
            allowPrivate: true,
            memberId: resolved.memberId ?? "admin-root",
            emailHash:
              resolved.emailHash ?? (email ? sha256Hex(email) : null),
            flags: Array.from(
              new Set([...(resolved.flags ?? []), "admin", "internal"]),
            ),
          }
        : resolved;

      nextToken.aol = aol;
      nextToken.tier = aol.tier;
      nextToken.isInternal = aol.isInternal;
      return nextToken;
    },

    async session({ session, token }) {
      const nextSession = session as SessionExtended;
      const jwt = token as JWTWithClaims;

      const role = typeof jwt.role === "string" ? jwt.role : "public";
      const tier = normalizeUserTier(jwt.tier ?? jwt.aol?.tier ?? role);

      nextSession.id = typeof jwt.id === "string" ? jwt.id : undefined;
      nextSession.tier = tier;

      if (!nextSession.user) {
        nextSession.user = {} as SessionUserExtended;
      }

      nextSession.user.id = typeof jwt.id === "string" ? jwt.id : "";
      nextSession.user.role = role;
      nextSession.user.tier = tier;
      nextSession.user.aol = jwt.aol ? { ...jwt.aol, tier } : BASE_CLAIMS;

      // Back-compat: preserve session.aol for existing callers
      nextSession.aol = jwt.aol ? { ...jwt.aol, tier } : BASE_CLAIMS;

      return nextSession;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // ignore malformed callback URL
      }
      return baseUrl;
    },
  },

  events: {
    async signIn(message) {
      logger.info("[AUTH] User signed in", {
        userId: message.user?.id ?? null,
        email: message.user?.email ?? null,
        provider: message.account?.provider ?? null,
      });
    },
    async signOut(message) {
      const payload = message as {
        token?: JWTWithClaims;
        session?: SessionExtended;
      };
      logger.info("[AUTH] User signed out", {
        userId:
          payload.token?.id ?? payload.session?.user?.id ?? null,
        email: payload.session?.user?.email ?? null,
      });
    },
  },
};

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export default authOptions;
