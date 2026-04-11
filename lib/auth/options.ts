// lib/auth/options.ts — MAIN AUTH CONFIGURATION (SSOT)
import crypto from "crypto";
import type { NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logging";
import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier } from "@/lib/access/tier-policy";
import type { AoLClaims } from "@/types/auth";
import { verifyPassword } from "@/lib/auth/password";

type SessionUserExtended = NonNullable<Session["user"]> & {
  id?: string;
  role?: string;
  tier?: AccessTier;
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
};

type AuthUser = User & {
  id?: string;
  role?: string;
  tier?: AccessTier;
  aol?: AoLClaims;
};

function buildAoLClaims(input: {
  tier: unknown;
  memberId?: unknown;
  emailHash?: unknown;
  flags?: unknown;
  isInternal?: unknown;
  allowPrivate?: unknown;
  sessionId?: unknown;
}): AoLClaims {
  const tier = normalizeUserTier(input.tier);
  const flags = Array.isArray(input.flags) ? input.flags.map(String) : [];

  return {
    tier,
    innerCircleAccess: tier !== "public",
    isInternal: Boolean(input.isInternal),
    allowPrivate: Boolean(input.allowPrivate),
    memberId: typeof input.memberId === "string" ? input.memberId : null,
    emailHash: typeof input.emailHash === "string" ? input.emailHash : null,
    flags,
    sessionId: typeof input.sessionId === "string" ? input.sessionId : undefined,
  };
}

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
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials, _req): Promise<User | null> {
        try {
          const email =
            typeof credentials?.email === "string" ? credentials.email.trim() : "";
          const password =
            typeof credentials?.password === "string" ? credentials.password : "";

          if (!email || !password) {
            logger.warn("[AUTH] Missing credentials");
            return null;
          }

          const user = await prisma.innerCircleMember.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              passwordHash: true,
              tier: true,
              role: true,
              emailHash: true,
              flags: true,
            },
          });

          if (!user || !user.passwordHash) {
            logger.warn("[AUTH] User not found or no password hash", { email });
            return null;
          }

          const isValid = await verifyPassword(password, user.passwordHash);

          if (!isValid) {
            logger.warn("[AUTH] Invalid password", { email });
            return null;
          }

          const sessionId = crypto.randomUUID();

          const parsedFlags =
            typeof user.flags === "string"
              ? user.flags
                  .split(",")
                  .map((flag) => flag.trim())
                  .filter(Boolean)
              : [];

          const aolClaims = buildAoLClaims({
            tier: user.tier ?? user.role ?? "member",
            memberId: user.id,
            emailHash: user.emailHash,
            flags: parsedFlags,
            isInternal: true,
            allowPrivate: true,
            sessionId,
          });

          logger.info("[AUTH] Credentials login successful", {
            userId: user.id,
            email: user.email,
          });

          const authUser: AuthUser = {
            id: user.id,
            email: user.email ?? email,
            name: user.name ?? "User",
            role: String(user.role ?? "member"),
            tier: normalizeUserTier(user.tier ?? "member"),
            aol: aolClaims,
          };

          return authUser;
        } catch (error) {
          logger.error("[AUTH] Credentials authorization error", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const nextToken = token as JWTWithClaims;

      if (user) {
        const authUser = user as AuthUser;
        const role = typeof authUser.role === "string" ? authUser.role : "user";
        const tier = normalizeUserTier(authUser.tier ?? authUser.aol?.tier ?? role);

        nextToken.id =
          typeof authUser.id === "string" ? authUser.id : nextToken.id;
        nextToken.role = role;
        nextToken.tier = tier;
        nextToken.aol =
          authUser.aol ??
          buildAoLClaims({
            tier,
            memberId: authUser.id,
          });
      }

      if (trigger === "update" && session) {
        const updatedSession = session as SessionExtended;

        const sessionRole =
          typeof updatedSession.user?.role === "string"
            ? updatedSession.user.role
            : nextToken.role;

        const sessionTier = normalizeUserTier(
          updatedSession.user?.tier ??
            updatedSession.tier ??
            updatedSession.aol?.tier ??
            sessionRole ??
            nextToken.tier ??
            "public",
        );

        nextToken.role = sessionRole ?? nextToken.role ?? "user";
        nextToken.tier = sessionTier;

        if (updatedSession.aol) {
          nextToken.aol = {
            ...updatedSession.aol,
            tier: sessionTier,
          };
        }
      }

      if (!nextToken.aol) {
        nextToken.aol = buildAoLClaims({
          tier: nextToken.tier ?? nextToken.role ?? "public",
          memberId: nextToken.id,
        });
      }

      return nextToken;
    },

    async session({ session, token }) {
      const nextSession = session as SessionExtended;
      const jwt = token as JWTWithClaims;

      const role = typeof jwt.role === "string" ? jwt.role : "user";
      const tier = normalizeUserTier(jwt.tier ?? jwt.aol?.tier ?? role);

      nextSession.id = typeof jwt.id === "string" ? jwt.id : undefined;
      nextSession.tier = tier;

      if (!nextSession.user) {
        nextSession.user = {} as SessionUserExtended;
      }

      nextSession.user.id = typeof jwt.id === "string" ? jwt.id : "";
      nextSession.user.role = role;
      nextSession.user.tier = tier;

      nextSession.aol = jwt.aol
        ? { ...jwt.aol, tier }
        : buildAoLClaims({
            tier,
            memberId: jwt.id,
          });

      return nextSession;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        if (new URL(url).origin === baseUrl) {
          return url;
        }
      } catch {
        // ignore malformed callback URL
      }

      return baseUrl;
    },
  },

  pages: {
    signIn: "/admin/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",

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
          payload.token?.id ??
          payload.session?.user?.id ??
          payload.session?.id ??
          null,
        email: payload.session?.user?.email ?? null,
      });
    },

    async createUser(message) {
      logger.info("[AUTH] User created", {
        userId: message.user.id ?? null,
        email: message.user.email ?? null,
      });
    },

    async updateUser(message) {
      logger.info("[AUTH] User updated", {
        userId: message.user.id ?? null,
        email: message.user.email ?? null,
      });
    },

    async linkAccount(message) {
      logger.info("[AUTH] Account linked", {
        userId: message.user.id ?? null,
        provider: message.account.provider ?? null,
      });
    },

    async session(message) {
      if (process.env.NODE_ENV === "development") {
        const payload = message as {
          session?: SessionExtended;
          token?: JWTWithClaims;
        };

        logger.debug("[AUTH] Session accessed", {
          userId:
            payload.session?.user?.id ??
            payload.session?.id ??
            payload.token?.id ??
            null,
          email: payload.session?.user?.email ?? null,
        });
      }
    },
  },
};

export async function getAuthSession() {
  const { getServerSession } = await import("next-auth/next");
  return getServerSession(authOptions);
}

export default authOptions;
