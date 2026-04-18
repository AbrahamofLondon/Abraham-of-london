import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma.server";
import { BOOTSTRAP_ADMIN_EMAILS } from "@/lib/access/admin-emails";
import { getUserAccess } from "@/lib/access/get-user-access";

function bootstrapRoleForEmail(email: string) {
  if (email === "info@abrahamoflondon.org") return "OWNER" as const;
  if (BOOTSTRAP_ADMIN_EMAILS.has(email)) return "ADMIN" as const;
  return null;
}

function buildProviders() {
  const providers = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    );
  }

  if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
    providers.push(
      GitHubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      }),
    );
  }

  if (process.env.ADMIN_USER_EMAIL && process.env.ADMIN_USER_PASSWORD) {
    providers.push(
      CredentialsProvider({
        id: "credentials",
        name: "Admin Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const email = credentials?.email?.trim().toLowerCase();
          const password = credentials?.password ?? "";
          const expectedEmail = process.env.ADMIN_USER_EMAIL?.trim().toLowerCase();
          const expectedPassword = process.env.ADMIN_USER_PASSWORD ?? "";

          if (!email || !password || !expectedEmail || !expectedPassword) {
            return null;
          }

          if (email !== expectedEmail || password !== expectedPassword) {
            return null;
          }

          return {
            id: `bootstrap:${email}`,
            email,
            name: "Administrative Access",
          };
        },
      }),
    );
  }

  return providers;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: buildProviders(),
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase().trim();
      if (!email) return false;

      const bootstrapRole = bootstrapRoleForEmail(email);

      await prisma.user.upsert({
        where: { email },
        create: {
          email,
          name: user.name ?? null,
          role: bootstrapRole ?? "USER",
        },
        update: {
          name: user.name ?? undefined,
          role: bootstrapRole ?? undefined,
        },
      });

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      const fallbackEmail =
        user?.email?.toLowerCase().trim() ??
        (typeof token.email === "string" ? token.email.toLowerCase().trim() : null);

      if (!fallbackEmail) {
        return token;
      }

      const bootstrapRole = bootstrapRoleForEmail(fallbackEmail);
      if (bootstrapRole) {
        await prisma.user.update({
          where: { email: fallbackEmail },
          data: { role: bootstrapRole },
        }).catch(() => undefined);
      }

      const dbUser = await prisma.user.findUnique({
        where: { email: fallbackEmail },
        select: { id: true, role: true },
      });

      if (dbUser) {
        token.sub = dbUser.id;
        token.role = dbUser.role;
      }

      if (trigger === "update" && session?.user) {
        token.role = session.user.role ?? token.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      session.user.id = typeof token.sub === "string" ? token.sub : "";
      session.user.role = typeof token.role === "string" ? token.role : "USER";

      const access = await getUserAccess(
        prisma,
        typeof token.sub === "string" ? token.sub : null,
      );

      session.user.accessTier = access.tier;
      session.user.entitlements = access.entitlements;
      session.user.access = access;

      return session;
    },
  },
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export default authOptions;
