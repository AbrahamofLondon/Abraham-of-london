// lib/rate-limit.ts — dependency-free, serverless-safe
import redis from '@/lib/redis-enhanced'; // Use enhanced Redis stub

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  blockDuration?: number;
  useRedis?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  blocked?: boolean;
  blockUntil?: number;
}

export const RATE_LIMIT_CONFIGS = {
  API_READ: { windowMs: 60_000, max: 60, keyPrefix: "api_read", useRedis: !!process.env.REDIS_URL },
  API_WRITE: { windowMs: 60_000, max: 30, keyPrefix: "api_write", skipSuccessfulRequests: true, useRedis: !!process.env.REDIS_URL },
  CONTENT_API: { windowMs: 60_000, max: 30, keyPrefix: "content", useRedis: !!process.env.REDIS_URL },
  SHORTS_INTERACTIONS: { windowMs: 60_000, max: 30, keyPrefix: "shorts_interactions", useRedis: !!process.env.REDIS_URL },
  TEASER_REQUEST: { windowMs: 60_000, max: 5, keyPrefix: "teaser", useRedis: !!process.env.REDIS_URL },
  NEWSLETTER_SUBSCRIBE: { windowMs: 60_000, max: 5, keyPrefix: "newsletter", blockDuration: 300_000, useRedis: !!process.env.REDIS_URL },

  // For "always redis" configs, degrade safely to memory stub if REDIS_URL missing
  AUTH_LOGIN: { windowMs: 15 * 60_000, max: 5, keyPrefix: "auth_login", skipSuccessfulRequests: true, blockDuration: 900_000, useRedis: true },
  AUTH_REGISTER: { windowMs: 60 * 60_000, max: 3, keyPrefix: "auth_register", blockDuration: 3600_000, useRedis: true },
  INNER_CIRCLE_REGISTER: { windowMs: 15 * 60_000, max: 3, keyPrefix: "inner_circle_register_ip", blockDuration: 900_000, useRedis: true },
  INNER_CIRCLE_REGISTER_EMAIL: { windowMs: 60 * 60_000, max: 2, keyPrefix: "inner_circle_register_email", blockDuration: 3600_000, useRedis: true },
  INNER_CIRCLE_UNLOCK: { windowMs: 60_000, max: 10, keyPrefix: "inner_circle_unlock", skipSuccessfulRequests: true, blockDuration: 300_000, useRedis: true },
  ADMIN_OPERATIONS: { windowMs: 60_000, max: 30, keyPrefix: "admin", useRedis: true },
  INNER_CIRCLE_ADMIN_EXPORT: { windowMs: 5 * 60_000, max: 5, keyPrefix: "inner_circle_admin_export", useRedis: true },
  CONTACT_FORM: { windowMs: 60_000, max: 3, keyPrefix: "contact", blockDuration: 600_000, useRedis: !!process.env.REDIS_URL },
  DOWNLOADS: { windowMs: 60_000, max: 10, keyPrefix: "downloads", useRedis: !!process.env.REDIS_URL },
  WEBHOOK_RECEIVE: { windowMs: 60_000, max: 100, keyPrefix: "webhook", useRedis: !!process.env.REDIS_URL },
  CACHE_BUST: { windowMs: 10_000, max: 5, keyPrefix: "cache", useRedis: !!process.env.REDIS_URL },
  SUSPICIOUS_ACTIVITY: { windowMs: 60_000, max: 2, keyPrefix: "suspicious", blockDuration: 3600_000, useRedis: true },
} as const;

interface RateLimitStorage {
  check(key: string, config: RateLimitConfig): Promise<RateLimitResult>;
  markSuccess(key: string): Promise<void>;
  getStatus(key: string, config: RateLimitConfig): Promise<RateLimitResult | null>;
  resetKey(key: string): Promise<boolean>;
  blockPermanently(key: string): Promise<void>;
  unblock(key: string): Promise<void>;
  getStats(): Promise<{
    totalBuckets: number;
    activeBuckets: number;
    blockedKeys: number;
    permanentBlocks: number;
  }>;
}

// Memory storage (keep your existing implementation)
class MemoryStorage implements RateLimitStorage {
  private store = new Map<string, {
    count: number;
    resetAt: number;
    firstRequestAt: number;
    blockUntil?: number;
  }>();
  private permanentBlocks = new Set<string>();
  private lastCleanup = Date.now();
  private readonly CLEANUP_INTERVAL = 30000;

