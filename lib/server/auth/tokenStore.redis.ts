/* lib/server/auth/tokenStore.redis.ts - FIXED with SSOT */
import { Redis } from '@upstash/redis';
import { type AccessTier, normalizeUserTier } from "@/lib/access/tier-policy";

const redis = Redis.fromEnv();

/**
 * Checks the session tier stored in Redis.
 * Returns normalized AccessTier or null
 */
export async function getSessionTier(token: string): Promise<AccessTier | null> {
  try {
    const tier = await redis.get<string>(`session:${token}:tier`);
    if (!tier) return null;
    
    // Normalize any legacy value to SSOT
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
    // Normalize before storing (optional - could store raw for backward compat)
    const normalized = normalizeUserTier(tier);
    await redis.setex(`session:${token}:tier`, expirySeconds, normalized);
    
    // Also store metadata
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
  } catch (error) {
    console.error("[tokenStore] Error revoking session:", error);
  }
}

/**
 * Marks a specific access key as revoked.
 */
export async function revokeKey(keyHash: string, reason: string): Promise<void> {
  try {
    await redis.set(`revoked_key:${keyHash}`, {
      revokedAt: new Date().toISOString(),
      reason
    });
  } catch (error) {
    console.error("[tokenStore] Error revoking key:", error);
  }
}

/**
 * Check if a key is revoked
 */
export async function isKeyRevoked(keyHash: string): Promise<boolean> {
  try {
    const revoked = await redis.get(`revoked_key:${keyHash}`);
    return !!revoked;
  } catch (error) {
    console.error("[tokenStore] Error checking revoked key:", error);
    return false;
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