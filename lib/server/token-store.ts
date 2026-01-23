// lib/server/token-store.ts
import { createClient } from "redis";

export type Tier = "public" | "inner-circle" | "private";

export type Session = {
  tier: Tier;
  sub?: string;          // email or user id
  suspended?: boolean;
  issuedAt: number;
  expiresAt?: number;    // optional hard expiry
};

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) throw new Error("REDIS_URL not set");

const redis = createClient({ url: REDIS_URL });
redis.connect().catch(console.error);

const PREFIX = "aol:session:";
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export const tokenStore = {
  async createSession(
    sessionId: string,
    data: Session,
    ttlSeconds: number = TTL_SECONDS
  ) {
    const key = PREFIX + sessionId;
    await redis.set(key, JSON.stringify(data), { EX: ttlSeconds });
  },

  async getSession(sessionId: string): Promise<Session | null> {
    const key = PREFIX + sessionId;
    const raw = await redis.get(key);
    if (!raw) return null;

    try {
      const session = JSON.parse(raw) as Session;
      if (session.expiresAt && Date.now() > session.expiresAt) {
        await redis.del(key);
        return null;
      }
      return session;
    } catch {
      await redis.del(key);
      return null;
    }
  },

  async revokeSession(sessionId: string) {
    await redis.del(PREFIX + sessionId);
  },

  async suspendSession(sessionId: string) {
    const key = PREFIX + sessionId;
    const s = await this.getSession(sessionId);
    if (!s) return;
    s.suspended = true;
    await redis.set(key, JSON.stringify(s));
  },
};