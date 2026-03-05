import "server-only";

import type { TokenStore } from "./tokenStore";
import type { AccessSession, OneTimeToken } from "./types";

import { prisma } from "@/lib/prisma";
import { normalizeUserTier } from "@/lib/access/tier-policy";

/**
 * Postgres-backed TokenStore using your `sessions` table.
 *
 * Why this version:
 * - avoids `include: { member: ... }` because your generated Prisma client
 *   currently does not expose that relation on `prisma.session`
 * - fetches member tier in a second query
 * - keeps app tier canonical via normalizeUserTier()
 */
export async function createPostgresTokenStore(): Promise<TokenStore> {
  return {
    async getOneTimeToken(_token: string): Promise<OneTimeToken | null> {
      return null;
    },

    async consumeOneTimeToken(_token: string): Promise<boolean> {
      return false;
    },

    async getSession(sessionId: string): Promise<AccessSession | null> {
      const sid = String(sessionId || "").trim();
      if (!sid) return null;

      const s = await prisma.session.findUnique({
        where: { sessionId: sid },
      });

      if (!s) return null;

      // Only active sessions are valid
      if (String((s as any).status || "").toLowerCase() !== "active") {
        return null;
      }

      const exp = s.expiresAt ? new Date(s.expiresAt) : null;
      if (!exp || exp.getTime() <= Date.now()) {
        return null;
      }

      let tier = normalizeUserTier("public");

      // Resolve member tier separately because relation typing is not available
      if (s.memberId) {
        try {
          const member = await prisma.innerCircleMember.findUnique({
            where: { id: String(s.memberId) },
            select: { tier: true },
          });

          tier = normalizeUserTier((member as any)?.tier ?? "public");
        } catch {
          tier = normalizeUserTier("public");
        }
      }

      return {
        sessionId: s.sessionId,
        tier,
        subject: s.memberId ? String(s.memberId) : "anon",
        issuedAt: s.createdAt ? new Date(s.createdAt).getTime() : Date.now(),
        expiresAt: exp.getTime(),
      };
    },

    async upsertSession(session: AccessSession): Promise<void> {
      const sid = String(session?.sessionId || "").trim();
      if (!sid) return;

      const expiresAt = new Date(Number(session.expiresAt || Date.now()));
      const memberId = session.subject ? String(session.subject) : null;

      await prisma.session.upsert({
        where: { sessionId: sid },
        create: {
          sessionId: sid,
          memberId,
          status: "active",
          expiresAt,
        },
        update: {
          memberId,
          status: "active",
          expiresAt,
        },
      });
    },

    async revokeSession(sessionId: string): Promise<void> {
      const sid = String(sessionId || "").trim();
      if (!sid) return;

      try {
        await prisma.session.update({
          where: { sessionId: sid },
          data: { status: "revoked" },
        });
      } catch {
        // no-op
      }
    },
  };
}