  private performCleanup(): void {
    const now = Date.now();
    
    if (now - this.lastCleanup > this.CLEANUP_INTERVAL) {
      for (const [key, entry] of this.store.entries()) {
        const isExpired = now > entry.resetAt;
        const blockExpired = entry.blockUntil && entry.blockUntil <= now;
        const notPermanentlyBlocked = !this.permanentBlocks.has(key);
        
        if ((isExpired && (blockExpired || !entry.blockUntil)) && notPermanentlyBlocked) {
          this.store.delete(key);
        }
      }
      this.lastCleanup = now;
    }
  }

  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    this.performCleanup();
    const now = Date.now();
    
    // Check permanent blocks
    if (this.permanentBlocks.has(key)) {
      return {
        allowed: false,
        remaining: 0,
        limit: config.max,
        resetAt: now + config.windowMs,
        blocked: true,
        blockUntil: now + 365 * 24 * 60 * 60 * 1000,
      };
    }

    let entry = this.store.get(key);
    
    // Check temporary block
    if (entry?.blockUntil && entry.blockUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        limit: config.max,
        resetAt: entry.resetAt,
        blocked: true,
        blockUntil: entry.blockUntil,
      };
    }

    // Create new entry if expired or doesn't exist
    if (!entry || now > entry.resetAt) {
      entry = {
        count: 0,
        resetAt: now + config.windowMs,
        firstRequestAt: now,
      };
    }

    entry.count += 1;
    this.store.set(key, entry);

    const allowed = entry.count <= config.max;
    
    // Apply temporary block if configured and limit exceeded
    if (!allowed && config.blockDuration && !entry.blockUntil) {
      entry.blockUntil = now + config.blockDuration;
    }

    return {
      allowed,
      remaining: Math.max(0, config.max - entry.count),
      limit: config.max,
      resetAt: entry.resetAt,
      blocked: !!entry.blockUntil && entry.blockUntil > now,
      blockUntil: entry.blockUntil,
    };
  }

  async markSuccess(key: string): Promise<void> {
    const entry = this.store.get(key);
    if (entry && entry.count > 0) {
      entry.count = Math.max(0, entry.count - 1);
    }
  }

  async getStatus(key: string, config: RateLimitConfig): Promise<RateLimitResult | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    const blocked = this.permanentBlocks.has(key) || 
                   (entry.blockUntil ? entry.blockUntil > now : false);
    
    return {
      allowed: entry.count <= config.max && !blocked,
      remaining: Math.max(0, config.max - entry.count),
      limit: config.max,
      resetAt: entry.resetAt,
      blocked,
      blockUntil: entry.blockUntil,
    };
  }

  async resetKey(key: string): Promise<boolean> {
    this.permanentBlocks.delete(key);
    return this.store.delete(key);
  }

  async blockPermanently(key: string): Promise<void> {
    this.permanentBlocks.add(key);
    console.warn(`[RateLimiter] PERMANENT BLOCK: ${key}`);
  }

  async unblock(key: string): Promise<void> {
    this.permanentBlocks.delete(key);
    const entry = this.store.get(key);
    if (entry) entry.blockUntil = undefined;
  }

  async getStats() {
    const now = Date.now();
    const activeBuckets = Array.from(this.store.values()).filter(b => b.resetAt > now).length;
    const blockedKeys = Array.from(this.store.values()).filter(b => b.blockUntil && b.blockUntil > now).length;
    
    return {
      totalBuckets: this.store.size,
      activeBuckets,
      blockedKeys,
      permanentBlocks: this.permanentBlocks.size,
    };
  }
}

/**
 * Redis-backed storage using our enhanced Redis stub
 */
class RedisStorageCompat implements RateLimitStorage {
  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();

    // Check permanent block
    const perm = await redis.get(`block:${key}`);
    if (perm === "1") {
      return { 
        allowed: false, 
        remaining: 0, 
        limit: config.max, 
        resetAt: now + config.windowMs, 
        blocked: true, 
        blockUntil: now + 365 * 24 * 60 * 60 * 1000 
      };
    }

