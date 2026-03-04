import "server-only";

import type { TokenStore } from "./tokenStore";
import type { AccessSession, OneTimeToken } from "./types";
import { prisma } from "@/lib/prisma.server";
import { normalizeUserTier } from "@/lib/access/tier-policy";

export async function createPostgresTokenStore(): Promise<TokenStore> {
  return {
    // One-time tokens are NOT supported in this adapter (keep redis backend for OTT during transition)
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
        include: { member: { select: { tier: true } } },
      });

      if (!s) return null;
      if (String(s.status || "").toLowerCase() !== "active") return null;

      const exp = s.expiresAt ? new Date(s.expiresAt) : null;
      if (!exp || exp.getTime() <= Date.now()) return null;

      const tier = normalizeUserTier((s as any)?.member?.tier ?? "public");

      return {
        sessionId: s.sessionId,
        tier,
        subject: s.memberId ?? "anon",
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
        // ignore
      }
    },
  };
}