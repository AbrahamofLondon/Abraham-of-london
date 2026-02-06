/* lib/auth/auth-options.ts */
import { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import { verifyInstitutionalKey } from "@/lib/auth/key-service";

export const authOptions: NextAuthOptions = {
  // ... providers (as previously defined)
  callbacks: {
    async jwt({ token, user }) {
      // 1. Initial Sign-In: Populate the AoL Claims
      if (user) {
        const member = await prisma.innerCircleMember.findUnique({
          where: { id: user.id },
        });

        token.id = user.id;
        token.role = user.role;
        
        // Mapping Tier to your AoLTier type
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
      // 2. Transmitting Claims to the Client-Side Session
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.aol = token.aol;
      }
      return session;
    },
  },
};