    const bucketKey = `rl:${key}`;
    const raw = await redis.get(bucketKey);
    let bucket = raw ? JSON.parse(raw) : null;

    if (!bucket || bucket.resetAt <= now) {
      bucket = { 
        count: 0, 
        resetAt: now + config.windowMs, 
        firstRequestAt: now,
        blockUntil: undefined
      };
    }

    // Check temporary block
    if (bucket.blockUntil && bucket.blockUntil > now) {
      return { 
        allowed: false, 
        remaining: 0, 
        limit: config.max, 
        resetAt: bucket.resetAt, 
        blocked: true, 
        blockUntil: bucket.blockUntil 
      };
    }

    bucket.count += 1;

    const ttl = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    await redis.setex(bucketKey, ttl, JSON.stringify(bucket));

    const allowed = bucket.count <= config.max;

    // Apply temporary block if limit exceeded
    if (!allowed && config.blockDuration && !bucket.blockUntil) {
      bucket.blockUntil = now + config.blockDuration;
      await redis.setex(bucketKey, ttl, JSON.stringify(bucket));
    }

    return {
      allowed,
      remaining: Math.max(config.max - bucket.count, 0),
      limit: config.max,
      resetAt: bucket.resetAt,
      blocked: !!bucket.blockUntil && bucket.blockUntil > now,
      blockUntil: bucket.blockUntil,
    };
  }

  async markSuccess(key: string): Promise<void> {
    const bucketKey = `rl:${key}`;
    const raw = await redis.get(bucketKey);
    if (!raw) return;
    
    const bucket = JSON.parse(raw);
    if (bucket.count > 0) {
      bucket.count = Math.max(0, bucket.count - 1);
      const now = Date.now();
      const ttl = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      await redis.setex(bucketKey, ttl, JSON.stringify(bucket));
    }
  }

  async getStatus(key: string, config: RateLimitConfig): Promise<RateLimitResult | null> {
    const now = Date.now();
    
    // Check permanent block
    const perm = await redis.get(`block:${key}`);
    if (perm === "1") {
      return { 
        allowed: false, 
        remaining: 0, 
        limit: config.max, 
        resetAt: now + config.windowMs, 
        blocked: true, 
        blockUntil: now + 365 * 24 * 60 * 60 * 1000 
      };
    }

    const raw = await redis.get(`rl:${key}`);
    if (!raw) return null;
    
    const bucket = JSON.parse(raw);
    const blocked = (bucket.blockUntil && bucket.blockUntil > now);
    
    return {
      allowed: bucket.count <= config.max && !blocked,
      remaining: Math.max(0, config.max - bucket.count),
      limit: config.max,
      resetAt: bucket.resetAt,
      blocked,
      blockUntil: bucket.blockUntil,
    };
  }

  async resetKey(key: string): Promise<boolean> {
    await redis.del(`block:${key}`);
    const deleted = await redis.del(`rl:${key}`);
    return deleted > 0;
  }

  async blockPermanently(key: string): Promise<void> {
    await redis.set(`block:${key}`, "1");
    console.warn(`[RateLimiter] PERMANENT BLOCK: ${key}`);
  }

  async unblock(key: string): Promise<void> {
    await redis.del(`block:${key}`);
    
    // Also clear any temporary block
    const raw = await redis.get(`rl:${key}`);
    if (raw) {
      const bucket = JSON.parse(raw);
      bucket.blockUntil = undefined;
      const now = Date.now();
      const ttl = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      await redis.setex(`rl:${key}`, ttl, JSON.stringify(bucket));
    }
  }

  async getStats() {
    const now = Date.now();
    
    try {
      const keys = await redis.keys("rl:*");
      const blockKeys = await redis.keys("block:*");
      
      let activeBuckets = 0;
      let blockedKeys = 0;
      
      // Sample some buckets for stats
      const sample = keys.slice(0, 100);
      for (const k of sample) {
        const raw = await redis.get(k);
        if (!raw) continue;
        const bucket = JSON.parse(raw);
        if (bucket.resetAt > now) activeBuckets++;
        if (bucket.blockUntil && bucket.blockUntil > now) blockedKeys++;
      }
      
      const ratio = sample.length ? activeBuckets / sample.length : 0;
      
      return {
        totalBuckets: keys.length,
        activeBuckets: Math.round(keys.length * ratio),
        blockedKeys,
        permanentBlocks: blockKeys.length,
      };
    } catch (error) {
      console.error('Redis stats error:', error);
      return {
        totalBuckets: 0,
        activeBuckets: 0,
        blockedKeys: 0,
        permanentBlocks: 0,
      };
    }
  }
}

