// pages/api/auth/[...nextauth].ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from "crypto";

import { prisma } from "@/lib/server/prisma";
import type { AoLTier } from "@/types/next-auth"; // if you exported it there; otherwise duplicate the union locally

// =============================================================================
// Abraham of London — Security Authority
// NextAuth Configuration (JWT Strategy)
// - Canon-grade: institutional discipline + clear trust boundaries
// - McKinsey-touch: separation of concerns, explicit controls, auditability
// =============================================================================

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function safeParseFlags(flagsJson?: string | null): string[] {
  if (!flagsJson) return [];
  try {
    const v = JSON.parse(flagsJson);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function hasInternalFlag(flags: string[]): boolean {
  return (
    flags.includes("internal") ||
    flags.includes("staff") ||
    flags.includes("private_access") ||
    flags.includes("admin")
  );
}

// Map your InnerCircleMember.tier -> AoL tier ladder
function mapMemberTierToAoLTier(dbTier: string, flags: string[]): AoLTier {
  if (hasInternalFlag(flags)) return "private";

  const t = (dbTier || "").toLowerCase();
  if (t.includes("elite") || t.includes("enterprise")) return "inner-circle-elite";
  if (t.includes("plus") || t.includes("premium")) return "inner-circle-plus";
  if (t.includes("standard") || t.includes("basic")) return "inner-circle";

  // default: if a member exists + active, treat as inner-circle
  return "inner-circle";
}

async function resolveAoLClaimsByEmail(email?: string | null) {
  if (!email) {
    return {
      tier: "public" as AoLTier,
      innerCircleAccess: false,
      isInternal: false,
      allowPrivate: false,
      memberId: null as string | null,
      emailHash: null as string | null,
      flags: [] as string[],
    };
  }

  const emailHash = sha256Hex(email.trim().toLowerCase());

  const member = await prisma.innerCircleMember.findUnique({
    where: { emailHash },
    select: {
      id: true,
      status: true,
      tier: true,
      flags: true,
      emailHash: true,
    },
  });

  if (!member || member.status !== "active") {
    return {
      tier: "public" as AoLTier,
      innerCircleAccess: false,
      isInternal: false,
      allowPrivate: false,
      memberId: member?.id ?? null,
      emailHash,
      flags: member?.flags ? safeParseFlags(member.flags) : [],
    };
  }

  const flags = safeParseFlags(member.flags);
  const isInternal = hasInternalFlag(flags);
  const tier = mapMemberTierToAoLTier(member.tier, flags);

  return {
    tier,
    innerCircleAccess: true,
    isInternal,
    allowPrivate: isInternal, // hard gate: private requires internal/staff
    memberId: member.id,
    emailHash: member.emailHash,
    flags,
  };
}

/**
 * THE SECURITY AUTHORITY — NextAuth Configuration
 * Hardened for: administrative access, tiered membership gating, and session integrity.
 */
export const authOptions: NextAuthOptions = {
  // Stateless performance + clean server-trusted claims envelope
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Encryption Authority — REQUIRED in production
  secret: process.env.NEXTAUTH_SECRET,

  // Security posture: fail-closed when critical env is missing
  // (Credentials provider depends on these; if absent, no one gets in.)
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Vault Credentials",
      credentials: {
        email: { label: "Identity", type: "email", placeholder: "advisory@firm.com" },
        password: { label: "Passkey", type: "password" },
      },

      async authorize(credentials) {
        /**
         * PRODUCTION AUTHORITY LOGIC:
         * - Admin access is environment-driven (no DB complexity).
         * - Inner Circle membership access is DB-driven (hashed email).
         *
         * IMPORTANT:
         * - This authorize() is ONLY for the credentials provider.
         * - Your Inner Circle public/member sign-in flow can remain separate if you wish.
         */

        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";

        if (!email || !password) return null;

        const ADMIN_EMAIL = process.env.ADMIN_USER_EMAIL?.trim().toLowerCase();
        const ADMIN_PASS = process.env.ADMIN_USER_PASSWORD ?? "";

        // Fail-closed if env missing (admin route becomes inert)
        const adminEnvReady = Boolean(ADMIN_EMAIL && ADMIN_PASS && process.env.NEXTAUTH_SECRET);

        if (
          adminEnvReady &&
          email === ADMIN_EMAIL &&
          password === ADMIN_PASS
        ) {
          return {
            id: "system-admin",
            email: ADMIN_EMAIL!,
            name: "Vault Administrator",
            role: "admin",
          };
        }

        // Optional: Allow *member* login via credentials (only if you want it).
        // If you don't want password-based member login at all, keep returning null here.
        //
        // For now: deny (tightest security posture).
        return null;
      },
    }),
  ],

  // Visual Authority: aligned to your luxury + governance aesthetic
  theme: {
    colorScheme: "dark",
    brandColor: "#d4af37",
    logo: "/assets/images/logo.png",
  },

  // Pages (premium UX)
  pages: {
    signIn: "/inner-circle/admin/login",
    error: "/inner-circle/error",
  },

  // Callbacks: synchronize identity + AoL claims across the JWT/session lifecycle
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // ------------------------------------------------------------
      // 1) Identity core (stable)
      // ------------------------------------------------------------
      if (user) {
        token.id = (user as any).id;
        token.email = (user as any).email;
        token.name = (user as any).name;
        token.picture = (user as any).image;
        token.role = (user as any).role || "user"; // RBAC-ready
      }

      // ------------------------------------------------------------
      // 2) AoL Claims (authoritative, server-derived)
      // ------------------------------------------------------------
      // Always rebuild from email → DB.
      // This prevents stale client cookies or manual tampering.
      const email =
        (token?.email as string | undefined) ||
        ((session as any)?.user?.email as string | undefined) ||
        ((user as any)?.email as string | undefined);

      const aol = await resolveAoLClaimsByEmail(email ?? null);

      // Admin override: if role=admin, enforce internal/private.
      // This avoids needing the admin identity to exist in InnerCircleMember.
      if (token.role === "admin") {
        token.aol = {
          tier: "private",
          innerCircleAccess: true,
          isInternal: true,
          allowPrivate: true,
          memberId: aol.memberId ?? null,
          emailHash: aol.emailHash ?? (email ? sha256Hex(email.trim().toLowerCase()) : null),
          flags: Array.from(new Set([...(aol.flags ?? []), "admin", "internal"])),
        };
      } else {
        token.aol = aol;
      }

      // Optional: throttle DB lookups by only resolving on sign-in/update.
      // Commented out because "private tier" is high-stakes — correctness > micro-optimisation.
      // if (!user && trigger !== "update") return token;

      return token;
    },

    async session({ session, token }) {
      // ------------------------------------------------------------
      // Session payload = client-safe projection
      // ------------------------------------------------------------
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).email = token.email as string;
        (session.user as any).role = (token as any).role as string;
      }

      // Attach AoL access claims for client-side gating + UX
      (session as any).aol =
        (token as any).aol ?? {
          tier: "public",
          innerCircleAccess: false,
          isInternal: false,
          allowPrivate: false,
          memberId: null,
          emailHash: null,
          flags: [],
        };

      return session;
    },
  },

  // Security hardening: keep noisy logs off in production
  debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions);