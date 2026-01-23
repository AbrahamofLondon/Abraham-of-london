/* lib/server/auth/tokenStore.redis.ts */
import { Redis } from '@upstash/redis'; 

const redis = Redis.fromEnv();

/**
 * Checks the session tier stored in Redis.
 */
export async function getSessionTier(token: string): Promise<"public" | "inner-circle" | "private" | null> {
  const tier = await redis.get<string>(`session:${token}:tier`);
  return (tier as any) || null;
}

/**
 * Removes the session from the cache.
 */
export async function revokeSession(token: string): Promise<void> {
  await redis.del(`session:${token}:tier`);
}

/**
 * Marks a specific access key as revoked.
 */
export async function revokeKey(keyHash: string, reason: string): Promise<void> {
  await redis.set(`revoked_key:${keyHash}`, {
    revokedAt: new Date().toISOString(),
    reason
  });
}