// lib/rate-limit-redis.ts - SIMPLIFIED VERSION
import { getRedis } from '@/lib/redis';

export type RedisCheckResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
  blocked?: boolean;
  blockUntil?: number;
};

async function check(
  key: string,
  opts: { windowMs: number; max: number; keyPrefix?: string; blockDuration?: number }
): Promise<RedisCheckResult> {
  const now = Date.now();
  
  // Simplified: Always allow for mock Redis
  console.log(`[Rate Limit Mock] Check: ${key}, max: ${opts.max}, window: ${opts.windowMs}ms`);
  
  return {
    allowed: true,
    remaining: opts.max,
    resetAt: now + opts.windowMs,
    limit: opts.max,
    blocked: false,
  };
}

async function getStats() {
  console.log('[Rate Limit Mock] Stats check');
  return { 
    ok: true, 
    redisAvailable: false,
    message: 'Using mock Redis implementation' 
  };
}

export const rateLimitRedis = { check, getStats };
export default rateLimitRedis;