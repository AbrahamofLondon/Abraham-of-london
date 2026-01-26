// lib/redis-safe.ts - EDGE-SAFE REDIS WRAPPER
/**
 * This module provides a safe way to access Redis that works in both
 * Node.js and Edge runtimes. It never throws errors and always returns
 * null when Redis is unavailable.
 * 
 * USE THIS instead of importing @/lib/redis directly in Edge routes!
 */

// Runtime detection
const isEdgeRuntime = typeof EdgeRuntime !== 'undefined' || typeof caches !== 'undefined';
const isNodeRuntime = typeof process !== 'undefined' && process.versions?.node;

// ==================== TYPES ====================

export type SafeRedisClient = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ...args: any[]) => Promise<any>;
  del: (...keys: string[]) => Promise<number>;
  ping: () => Promise<string>;
  keys: (pattern: string) => Promise<string[]>;
  exists: (...keys: string[]) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
  ttl: (key: string) => Promise<number>;
  incr: (key: string) => Promise<number>;
  decr: (key: string) => Promise<number>;
  hget: (key: string, field: string) => Promise<string | null>;
  hset: (key: string, field: string, value: string) => Promise<number>;
  hgetall: (key: string) => Promise<Record<string, string>>;
  lpush: (key: string, ...values: string[]) => Promise<number>;
  rpush: (key: string, ...values: string[]) => Promise<number>;
  lrange: (key: string, start: number, stop: number) => Promise<string[]>;
};

export type RedisStats = {
  available: boolean;
  type: 'upstash' | 'vercel-kv' | 'ioredis' | 'none';
  runtime: 'edge' | 'node' | 'unknown';
  connectionStatus: 'connected' | 'disconnected' | 'unknown';
  error?: string;
};

// ==================== UPSTASH/VERCEL KV (EDGE-COMPATIBLE) ====================

async function getEdgeCompatibleRedis(): Promise<any | null> {
  // Try Vercel KV first
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import('@vercel/kv');
      return { client: kv, type: 'vercel-kv' };
    } catch (error) {
      console.warn('[Redis Safe] Vercel KV import failed:', error);
    }
  }

  // Try Upstash Redis
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = await import('@upstash/redis');
      const client = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      return { client, type: 'upstash' };
    } catch (error) {
      console.warn('[Redis Safe] Upstash Redis import failed:', error);
    }
  }

  return null;
}

// ==================== IOREDIS (NODE.JS ONLY) ====================

async function getNodeRedis(): Promise<any | null> {
  if (isEdgeRuntime) return null; // Never try ioredis in Edge

  try {
    const redisModule = await import('@/lib/redis');
    const redis = typeof redisModule.getRedis === 'function' 
      ? redisModule.getRedis() 
      : redisModule.redisClient || null;
    
    if (redis) {
      return { client: redis, type: 'ioredis' };
    }
  } catch (error) {
    console.warn('[Redis Safe] ioredis import failed (this is OK in Edge):', error);
  }

  return null;
}

// ==================== MAIN CLIENT GETTER ====================

let cachedRedis: { client: any; type: string } | null | false = null;

async function getRedisClient(): Promise<{ client: any; type: string } | null> {
  // Return cached result
  if (cachedRedis !== null) {
    return cachedRedis || null;
  }

  // Try Edge-compatible Redis first (works everywhere)
  const edgeRedis = await getEdgeCompatibleRedis();
  if (edgeRedis) {
    cachedRedis = edgeRedis;
    return edgeRedis;
  }

  // Try Node.js Redis (only in Node runtime)
  if (isNodeRuntime && !isEdgeRuntime) {
    const nodeRedis = await getNodeRedis();
    if (nodeRedis) {
      cachedRedis = nodeRedis;
      return nodeRedis;
    }
  }

  // Mark as unavailable
  cachedRedis = false;
  return null;
}

// ==================== SAFE WRAPPER FUNCTIONS ====================

export async function getRedis(): Promise<SafeRedisClient | null> {
  const redis = await getRedisClient();
  return redis?.client || null;
}

