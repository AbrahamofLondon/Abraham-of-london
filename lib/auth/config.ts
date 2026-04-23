import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";
import { emailOnlyAdapter } from "./email-adapter";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma.server";
import { BOOTSTRAP_ADMIN_EMAILS } from "@/lib/access/admin-emails";
import { getUserAccess } from "@/lib/access/get-user-access";

function bootstrapRoleForEmail(email: string) {
  if (email === "info@abrahamoflondon.org") return "OWNER" as const;
  if (BOOTSTRAP_ADMIN_EMAILS.has(email)) return "ADMIN" as const;
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
          const expectedPassword = adminUserPassword;

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

  // Email magic-link provider via Resend
  const resendApiKey = firstEnv("RESEND_API_KEY");
  if (resendApiKey) {
    providers.push(
      EmailProvider({
        server: {
          host: "smtp.resend.com",
          port: 465,
          auth: {
            user: "resend",
            pass: resendApiKey,
          },
        },
        from: process.env.EMAIL_FROM || "Abraham of London <noreply@abrahamoflondon.org>",
        async sendVerificationRequest({ identifier: email, url }) {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
            from: process.env.EMAIL_FROM || "Abraham of London <noreply@abrahamoflondon.org>",
            to: email,
            subject: "Sign in to Abraham of London",
            html: `
              <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                <p style="font-size: 14px; color: #666; margin-bottom: 24px;">
                  Sign in to the Abraham of London system.
                </p>
                <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #C9A96E; color: #000; text-decoration: none; font-family: monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;">
                  Sign in
                </a>
                <p style="font-size: 12px; color: #999; margin-top: 24px;">
                  If you did not request this, ignore this email.
                </p>
              </div>
            `,
          });
        },
      }),
    );
  }

  if (providers.length === 0) {
    console.warn("[AUTH_PROVIDER_CONFIG] No NextAuth providers configured", {
      google: Boolean(googleClientId && googleClientSecret),
      github: Boolean(githubId && githubSecret),
      credentials: Boolean(adminUserEmail && adminUserPassword),
      email: Boolean(resendApiKey),
    });
  }

  return providers;
}

export const authOptions: NextAuthOptions = {
  adapter: emailOnlyAdapter(),
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
