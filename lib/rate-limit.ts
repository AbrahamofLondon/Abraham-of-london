// lib/rate-limit.ts
// Comprehensive rate limiting with enhanced security features

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  blockDuration?: number;
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
  API_READ: { windowMs: 60_000, max: 60, keyPrefix: "api_read" },
  API_WRITE: { windowMs: 60_000, max: 30, keyPrefix: "api_write", skipSuccessfulRequests: true },
  CONTENT_API: { windowMs: 60_000, max: 30, keyPrefix: "content" },
  SHORTS_INTERACTIONS: { windowMs: 60_000, max: 30, keyPrefix: "shorts_interactions" },
  TEASER_REQUEST: { windowMs: 60_000, max: 5, keyPrefix: "teaser" },
  NEWSLETTER_SUBSCRIBE: { windowMs: 60_000, max: 5, keyPrefix: "newsletter", blockDuration: 300_000 },
  AUTH_LOGIN: { windowMs: 15 * 60_000, max: 5, keyPrefix: "auth_login", skipSuccessfulRequests: true, blockDuration: 900_000 },
  AUTH_REGISTER: { windowMs: 60 * 60_000, max: 3, keyPrefix: "auth_register", blockDuration: 3600_000 },
  INNER_CIRCLE_REGISTER: { windowMs: 15 * 60_000, max: 3, keyPrefix: "inner_circle_register_ip", blockDuration: 900_000 },
  INNER_CIRCLE_REGISTER_EMAIL: { windowMs: 60 * 60_000, max: 2, keyPrefix: "inner_circle_register_email", blockDuration: 3600_000 },
  INNER_CIRCLE_UNLOCK: { windowMs: 60_000, max: 10, keyPrefix: "inner_circle_unlock", skipSuccessfulRequests: true, blockDuration: 300_000 },
  ADMIN_OPERATIONS: { windowMs: 60_000, max: 30, keyPrefix: "admin" },
  INNER_CIRCLE_ADMIN_EXPORT: { windowMs: 5 * 60_000, max: 5, keyPrefix: "inner_circle_admin_export" },
  CONTACT_FORM: { windowMs: 60_000, max: 3, keyPrefix: "contact", blockDuration: 600_000 },
  DOWNLOADS: { windowMs: 60_000, max: 10, keyPrefix: "downloads" },
  WEBHOOK_RECEIVE: { windowMs: 60_000, max: 100, keyPrefix: "webhook" },
  CACHE_BUST: { windowMs: 10_000, max: 5, keyPrefix: "cache" },
  SUSPICIOUS_ACTIVITY: { windowMs: 60_000, max: 2, keyPrefix: "suspicious", blockDuration: 3600_000 },
} as const;

type Bucket = {
  count: number;
  resetAt: number;
  firstRequestAt: number;
  blockUntil?: number;
  suspiciousActivity?: boolean;
};

