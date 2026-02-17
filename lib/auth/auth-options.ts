/* lib/auth/auth-options.ts */
import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

type AoLTier = "public" | "inner-circle" | "inner-circle-plus" | "inner-circle-elite" | "private";
type AoLRole = "ADMIN" | "PRINCIPAL" | "MEMBER" | string;

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  // ✅ REQUIRED in JWT mode (prevents “session exists but not recognized” weirdness)
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 4 * 60 * 60, // 4 hours
  },

  // ✅ OPTIONAL but recommended: always route sign-in here
  pages: {
    signIn: "/admin/login",
  },

  // ✅ Stop noisy warnings unless you explicitly want them
  debug: process.env.NODE_ENV !== "production" ? false : false,

  providers: [
    CredentialsProvider({
      name: "AoL Institutional Access",

      // ✅ Accept BOTH shapes: your login page uses "password"
      // but we also accept "accessKey" in case you keep older flows.
      credentials: {
        email: { label: "Principal Email", type: "email" },
        password: { label: "Institutional Key", type: "password" },
        accessKey: { label: "Institutional Key (legacy)", type: "password" },
      },

      async authorize(credentials) {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const suppliedKey =
          String(credentials?.password || "").trim() ||
          String(credentials?.accessKey || "").trim();

        // Hard fail with null (don’t throw — throwing can cause confusing NextAuth behavior)
        if (!email || !suppliedKey) return null;

        // Lookup member + active key
        const member = await prisma.innerCircleMember.findUnique({
          where: { email },
          include: { keys: true },
        });

        if (!member) return null;
        if (String(member.status || "").toLowerCase() !== "active") return null;

        const activeKey = (member.keys || []).find((k: any) => String(k.status).toLowerCase() === "active");
        if (!activeKey?.keyHash) return null;

        const valid = await bcrypt.compare(suppliedKey, String(activeKey.keyHash));
        if (!valid) {
          // ✅ audit trail, but never throw
          try {
            await prisma.systemAuditLog.create({
              data: {
                action: "AUTH_FAILURE",
                severity: "HIGH",
                actorEmail: email,
                metadata: JSON.stringify({ reason: "Invalid Access Key" }),
              },
            });
          } catch {
            // ignore audit failure
          }
          return null;
        }

        // ✅ Return the user object used to mint the JWT
        return {
          id: member.id,
          name: member.name || "Member",
          email: member.email,
          role: (member.role as AoLRole) || "MEMBER",
          tier: (member.tier as AoLTier) || "public",
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // ✅ On sign-in: hydrate token from DB (authoritative)
      if (user?.id) {
        const member = await prisma.innerCircleMember.findUnique({
          where: { id: String(user.id) },
          select: {
            id: true,
            tier: true,
            role: true,
            emailHash: true,
            flags: true,
            name: true,
            email: true,
          },
        });

        const tier = (member?.tier as AoLTier) || ("public" as AoLTier);
        const role = (member?.role as AoLRole) || ("MEMBER" as AoLRole);

        (token as any).id = member?.id || String(user.id);
        (token as any).role = role;

        (token as any).aol = {
          tier,
          innerCircleAccess: ["inner-circle", "inner-circle-plus", "inner-circle-elite", "private"].includes(tier),
          isInternal: role === "ADMIN" || role === "PRINCIPAL",
          allowPrivate: tier === "private",
          memberId: member?.id || null,
          emailHash: member?.emailHash || null,
          flags: safeJsonParse<any[]>(member?.flags, []),
        };
      }

      return token;
    },

    async session({ session, token }) {
      // ✅ Ensure session carries your custom claims
      if (session.user) {
        (session.user as any).id = (token as any).id as string;
        (session.user as any).role = (token as any).role as string;
      }
      (session as any).aol = (token as any).aol || {
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
};