export async function getRedisStats(): Promise<RedisStats> {
  const redis = await getRedisClient();

  if (!redis) {
    return {
      available: false,
      type: 'none',
      runtime: isEdgeRuntime ? 'edge' : isNodeRuntime ? 'node' : 'unknown',
      connectionStatus: 'disconnected',
    };
  }

  // Test connection
  let connectionStatus: 'connected' | 'disconnected' | 'unknown' = 'unknown';
  try {
    await redis.client.ping();
    connectionStatus = 'connected';
  } catch (error) {
    connectionStatus = 'disconnected';
  }

  return {
    available: connectionStatus === 'connected',
    type: redis.type as any,
    runtime: isEdgeRuntime ? 'edge' : isNodeRuntime ? 'node' : 'unknown',
    connectionStatus,
  };
}

// ==================== SAFE OPERATIONS ====================

export async function safeGet(key: string): Promise<string | null> {
  try {
    const redis = await getRedis();
    if (!redis?.get) return null;
    return await redis.get(key);
  } catch (error) {
    console.error('[Redis Safe] Get failed:', error);
    return null;
  }
}

export async function safeSet(
  key: string, 
  value: string, 
  options?: { ex?: number; px?: number }
): Promise<boolean> {
  try {
    const redis = await getRedis();
    if (!redis?.set) return false;

    if (options?.ex) {
      await redis.set(key, value, 'EX', options.ex);
    } else if (options?.px) {
      await redis.set(key, value, 'PX', options.px);
    } else {
      await redis.set(key, value);
    }

    return true;
  } catch (error) {
    console.error('[Redis Safe] Set failed:', error);
    return false;
  }
}

export async function safeDel(...keys: string[]): Promise<number> {
  try {
    const redis = await getRedis();
    if (!redis?.del) return 0;
    return await redis.del(...keys);
  } catch (error) {
    console.error('[Redis Safe] Del failed:', error);
    return 0;
  }
}

export async function safeExists(...keys: string[]): Promise<number> {
  try {
    const redis = await getRedis();
    if (!redis?.exists) return 0;
    return await redis.exists(...keys);
  } catch (error) {
    console.error('[Redis Safe] Exists failed:', error);
    return 0;
  }
}

export async function safeIncr(key: string): Promise<number | null> {
  try {
    const redis = await getRedis();
    if (!redis?.incr) return null;
    return await redis.incr(key);
  } catch (error) {
    console.error('[Redis Safe] Incr failed:', error);
    return null;
  }
}

export async function safePing(): Promise<boolean> {
  try {
    const redis = await getRedis();
    if (!redis?.ping) return false;
    const result = await redis.ping();
    return result === 'PONG' || result === true;
  } catch (error) {
    return false;
  }
}

// ==================== UTILITY FUNCTIONS ====================

export function isRedisAvailable(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    (!isEdgeRuntime && process.env.REDIS_URL)
  );
}

export function getRedisType(): 'upstash' | 'vercel-kv' | 'ioredis' | 'none' {
  if (process.env.KV_REST_API_URL) return 'vercel-kv';
  if (process.env.UPSTASH_REDIS_REST_URL) return 'upstash';
  if (!isEdgeRuntime && process.env.REDIS_URL) return 'ioredis';
  return 'none';
}

// ==================== HEALTH CHECK ====================

export async function redisHealthCheck(): Promise<{
  healthy: boolean;
  details: RedisStats;
  latencyMs?: number;
}> {
  const start = Date.now();
  const stats = await getRedisStats();
  const latencyMs = Date.now() - start;

  return {
    healthy: stats.available && stats.connectionStatus === 'connected',
    details: stats,
    latencyMs,
  };
}

// ==================== DEFAULT EXPORT ====================

export default {
  getRedis,
  getRedisStats,
  safeGet,
  safeSet,
  safeDel,
  safeExists,
  safeIncr,
  safePing,
  isRedisAvailable,
  getRedisType,
  redisHealthCheck,
};

// ==================== EXPORT STUB CLIENT ====================

/**
 * Safe stub client that always returns null/false
 * Use this when Redis is definitely not available
 */
export const redisStub: SafeRedisClient = {
  get: async () => null,
  set: async () => null,
  del: async () => 0,
  ping: async () => 'PONG',
  keys: async () => [],
  exists: async () => 0,
  expire: async () => 0,
  ttl: async () => -1,
  incr: async () => 0,
  decr: async () => 0,
  hget: async () => null,
  hset: async () => 0,
  hgetall: async () => ({}),
  lpush: async () => 0,
  rpush: async () => 0,
  lrange: async () => [],
};