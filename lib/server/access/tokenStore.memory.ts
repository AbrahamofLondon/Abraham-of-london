import type { TokenStore } from "./tokenStore";
import type { AccessSession, OneTimeToken } from "./types";

export function createMemoryTokenStore(): TokenStore {
  const oneTime = new Map<string, OneTimeToken>();
  const sessions = new Map<string, AccessSession>();

  return {
    async getOneTimeToken(token) {
      const t = oneTime.get(token) || null;
      if (!t) return null;
      return t;
    },
    async consumeOneTimeToken(token) {
      const t = oneTime.get(token);
      if (!t) return false;
      if (t.revoked) return false;
      if (t.consumedAt) return false;
      if (Date.now() > t.expiresAt) return false;

      oneTime.set(token, { ...t, consumedAt: Date.now() });
      return true;
    },
    async getSession(sessionId) {
      const s = sessions.get(sessionId) || null;
      if (!s) return null;
      if (s.revoked) return null;
      if (Date.now() > s.expiresAt) return null;
      return s;
    },
    async upsertSession(session) {
      sessions.set(session.sessionId, session);
    },
    async revokeSession(sessionId) {
      const s = sessions.get(sessionId);
      if (!s) return;
      sessions.set(sessionId, { ...s, revoked: true });
    },

    // (optional) helpers for local dev seeding — you can delete later
    // @ts-expect-error intentional dev-only escape hatch
    __seedOneTimeToken(t: OneTimeToken) {
      oneTime.set(t.token, t);
    },
  };
}