// Factory function to create appropriate storage
function createStorage(useRedis: boolean): RateLimitStorage {
  if (useRedis && process.env.REDIS_URL) {
    return new RedisStorageCompat();
  }
  return new MemoryStorage();
}

// Main RateLimiter class
class RateLimiter {
  private storage: RateLimitStorage;
  private storageType: 'memory' | 'redis';

  constructor() {
    // Default to Redis if URL exists, otherwise memory
    const defaultUseRedis = !!process.env.REDIS_URL;
    this.storageType = defaultUseRedis ? 'redis' : 'memory';
    this.storage = createStorage(defaultUseRedis);
  }

  async check(key: string, config: RateLimitConfig = RATE_LIMIT_CONFIGS.API_READ): Promise<RateLimitResult> {
    // Use configured storage preference or default
    const useRedis = config.useRedis ?? this.storageType === 'redis';
    
    if (useRedis !== (this.storageType === 'redis')) {
      this.storage = createStorage(useRedis);
      this.storageType = useRedis ? 'redis' : 'memory';
    }
    
    return this.storage.check(key, config);
  }

  async markSuccess(key: string): Promise<void> {
    return this.storage.markSuccess(key);
  }

  async getStatus(key: string, config: RateLimitConfig = RATE_LIMIT_CONFIGS.API_READ): Promise<RateLimitResult | null> {
    return this.storage.getStatus(key, config);
  }

  async resetKey(key: string): Promise<boolean> {
    return this.storage.resetKey(key);
  }

  async blockPermanently(key: string): Promise<void> {
    return this.storage.blockPermanently(key);
  }

  async unblock(key: string): Promise<void> {
    return this.storage.unblock(key);
  }

  async getStats() {
    return this.storage.getStats();
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null;

function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}

// Public API
export async function rateLimitAsync(key: string, config?: RateLimitConfig): Promise<RateLimitResult> {
  const limiter = getRateLimiter();
  return limiter.check(key, config || RATE_LIMIT_CONFIGS.API_READ);
}

// Alias for backward compatibility
export const rateLimit = rateLimitAsync;

export async function markRequestSuccess(key: string): Promise<void> {
  const limiter = getRateLimiter();
  return limiter.markSuccess(key);
}

export async function getRateLimitStatus(key: string, config?: RateLimitConfig): Promise<RateLimitResult | null> {
  const limiter = getRateLimiter();
  return limiter.getStatus(key, config || RATE_LIMIT_CONFIGS.API_READ);
}

export async function resetRateLimit(key: string): Promise<boolean> {
  const limiter = getRateLimiter();
  return limiter.resetKey(key);
}

export async function blockPermanently(key: string): Promise<void> {
  const limiter = getRateLimiter();
  return limiter.blockPermanently(key);
}

export async function unblock(key: string): Promise<void> {
  const limiter = getRateLimiter();
  return limiter.unblock(key);
}

export async function getRateLimiterStats() {
  const limiter = getRateLimiter();
  return limiter.getStats();
}

// Helper for HTTP Headers
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
  };
  
  if (result.blocked && result.blockUntil) {
    headers["X-RateLimit-Blocked-Until"] = new Date(result.blockUntil).toISOString();
    headers["Retry-After"] = String(Math.ceil((result.blockUntil - Date.now()) / 1000));
  }
  
  return headers;
}

// IP Utilities
export function isValidIp(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  
  const cleanIp = (ip.split(':')[0] || '').trim();
  if (!cleanIp) return false;
  
  // IPv4
  const ipv4Regex = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  if (ipv4Regex.test(cleanIp)) return true;
  
  // IPv6
  if (cleanIp.includes(':')) {
    const ipWithoutScope = (cleanIp.split('%')[0] || ''); 
    const parts = ipWithoutScope.split(':');
    
    const lastPart = parts[parts.length - 1];

    if (parts.length >= 2 && lastPart && lastPart.includes('.')) {
      return ipv4Regex.test(lastPart);
    }
    
    if (parts.length > 8) return false;
    return parts.every(part => part === '' || /^[0-9a-fA-F]{1,4}$/.test(part));
  }
  
  return false;
}

