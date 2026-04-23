/**
 * Minimal NextAuth adapter for email verification only.
 *
 * Only implements createVerificationToken and useVerificationToken.
 * All other adapter methods are no-ops since we use JWT sessions.
 */

import type { Adapter } from "next-auth/adapters";
import { prisma } from "@/lib/prisma.server";

export function emailOnlyAdapter(): Adapter {
  return {
    async createUser(user: any) {
      const created = await prisma.user.upsert({
        where: { email: user.email },
        create: { email: user.email, name: user.name ?? null },
        update: { name: user.name ?? undefined },
      });
      return { ...created, email: created.email ?? "", emailVerified: created.emailVerified };
    },
    async getUser(id) {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return null;
      return { ...user, email: user.email ?? "", emailVerified: user.emailVerified };
    },
    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return null;
      return { ...user, email: user.email ?? "", emailVerified: user.emailVerified };
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
      });
      if (!account?.user) return null;
      return { ...account.user, email: account.user.email ?? "", emailVerified: account.user.emailVerified };
    },
    async updateUser(user) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { name: user.name ?? undefined, email: user.email ?? undefined },
      });
      return { ...updated, email: updated.email ?? "", emailVerified: updated.emailVerified };
    },
    async linkAccount(account: any) {
      await prisma.account.create({
        data: {
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token ?? null,
          access_token: account.access_token ?? null,
          expires_at: account.expires_at ?? null,
          token_type: account.token_type ?? null,
          scope: account.scope ?? null,
          id_token: account.id_token ?? null,
          session_state: account.session_state as string ?? null,
        },
      });
    },
    async createSession() { return { sessionToken: "", userId: "", expires: new Date() }; },
    async getSessionAndUser() { return null; },
    async updateSession() { return null; },
    async deleteSession() {},
    async deleteUser() {},
    async unlinkAccount() {},
    async createVerificationToken(token) {
      const created = await prisma.verificationToken.create({
        data: {
          identifier: token.identifier,
          token: token.token,
          expires: token.expires,
        },
      });
      return created;
    },
    async useVerificationToken({ identifier, token }) {
      try {
        const used = await prisma.verificationToken.delete({
          where: { identifier_token: { identifier, token } },
        });
        return used;
      } catch {
        return null;
      }
    },
  };
}
