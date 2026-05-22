import crypto from "crypto";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma.server";
import { isBootstrapAdminEmail } from "@/lib/access/admin-emails";
import { getUserAccess } from "@/lib/access/get-user-access";
import { classifyAuthError } from "@/lib/auth/auth-error-classifier";
import { verifyPassword } from "@/lib/auth/password";
import { checkRateLimit } from "@/lib/server/rate-limit";

// ── Admin session constants ───────────────────────────────────────────────────
// Admin/Owner sessions expire after 8 hours regardless of JWT maxAge.
// Checked in requireAdminApi / requireAdminPage via session.user.adminSessionIssuedAt.
export const ADMIN_SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours
const ADMIN_ROLES = new Set(["ADMIN", "OWNER"]);

function bootstrapRoleForEmail(email: string) {
  if (email === "info@abrahamoflondon.org") return "OWNER" as const;
  if (isBootstrapAdminEmail(email)) return "ADMIN" as const;
  return null;
}

function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function buildProviders() {
  const providers = [];

  const googleClientId = firstEnv("GOOGLE_CLIENT_ID", "GOOGLE_ID", "AUTH_GOOGLE_ID");
  const googleClientSecret = firstEnv(
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_SECRET",
    "AUTH_GOOGLE_SECRET",
  );

  if (googleClientId && googleClientSecret) {
    providers.push(
      GoogleProvider({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      }),
    );
  }

  const githubId = firstEnv("GITHUB_ID", "GITHUB_CLIENT_ID", "AUTH_GITHUB_ID");
  const githubSecret = firstEnv(
    "GITHUB_SECRET",
    "GITHUB_CLIENT_SECRET",
    "AUTH_GITHUB_SECRET",
  );

  if (githubId && githubSecret) {
    providers.push(
      GitHubProvider({
        clientId: githubId,
        clientSecret: githubSecret,
      }),
    );
  }

  const adminUserEmail = firstEnv("ADMIN_USER_EMAIL", "NEXTAUTH_ADMIN_EMAIL");
  const adminUserPassword = firstEnv("ADMIN_USER_PASSWORD", "NEXTAUTH_ADMIN_PASSWORD");

  if (adminUserEmail && adminUserPassword) {
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
          const expectedEmail = adminUserEmail.trim().toLowerCase();
          const configuredPasswordHash = adminUserPassword;

          if (!email || !password || !expectedEmail || !configuredPasswordHash) {
            return null;
          }

          // ── Rate limit: 5 attempts per 10 minutes per email ────────────────
          // Identifier is the email (or "unknown") — not exposed in response.
          // Failure doesn't reveal whether the email exists (null in both cases).
          try {
            const emailHash = crypto
              .createHash("sha256")
              .update(email)
              .digest("hex");
            const rl = await checkRateLimit({
              scope: "admin-credentials-login",
              identifier: emailHash,
              limit: 5,
              windowSeconds: 600,
            });
            if (!rl.allowed) {
              console.warn("[AUTH_CREDENTIALS] Rate limit exceeded", {
                emailPrefix: email.slice(0, 3) + "***",
              });
              return null;
            }
          } catch {
            // Rate limit check failure is non-fatal — proceed with auth
          }

          const isHashedPassword =
            configuredPasswordHash.startsWith("$2") ||
            configuredPasswordHash.startsWith("$argon2");

          if (!isHashedPassword) {
            console.error("[AUTH_PROVIDER_CONFIG] Bootstrap admin password must be stored as a hash");
            return null;
          }

          const passwordOk = await verifyPassword(password, configuredPasswordHash);

          if (email !== expectedEmail || !passwordOk) {
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

  // Note: Email magic-link is handled by /api/admin/auth/send-link (custom route),
  // NOT by NextAuth's EmailProvider. This avoids the adapter requirement and
  // ensures the login page always gets JSON responses.

  if (providers.length === 0) {
    console.warn("[AUTH_PROVIDER_CONFIG] No NextAuth providers configured", {
      google: Boolean(googleClientId && googleClientSecret),
      github: Boolean(githubId && githubSecret),
      credentials: Boolean(adminUserEmail && adminUserPassword),
    });
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
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase().trim();
      if (!email) return false;

      const bootstrapRole = bootstrapRoleForEmail(email);

      try {
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
      } catch (error) {
        const safe = classifyAuthError(error);
        console.error("[auth] signIn database failure", {
          code: safe.code,
          callback: "signIn",
        });
        throw new Error(safe.code);
      }

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
        }).catch((error) => {
          const safe = classifyAuthError(error);
          console.error("[auth] jwt role sync failure", {
            code: safe.code,
            callback: "jwt",
          });
          return undefined;
        });
      }

      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: fallbackEmail },
          select: { id: true, role: true },
        });

        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
        }
      } catch (error) {
        const safe = classifyAuthError(error);
        console.error("[auth] jwt user lookup failure", {
          code: safe.code,
          callback: "jwt",
        });
      }

      if (trigger === "update" && session?.user) {
        token.role = session.user.role ?? token.role;
      }

      // ── Admin session expiry stamp ─────────────────────────────────────────
      // Set once on first admin login — NOT updated on refresh, so the 8-hour
      // clock starts from when the admin session was first established.
      const isAdminRole = ADMIN_ROLES.has(typeof token.role === "string" ? token.role : "");
      if (isAdminRole && !token.adminSessionIssuedAt) {
        token.adminSessionIssuedAt = Date.now();
      }
      // If role was downgraded from admin, clear the stamp
      if (!isAdminRole) {
        delete token.adminSessionIssuedAt;
      }

      return token;
    },

    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      session.user.id = typeof token.sub === "string" ? token.sub : "";
      session.user.role = typeof token.role === "string" ? token.role : "USER";
      // Propagate admin session expiry stamp for server-side TTL enforcement
      session.user.adminSessionIssuedAt =
        typeof token.adminSessionIssuedAt === "number"
          ? token.adminSessionIssuedAt
          : undefined;

      try {
        const access = await getUserAccess(
          prisma,
          typeof token.sub === "string" ? token.sub : null,
        );

        session.user.accessTier = access.tier;
        session.user.entitlements = access.entitlements;
        session.user.access = access;
      } catch (error) {
        const safe = classifyAuthError(error);
        console.error("[auth] session access resolution failure", {
          code: safe.code,
          callback: "session",
        });
        session.user.accessTier = "public";
        session.user.entitlements = { tiers: [], products: [], artifacts: [] };
        session.user.access = {
          userId: null,
          email: session.user.email ?? null,
          role: null,
          tier: "public",
          entitlements: { tiers: [], products: [], artifacts: [] },
          permissions: {
            isAuthenticated: Boolean(session.user.email),
            isAdmin: false,
            isOwner: false,
          },
        };
      }

      return session;
    },
  },
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export default authOptions;