class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private blockedIps = new Set<string>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredBuckets();
    }, 60_000);
  }

  private cleanupExpiredBuckets(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now && (!bucket.blockUntil || bucket.blockUntil <= now)) {
        this.buckets.delete(key);
      }
    }
  }

  isBlocked(key: string): boolean {
    if (this.blockedIps.has(key)) return true;
    const bucket = this.buckets.get(key);
    if (bucket?.blockUntil) {
      if (bucket.blockUntil > Date.now()) return true;
      bucket.blockUntil = undefined;
    }
    return false;
  }

  blockPermanently(key: string): void {
    this.blockedIps.add(key);
    console.warn(`[RateLimiter] PERMANENT BLOCK: ${key}`);
  }

  unblock(key: string): void {
    this.blockedIps.delete(key);
    const bucket = this.buckets.get(key);
    if (bucket) bucket.blockUntil = undefined;
  }

  checkSync(key: string, config: RateLimitConfig = RATE_LIMIT_CONFIGS.API_READ): RateLimitResult {
    const now = Date.now();

    if (this.isBlocked(key)) {
      const bucket = this.buckets.get(key);
      return {
        allowed: false,
        remaining: 0,
        limit: config.max,
        resetAt: bucket?.resetAt || now + config.windowMs,
        blocked: true,
        blockUntil: bucket?.blockUntil,
      };
    }

    let bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + config.windowMs, firstRequestAt: now };
    }

    bucket.count += 1;
    this.buckets.set(key, bucket);

    const allowed = bucket.count <= config.max;
    
    if (!allowed && config.blockDuration && !bucket.blockUntil) {
      bucket.blockUntil = now + config.blockDuration;
    }

    return {
      allowed,
      remaining: Math.max(config.max - bucket.count, 0),
      limit: config.max,
      resetAt: bucket.resetAt,
      blocked: !!bucket.blockUntil,
      blockUntil: bucket.blockUntil,
    };
  }

  // Async alias for compatibility
  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    return this.checkSync(key, config);
  }

  markSuccess(key: string): void {
    const bucket = this.buckets.get(key);
    if (bucket && bucket.count > 0) bucket.count = Math.max(0, bucket.count - 1);
  }

  getStatus(key: string): RateLimitResult | null {
    const bucket = this.buckets.get(key);
    if (!bucket) return null;
    const config = Object.values(RATE_LIMIT_CONFIGS).find(c => c.keyPrefix && key.startsWith(c.keyPrefix)) || RATE_LIMIT_CONFIGS.API_READ;
    return {
      allowed: bucket.count <= config.max && !this.isBlocked(key),
      remaining: Math.max(0, config.max - bucket.count),
      limit: config.max,
      resetAt: bucket.resetAt,
      blocked: this.isBlocked(key),
      blockUntil: bucket.blockUntil,
    };
  }

  resetKey(key: string): boolean {
    this.blockedIps.delete(key);
    return this.buckets.delete(key);
  }

  getStats() {
    return {
      totalBuckets: this.buckets.size,
      activeBuckets: Array.from(this.buckets.values()).filter(b => b.resetAt > Date.now()).length,
      blockedKeys: Array.from(this.buckets.values()).filter(b => b.blockUntil && b.blockUntil > Date.now()).length,
      permanentBlocks: this.blockedIps.size,
    };
  }

  destroy(): void {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.buckets.clear();
    this.blockedIps.clear();
  }
}

const rateLimiter = new RateLimiter();

export async function rateLimitAsync(key: string, config?: RateLimitConfig): Promise<RateLimitResult> {
  return rateLimiter.check(key, config || RATE_LIMIT_CONFIGS.API_READ);
}

export function rateLimit(key: string, config?: RateLimitConfig): RateLimitResult {
  return rateLimiter.checkSync(key, config || RATE_LIMIT_CONFIGS.API_READ);
}

export function markRequestSuccess(key: string): void { rateLimiter.markSuccess(key); }
export function getRateLimitStatus(key: string) { return rateLimiter.getStatus(key); }
export function resetRateLimit(key: string) { return rateLimiter.resetKey(key); }
export function blockPermanently(key: string) { rateLimiter.blockPermanently(key); }
export function unblock(key: string) { rateLimiter.unblock(key); }
export function getRateLimiterStats() { return rateLimiter.getStats(); }

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
    
    // FIX: Safely access the last element
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
  const result = rateLimiter.checkSync(key, config);
  
  const headers = createRateLimitHeaders(result);
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  
  return { allowed: result.allowed, headers, result };
}

// Backoff wrapper alias
export const rateLimitWithBackoff = rateLimit; 

// Helpers for unified import
export const getRateLimitKeys = (req: any, prefix = "global") => {
  const ip = getClientIpFromRequest(req);
  return [`${prefix}:${ip}`];
};

export const checkMultipleRateLimits = (keys: string[], config: RateLimitConfig) => {
  let worstResult: RateLimitResult | null = null;
  for (const key of keys) {
    const res = rateLimiter.checkSync(key, config);
    if (!worstResult || (!res.allowed && worstResult.allowed) || (res.remaining < worstResult.remaining)) {
      worstResult = res;
    }
  }
  return { worstResult: worstResult! };
};

export const getClientIp = getClientIpFromRequest;

if (typeof process !== 'undefined') {
  const cleanup = () => rateLimiter.destroy();
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
  process.on('beforeExit', cleanup);
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
  RATE_LIMIT_CONFIGS,
  // Unified export aliases
  getClientIp,
  getRateLimitKeys,
  checkMultipleRateLimits,
  rateLimitWithBackoff
};
