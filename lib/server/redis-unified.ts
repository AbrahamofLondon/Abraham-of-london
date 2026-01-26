// lib/server/redis-unified.ts
// SINGLE IMPORT POINT for server-side code

import { getRedis, isRedisAvailable, closeRedis, type Redis } from '../redis';

// Rate limiting with Redis
export async function rateLimitWithRedis(key: string, windowMs: number, maxRequests: number) {
  const redis = getRedis();
  
  try {
    const current = await redis.get(`rate-limit:${key}`);
    const count = current ? parseInt(current) : 0;
    
    if (count >= maxRequests) {
      return { allowed: false, remaining: 0, resetIn: windowMs };
    }
    
    await redis.multi()
      .incr(`rate-limit:${key}`)
      .expire(`rate-limit:${key}`, Math.ceil(windowMs / 1000))
      .exec();
    
    return { allowed: true, remaining: maxRequests - count - 1, resetIn: windowMs };
  } catch (error) {
    // Fallback: allow if Redis fails
    console.warn('[Redis Rate Limit] Failed, allowing request:', error);
    return { allowed: true, remaining: maxRequests, resetIn: windowMs };
  }
}

// Session storage
export async function setSession(key: string, value: any, ttlSeconds: number = 3600) {
  const redis = getRedis();
  try {
    await redis.setex(`session:${key}`, ttlSeconds, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export async function getSession(key: string) {
  const redis = getRedis();
  try {
    const data = await redis.get(`session:${key}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// Token storage
export async function storeToken(token: string, data: any, expiresInSeconds: number) {
  const redis = getRedis();
  try {
    await redis.setex(`token:${token}`, expiresInSeconds, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export async function validateToken(token: string) {
  const redis = getRedis();
  try {
    const data = await redis.get(`token:${token}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// Export everything needed
export { getRedis, isRedisAvailable, closeRedis, type Redis };