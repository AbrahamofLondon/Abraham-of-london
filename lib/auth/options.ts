import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma.server";
import { BOOTSTRAP_ADMIN_EMAILS } from "@/lib/access/admin-emails";
import { getUserAccess } from "@/lib/access/get-user-access";

export const authOptions: NextAuthOptions = {
  // keep your existing providers here
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase().trim();
      if (!email) return true;

      if (BOOTSTRAP_ADMIN_EMAILS.has(email)) {
        await prisma.user.upsert({
          where: { email },
          create: {
            email,
            name: user.name ?? null,
            role: email === "info@abrahamoflondon.org" ? "OWNER" : "ADMIN",
          },
          update: {
            role: email === "info@abrahamoflondon.org" ? "OWNER" : "ADMIN",
          },
        });
      }

      return true;
    },

    async jwt({ token }) {
      if (!token.email) return token;

      const email = token.email.toLowerCase().trim();
      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true },
      });

      if (dbUser) {
        token.sub = dbUser.id;
        token.role = dbUser.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (!session.user) return session;

      session.user.id = typeof token.sub === "string" ? token.sub : "";
      session.user.role = typeof token.role === "string" ? token.role : "USER";

      const access = await getUserAccess(
        prisma,
        typeof token.sub === "string" ? token.sub : null,
      );

      session.user.accessTier = access.tier;
      session.user.entitlements = access.entitlements;

      return session;
    },
  },
};