export function anonymizeIp(ip: string): string {
  if (!isValidIp(ip) || ip === 'unknown') return 'unknown';
  
  const cleanIp = (ip.split(':')[0] || '').trim();
  
  if (cleanIp.includes(':')) {
    const parts = cleanIp.split(':');
    if (parts.length <= 3) return cleanIp;
    return `${parts.slice(0, Math.min(2, parts.length)).join(':')}::`;
  }
  
  const parts = cleanIp.split('.');
  if (parts.length !== 4) return cleanIp;
  return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
}

export function getClientIpFromRequest(req: { 
  headers?: Record<string, string | string[] | undefined>; 
  socket?: { remoteAddress?: string }; 
  connection?: { remoteAddress?: string };
}): string {
  const headers = req.headers || {};
  const headerKeys = ['cf-connecting-ip', 'x-client-ip', 'x-forwarded-for', 'x-real-ip', 'forwarded-for'];
  
  for (const key of headerKeys) {
    const value = headers[key];
    if (value) {
      const firstVal = Array.isArray(value) ? (value[0] || '') : value.toString();
      const ip = (firstVal.split(',')[0] || '').trim();
      if (ip && isValidIp(ip)) return ip;
    }
  }
  
  const remote = req.socket?.remoteAddress || req.connection?.remoteAddress;
  if (remote && isValidIp(remote)) return remote;
  
  return 'unknown';
}

export function generateRateLimitKey(prefix: string, identifier: string, req?: any): string {
  let key = `${prefix}_${identifier}`;
  if (req) {
    const ip = getClientIpFromRequest(req);
    if (ip && ip !== 'unknown') {
      key = `${prefix}_${anonymizeIp(ip)}_${identifier}`;
    }
  }
  return key;
}

export async function checkRateLimit(req: any, res: any, config: RateLimitConfig = RATE_LIMIT_CONFIGS.API_READ) {
  const ip = getClientIpFromRequest(req);
  const key = generateRateLimitKey(config.keyPrefix || 'default', ip, req);
  const result = await rateLimitAsync(key, config);
  
  const headers = createRateLimitHeaders(result);
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  
  return { allowed: result.allowed, headers, result };
}

// Backoff wrapper alias
export const rateLimitWithBackoff = rateLimitAsync; 

// Helpers for unified import
export const getRateLimitKeys = (req: any, prefix = "global") => {
  const ip = getClientIpFromRequest(req);
  return [`${prefix}:${ip}`];
};

export const checkMultipleRateLimits = async (keys: string[], config: RateLimitConfig) => {
  let worstResult: RateLimitResult | null = null;
  for (const key of keys) {
    const res = await rateLimitAsync(key, config);
    if (!worstResult || (!res.allowed && worstResult.allowed) || (res.remaining < worstResult.remaining)) {
      worstResult = res;
    }
  }
  return { worstResult: worstResult! };
};

export const getClientIp = getClientIpFromRequest;

// Middleware for Next.js API routes
export function withRateLimit(config: RateLimitConfig = RATE_LIMIT_CONFIGS.API_READ) {
  return async function handler(req: any, res: any, next?: any) {
    try {
      const { allowed, headers, result } = await checkRateLimit(req, res, config);
      
      if (!allowed) {
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: result.blockUntil ? Math.ceil((result.blockUntil - Date.now()) / 1000) : undefined
        });
        return;
      }
      
      if (next) {
        next();
      }
    } catch (error) {
      console.error('[RateLimit] Error:', error);
      // On error, allow the request (fail open for security)
      if (next) {
        next();
      }
    }
  };
}

export default {
  rateLimitAsync,
  rateLimit,
  markRequestSuccess,
  createRateLimitHeaders,
  getRateLimitStatus,
  resetRateLimit,
  blockPermanently,
  unblock,
  getRateLimiterStats,
  getClientIpFromRequest,
  isValidIp,
  anonymizeIp,
  generateRateLimitKey,
  checkRateLimit,
  withRateLimit,
  RATE_LIMIT_CONFIGS,
  getClientIp,
  getRateLimitKeys,
  checkMultipleRateLimits,
  rateLimitWithBackoff
};