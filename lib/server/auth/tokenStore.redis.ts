/* lib/server/auth/tokenStore.redis.ts - REDIS PRIMARY + POSTGRES FALLBACK */
// Redis remains the fast-path. Postgres is the authoritative fallback.
// Redis failure never breaks auth. System becomes resilient without changing behaviour.
//
// Type-only import keeps the Redis class name available for annotations
// without pulling @upstash/redis/nodejs.mjs into the static module graph.
import type { Redis } from '@upstash/redis';
import { type AccessTier, normalizeUserTier } from "@/lib/access/tier-policy";

// ─────────────────────────────────────────────────────────────────────────────
// SAFE REDIS SINGLETON — never throws unhandled
// ─────────────────────────────────────────────────────────────────────────────

let _redis: Redis | null = null;
let _redisAttempted = false;

async function getRedis(): Promise<Redis | null> {
  if (_redis) return _redis;
  if (_redisAttempted) return null;

  _redisAttempted = true;
  try {
    const mod = await import('@upstash/redis');
    _redis = mod.Redis.fromEnv();
    return _redis;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POSTGRES FALLBACK — lazy import to avoid circular deps
// ─────────────────────────────────────────────────────────────────────────────

async function pgVerifySession(token: string): Promise<{
  ok: boolean; valid: boolean; tier: AccessTier; memberId?: string | null; reason?: string; expiresAt?: string;
} | null> {
  try {
    const pg = await import("./tokenStore.postgres");
    const result = await pg.verifySession(token);
    if (!result.ok) return null;
    if (!result.valid) return { ok: true, valid: false, tier: "public", reason: result.reason };
    return { ok: true, valid: true, tier: normalizeUserTier(result.tier), memberId: result.memberId ?? null, expiresAt: result.expiresAt };
  } catch { return null; }
}

async function pgGetSessionTier(token: string): Promise<AccessTier | null> {
  try {
    const pg = await import("./tokenStore.postgres");
    const tier = await pg.getSessionTier(token);
    return tier ? normalizeUserTier(tier) : null;
  } catch { return null; }
}

async function pgGetSessionUser(token: string): Promise<{ userId?: string; email?: string; tier?: AccessTier } | null> {
  try {
    const pg = await import("./tokenStore.postgres");
    const ctx = await pg.getSessionContext(token);
    if (!ctx.ok || !ctx.valid) return null;
    return { userId: ctx.memberId ?? undefined, email: ctx.email ?? undefined, tier: ctx.tier ? normalizeUserTier(ctx.tier) : undefined };
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY SESSION — Redis primary, Postgres fallback
// ─────────────────────────────────────────────────────────────────────────────

export async function verifySession(token: string): Promise<{
  ok: boolean; valid: boolean; tier: AccessTier; reason?: string; expiresAt?: string;
}> {
  // 1. Try Redis
  const redis = await getRedis();
  if (redis) {
    try {
      const [tier, userData] = await Promise.all([
        redis.get<string>(`session:${token}:tier`),
        redis.get<any>(`session:${token}:user`),
      ]);
      if (tier) {
        return { ok: true, valid: true, tier: normalizeUserTier(tier), expiresAt: userData?.expiresAt || new Date(Date.now() + 86400000).toISOString() };
      }
      // Redis reachable but no session — try Postgres (session may not be cached)
    } catch {
      console.warn("[AUTH_FALLBACK] Redis error during verifySession, falling back to Postgres");
    }
  } else {
    console.warn("[AUTH_FALLBACK] Redis unavailable, using Postgres");
  }

  // 2. Fallback to Postgres
  const pgResult = await pgVerifySession(token);
  if (pgResult) return pgResult;

  // 3. No session
  return { ok: true, valid: false, tier: "public", reason: "SESSION_NOT_FOUND" };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET SESSION TIER — Redis primary, Postgres fallback
// ─────────────────────────────────────────────────────────────────────────────

export async function getSessionTier(token: string): Promise<AccessTier | null> {
  const redis = await getRedis();
  if (redis) {
    try {
      const tier = await redis.get<string>(`session:${token}:tier`);
      if (tier) return normalizeUserTier(tier);
    } catch { /* fall through */ }
  }
  return pgGetSessionTier(token);
}

// ─────────────────────────────────────────────────────────────────────────────
// SET SESSION TIER — Redis only (write-through cache)
// ─────────────────────────────────────────────────────────────────────────────

export async function setSessionTier(token: string, tier: string | AccessTier, expirySeconds: number = 7 * 24 * 60 * 60): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  try {
    const normalized = normalizeUserTier(tier);
    await redis.setex(`session:${token}:tier`, expirySeconds, normalized);
    await redis.setex(`session:${token}:metadata`, expirySeconds, { storedAt: new Date().toISOString(), originalTier: tier, normalizedTier: normalized });
  } catch { /* write failure non-critical */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// REVOKE SESSION — Redis cache invalidation only
// ─────────────────────────────────────────────────────────────────────────────

export async function revokeSession(token: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  try { await redis.del(`session:${token}:tier`); await redis.del(`session:${token}:metadata`); await redis.del(`session:${token}:user`); } catch { /* non-critical */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE SESSION — Redis cache (Postgres is authoritative via NextAuth)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Write session to Redis cache. This is a cache-write only.
 *
 * Session creation authority is NextAuth (JWT cookie + Postgres via Prisma).
 * This function is NOT the session creation authority — it populates
 * the Redis cache for fast lookups. If Redis is unavailable, the session
 * still exists in Postgres and verifySession() will find it there.
 *
 * Note: No external file currently calls this function directly.
 * Sessions are created by NextAuth, not by this cache layer.
 */
export async function createSession(token: string, userData: { tier: string | AccessTier; userId?: string; email?: string }, expirySeconds: number = 7 * 24 * 60 * 60): Promise<void> {
  const normalizedTier = normalizeUserTier(userData.tier);
  const redis = await getRedis();
  if (!redis) {
    // Redis unavailable — session still exists via NextAuth JWT + Postgres.
    // verifySession() will find it through the Postgres fallback path.
    console.warn("[AUTH_CACHE] Redis unavailable for createSession — session persists via NextAuth/Postgres");
    return;
  }
  try {
    await Promise.all([
      setSessionTier(token, normalizedTier, expirySeconds),
      redis.setex(`session:${token}:user`, expirySeconds, { userId: userData.userId, email: userData.email, tier: normalizedTier, createdAt: new Date().toISOString() }),
    ]);
  } catch { /* write failure non-critical — Postgres is authoritative */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET SESSION USER — Redis primary, Postgres fallback
// ─────────────────────────────────────────────────────────────────────────────

export async function getSessionUser(token: string): Promise<{ userId?: string; email?: string; tier?: AccessTier } | null> {
  const redis = await getRedis();
  if (redis) {
    try {
      const [tier, userData] = await Promise.all([
        redis.get<string>(`session:${token}:tier`),
        redis.get<Record<string, any>>(`session:${token}:user`),
      ]);
      if (tier || userData) {
        return { tier: tier ? normalizeUserTier(tier) : undefined, userId: userData?.userId, email: userData?.email };
      }
    } catch { /* fall through */ }
  }
  return pgGetSessionUser(token);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAINTENANCE — Redis only (best-effort)
// ─────────────────────────────────────────────────────────────────────────────

export async function revokeKey(keyHash: string, reason: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  try { await redis.set(`revoked_key:${keyHash}`, { revokedAt: new Date().toISOString(), reason }); } catch { /* non-critical */ }
}

export async function isKeyRevoked(keyHash: string): Promise<boolean> {
  const redis = await getRedis();
  if (!redis) return false;
  try { const revoked = await redis.get(`revoked_key:${keyHash}`); return !!revoked; } catch { return false; }
}
