// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from "crypto";

import type { AoLTier } from "@/types/next-auth";
import { safePrismaQuery } from "@/lib/prisma"; // <- from the lazy Prisma module I gave you earlier

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

  // IMPORTANT:
  // - This MUST be build-safe.
  // - If Prisma is unavailable (build/edge/misconfig), safePrismaQuery returns null.
  const member = await safePrismaQuery((prisma) =>
    prisma.innerCircleMember.findUnique({
      where: { emailHash },
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
    const flags = member?.flags ? safeParseFlags(member.flags) : [];
    return {
      tier: "public" as AoLTier,
      innerCircleAccess: false,
      isInternal: false,
      allowPrivate: false,
      memberId: member?.id ?? null,
      emailHash,
      flags,
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
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Vault Credentials",
      credentials: {
        email: { label: "Identity", type: "email", placeholder: "advisory@firm.com" },
        password: { label: "Passkey", type: "password" },
      },

      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        const ADMIN_EMAIL = process.env.ADMIN_USER_EMAIL?.trim().toLowerCase();
        const ADMIN_PASS = process.env.ADMIN_USER_PASSWORD ?? "";

        const adminEnvReady = Boolean(ADMIN_EMAIL && ADMIN_PASS && process.env.NEXTAUTH_SECRET);

        if (adminEnvReady && email === ADMIN_EMAIL && password === ADMIN_PASS) {
          return {
            id: "system-admin",
            email: ADMIN_EMAIL!,
            name: "Vault Administrator",
            role: "admin",
          };
        }

        // Tight posture: deny member password login
        return null;
      },
    }),
  ],

  theme: {
    colorScheme: "dark",
    brandColor: "#d4af37",
    logo: "/assets/images/logo.png",
  },

  pages: {
    signIn: "/inner-circle/admin/login",
    error: "/inner-circle/error",
  },

  callbacks: {
    async jwt({ token, user, session }) {
      // 1) identity core
      if (user) {
        token.id = (user as any).id;
        token.email = (user as any).email;
        token.name = (user as any).name;
        token.picture = (user as any).image;
        token.role = (user as any).role || "user";
      }

      // 2) claims
      const email =
        (token?.email as string | undefined) ||
        ((session as any)?.user?.email as string | undefined) ||
        ((user as any)?.email as string | undefined);

      const aol = await resolveAoLClaimsByEmail(email ?? null);

      if ((token as any).role === "admin") {
        (token as any).aol = {
          tier: "private",
          innerCircleAccess: true,
          isInternal: true,
          allowPrivate: true,
          memberId: aol.memberId ?? null,
          emailHash: aol.emailHash ?? (email ? sha256Hex(email.trim().toLowerCase()) : null),
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
        (session.user as any).email = token.email as string;
        (session.user as any).role = (token as any).role as string;
      }

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

  debug: process.env.NODE_ENV === "development",
};