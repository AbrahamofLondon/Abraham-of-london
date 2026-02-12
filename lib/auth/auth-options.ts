/* lib/auth/auth-options.ts */
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 4 * 60 * 60, // 4-hour high-security window
  },
  providers: [
    CredentialsProvider({
      name: "AoL Institutional Access",
      credentials: {
        email: { label: "Principal Email", type: "email" },
        accessKey: { label: "Institutional Key", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.accessKey) return null;

        const member = await prisma.innerCircleMember.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { keys: true },
        });

        if (!member || member.status !== "active") {
          throw new Error("Access Denied: Account non-existent or suspended.");
        }

        // Find the active institutional key
        const activeKey = member.keys.find(k => k.status === "active");
        if (!activeKey) throw new Error("No active institutional key found.");

        // Verify the 256-bit hashed key
        const isValid = await bcrypt.compare(credentials.accessKey, activeKey.keyHash);
        
        if (!isValid) {
          await prisma.systemAuditLog.create({
            data: {
              action: "AUTH_FAILURE",
              severity: "HIGH",
              actorEmail: credentials.email,
              metadata: JSON.stringify({ reason: "Invalid Access Key" })
            }
          });
          return null;
        }

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          tier: member.tier,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const member = await prisma.innerCircleMember.findUnique({
          where: { id: user.id },
        });

        token.id = user.id;
        token.role = user.role;
        token.aol = {
          tier: (member?.tier as any) || "public",
          innerCircleAccess: ["inner-circle", "inner-circle-plus", "inner-circle-elite", "private"].includes(member?.tier || ""),
          isInternal: member?.role === "ADMIN" || member?.role === "PRINCIPAL",
          allowPrivate: member?.tier === "private",
          memberId: member?.id || null,
          emailHash: member?.emailHash || null,
          flags: member?.flags ? JSON.parse(member.flags) : [],
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.aol = token.aol;
      }
      return session;
    },
  },
};