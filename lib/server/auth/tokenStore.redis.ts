/* lib/server/auth/tokenStore.redis.ts - FINAL SSOT ALIGNED */
import { Redis } from '@upstash/redis';
import { type AccessTier, normalizeUserTier } from "@/lib/access/tier-policy";

const redis = Redis.fromEnv();

/**
 * FIXED: Added verifySession to satisfy lib/inner-circle/access.server.ts
 * Bridges raw Redis data into the authentication clearance logic.
 */
export async function verifySession(token: string): Promise<{
  ok: boolean;
  valid: boolean;
  tier: AccessTier;
  reason?: string;
  expiresAt?: string;
}> {
  try {
    const [tier, userData] = await Promise.all([
      redis.get<string>(`session:${token}:tier`),
      redis.get<any>(`session:${token}:user`),
    ]);

    if (!tier) {
      return { 
        ok: true, 
        valid: false, 
        tier: "public", 
        reason: "SESSION_NOT_FOUND" 
      };
    }

    return {
      ok: true,
      valid: true,
      tier: normalizeUserTier(tier),
      expiresAt: userData?.expiresAt || new Date(Date.now() + 86400000).toISOString()
    };
  } catch (error) {
    console.error("[tokenStore] verifySession critical failure:", error);
    return { 
      ok: false, 
      valid: false, 
      tier: "public", 
      reason: "INTERNAL_REDIS_ERROR" 
    };
  }
}

/**
 * Checks the session tier stored in Redis.
 */
export async function getSessionTier(token: string): Promise<AccessTier | null> {
  try {
    const tier = await redis.get<string>(`session:${token}:tier`);
    if (!tier) return null;
    return normalizeUserTier(tier);
  } catch (error) {
    console.error("[tokenStore] Error getting session tier:", error);
    return null;
  }
}

/**
 * Stores session tier in Redis
 */
export async function setSessionTier(
  token: string, 
  tier: string | AccessTier,
  expirySeconds: number = 7 * 24 * 60 * 60 // 7 days default
): Promise<void> {
  try {
    const normalized = normalizeUserTier(tier);
    await redis.setex(`session:${token}:tier`, expirySeconds, normalized);
    
    await redis.setex(`session:${token}:metadata`, expirySeconds, {
      storedAt: new Date().toISOString(),
      originalTier: tier,
      normalizedTier: normalized,
    });
  } catch (error) {
    console.error("[tokenStore] Error setting session tier:", error);
  }
}

/**
 * Removes the session from the cache.
 */
export async function revokeSession(token: string): Promise<void> {
  try {
    await redis.del(`session:${token}:tier`);
    await redis.del(`session:${token}:metadata`);
    await redis.del(`session:${token}:user`);
  } catch (error) {
    console.error("[tokenStore] Error revoking session:", error);
  }
}

/**
 * Helper to create a session with proper tier
 */
export async function createSession(
  token: string,
  userData: {
    tier: string | AccessTier;
    userId?: string;
    email?: string;
  },
  expirySeconds: number = 7 * 24 * 60 * 60
): Promise<void> {
  const normalizedTier = normalizeUserTier(userData.tier);
  
  await Promise.all([
    setSessionTier(token, normalizedTier, expirySeconds),
    redis.setex(`session:${token}:user`, expirySeconds, {
      userId: userData.userId,
      email: userData.email,
      tier: normalizedTier,
      createdAt: new Date().toISOString(),
    }),
  ]);
}

/**
 * Get user data from session
 */
export async function getSessionUser(token: string): Promise<{
  userId?: string;
  email?: string;
  tier?: AccessTier;
} | null> {
  try {
    const [tier, userData] = await Promise.all([
      redis.get<string>(`session:${token}:tier`),
      redis.get<Record<string, any>>(`session:${token}:user`),
    ]);

    if (!tier && !userData) return null;

    return {
      tier: tier ? normalizeUserTier(tier) : undefined,
      userId: userData?.userId,
      email: userData?.email,
    };
  } catch (error) {
    console.error("[tokenStore] Error getting session user:", error);
    return null;
  }
}

// Maintenance Exports
export async function revokeKey(keyHash: string, reason: string): Promise<void> {
  await redis.set(`revoked_key:${keyHash}`, { revokedAt: new Date().toISOString(), reason });
}

export async function isKeyRevoked(keyHash: string): Promise<boolean> {
  const revoked = await redis.get(`revoked_key:${keyHash}`);
  return !!revoked;
}