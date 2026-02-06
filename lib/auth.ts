import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from "crypto";

import type { AoLTier } from "@/types/next-auth";
import { safePrismaQuery } from "@/lib/prisma"; 

/**
 * UTILITY: Deterministic Identity Hashing
 */
function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * UTILITY: Flag Sanitization
 */
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
  const internalMarkers = ["internal", "staff", "private_access", "admin"];
  return flags.some(flag => internalMarkers.includes(flag));
}

/**
 * TIER MAPPING: Translates Neon PostgreSQL tiers to AoL Logic
 */
function mapMemberTierToAoLTier(dbTier: string, flags: string[]): AoLTier {
  if (hasInternalFlag(flags)) return "private";

  const t = (dbTier || "").toLowerCase();
  if (t.includes("elite") || t.includes("enterprise")) return "inner-circle-elite";
  if (t.includes("plus") || t.includes("premium")) return "inner-circle-plus";
  
  // Default active member status
  return "inner-circle";
}

/**
 * CLAIMS RESOLVER: The "Handshake" between DB and JWT
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
  // We check both the SHA256 version and the plain text version 
  // to support the Directorate Master Keys we just generated.
  const hashedEmail = sha256Hex(normalizedEmail);

  const member = await safePrismaQuery((prisma) =>
    prisma.innerCircleMember.findFirst({
      where: { 
        OR: [
          { email: normalizedEmail },
          { emailHash: hashedEmail },
          { emailHash: normalizedEmail } // Alignment with our Key-Gen script
        ]
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
  
  // LOGIC UPGRADE: If tier is "Director" (from our script), treat as Internal/Private
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

        // Admin environment check
        if (ADMIN_EMAIL && email === ADMIN_EMAIL && password === ADMIN_PASS) {
          return {
            id: "system-admin",
            email: ADMIN_EMAIL,
            name: "Vault Administrator",
            role: "admin",
          };
        }
        return null; // Strict posture: members login via keys/other routes
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

      // Admin escalation
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
        (session.user as any).role = (token as any).role as string;
      }
      (session as any).aol = (token as any).aol;
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};