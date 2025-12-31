// lib/rate-limit.ts
// Comprehensive rate limiting with enhanced security features

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix?: string;
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  blockDuration?: number; // Optional: block duration after limit exceeded (ms)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  blocked?: boolean; // If temporarily blocked
  blockUntil?: number; // When block expires
}

export const RATE_LIMIT_CONFIGS = {
  // General API endpoints
  API_READ: {
    windowMs: 60_000,
    max: 60,
    keyPrefix: "api_read",
  },
  API_WRITE: {
    windowMs: 60_000,
    max: 30,
    keyPrefix: "api_write",
    skipSuccessfulRequests: true, // Only count failed writes
  },
  
  // Content API
  CONTENT_API: {
    windowMs: 60_000,
    max: 30,
    keyPrefix: "content",
  },
  
  // Shorts interactions
  SHORTS_INTERACTIONS: {
    windowMs: 60_000,
    max: 30,
    keyPrefix: "shorts_interactions",
  },
  
  // Teaser system
  TEASER_REQUEST: {
    windowMs: 60_000,
    max: 5,
    keyPrefix: "teaser",
  },
  
  // Newsletter
  NEWSLETTER_SUBSCRIBE: {
    windowMs: 60_000,
    max: 5,
    keyPrefix: "newsletter",
    blockDuration: 300_000, // 5 min block after exceeding
  },
  
  // Authentication - more strict
  AUTH_LOGIN: {
    windowMs: 15 * 60_000,
    max: 5,
    keyPrefix: "auth_login",
    skipSuccessfulRequests: true, // Only count failed login attempts
    blockDuration: 900_000, // 15 min block after 5 failed attempts
  },
  AUTH_REGISTER: {
    windowMs: 60 * 60_000,
    max: 3,
    keyPrefix: "auth_register",
    blockDuration: 3600_000, // 1 hour block
  },
  
  // Inner Circle - enhanced security
  INNER_CIRCLE_REGISTER: {
    windowMs: 15 * 60_000,
    max: 3,
    keyPrefix: "inner_circle_register_ip",
    blockDuration: 900_000, // 15 min block
  },
  INNER_CIRCLE_REGISTER_EMAIL: {
    windowMs: 60 * 60_000,
    max: 2,
    keyPrefix: "inner_circle_register_email",
    blockDuration: 3600_000, // 1 hour block
  },
  INNER_CIRCLE_UNLOCK: {
    windowMs: 60_000,
    max: 10,
    keyPrefix: "inner_circle_unlock",
    skipSuccessfulRequests: true, // Only count failed attempts
    blockDuration: 300_000, // 5 min block after exceeding
  },
  
  // Admin operations
  ADMIN_OPERATIONS: {
    windowMs: 60_000,
    max: 30,
    keyPrefix: "admin",
  },
  INNER_CIRCLE_ADMIN_EXPORT: {
    windowMs: 5 * 60_000,
    max: 5,
    keyPrefix: "inner_circle_admin_export",
  },
  
  // Contact forms - prevent spam
  CONTACT_FORM: {
    windowMs: 60_000,
    max: 3,
    keyPrefix: "contact",
    blockDuration: 600_000, // 10 min block
  },
  
  // Downloads
  DOWNLOADS: {
    windowMs: 60_000,
    max: 10,
    keyPrefix: "downloads",
  },
  
  // Webhooks
  WEBHOOK_RECEIVE: {
    windowMs: 60_000,
    max: 100,
    keyPrefix: "webhook",
  },
  
  // Cache busting
  CACHE_BUST: {
    windowMs: 10_000,
    max: 5,
    keyPrefix: "cache",
  },
  
  // Suspicious activity detection
  SUSPICIOUS_ACTIVITY: {
    windowMs: 60_000,
    max: 2,
    keyPrefix: "suspicious",
    blockDuration: 3600_000, // 1 hour block
  },
} as const;

type Bucket = {
  count: number;
  resetAt: number;
  firstRequestAt: number;
  blockUntil?: number; // Temporary block
  suspiciousActivity?: boolean;
};

class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private blockedIps = new Set<string>(); // Permanent blocks
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredBuckets();
    }, 60_000);
  }

  private cleanupExpiredBuckets(): void {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, bucket] of this.buckets.entries()) {
      // Remove if reset time passed and not blocked
      if (bucket.resetAt <= now && (!bucket.blockUntil || bucket.blockUntil <= now)) {
        this.buckets.delete(key);
        removed++;
      }
    }
    
    if (removed > 0 && process.env.NODE_ENV === 'development') {
      console.debug(`[RateLimiter] Cleaned up ${removed} expired buckets`);
    }
  }

  isBlocked(key: string): boolean {
    // Check permanent blocks
    if (this.blockedIps.has(key)) {
      return true;
    }

    // Check temporary blocks
    const bucket = this.buckets.get(key);
    if (bucket?.blockUntil) {
      const now = Date.now();
      if (bucket.blockUntil > now) {
        return true;
      }
      // Block expired, clear it
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
    if (bucket) {
      bucket.blockUntil = undefined;
    }
  }

  async check(
    key: string,
    config: RateLimitConfig = RATE_LIMIT_CONFIGS.API_READ
  ): Promise<RateLimitResult> {
    const now = Date.now();

    // Check if blocked
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

    const existing = this.buckets.get(key);
    let bucket: Bucket;

    if (!existing || existing.resetAt <= now) {
      bucket = {
        count: 0,
        resetAt: now + config.windowMs,
        firstRequestAt: now,
      };
    } else {
      bucket = existing;
    }

    bucket.count += 1;
    this.buckets.set(key, bucket);

    const allowed = bucket.count <= config.max;
    const remaining = Math.max(config.max - bucket.count, 0);

    // Apply block if limit exceeded and blockDuration configured
    if (!allowed && config.blockDuration && !bucket.blockUntil) {
      bucket.blockUntil = now + config.blockDuration;
      console.warn(
        `[RateLimiter] BLOCKED: ${key} (${config.keyPrefix}) until ${new Date(bucket.blockUntil).toISOString()}`
      );
    }

    return {
      allowed,
      remaining,
      limit: config.max,
      resetAt: bucket.resetAt,
      blocked: !!bucket.blockUntil,
      blockUntil: bucket.blockUntil,
    };
  }

  checkSync(
    key: string,
    config: RateLimitConfig = RATE_LIMIT_CONFIGS.API_READ
  ): RateLimitResult {
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

    const existing = this.buckets.get(key);
    let bucket: Bucket;

    if (!existing || existing.resetAt <= now) {
      bucket = {
        count: 0,
        resetAt: now + config.windowMs,
        firstRequestAt: now,
      };
    } else {
      bucket = existing;
    }

    bucket.count += 1;
    this.buckets.set(key, bucket);

    const allowed = bucket.count <= config.max;
    const remaining = Math.max(config.max - bucket.count, 0);

    if (!allowed && config.blockDuration && !bucket.blockUntil) {
      bucket.blockUntil = now + config.blockDuration;
    }

    return {
      allowed,
      remaining,
      limit: config.max,
      resetAt: bucket.resetAt,
      blocked: !!bucket.blockUntil,
      blockUntil: bucket.blockUntil,
    };
  }

  markSuccess(key: string): void {
    const bucket = this.buckets.get(key);
    if (bucket && bucket.count > 0) {
      bucket.count = Math.max(0, bucket.count - 1);
    }
  }

  getStatus(key: string): RateLimitResult | null {
    const bucket = this.buckets.get(key);
    if (!bucket) return null;

    const now = Date.now();
    if (bucket.resetAt <= now && !bucket.blockUntil) return null;

    const config = Object.values(RATE_LIMIT_CONFIGS).find(
      c => c.keyPrefix && key.startsWith(c.keyPrefix)
    ) || RATE_LIMIT_CONFIGS.API_READ;

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

  getStats(): {
    totalBuckets: number;
    activeBuckets: number;
    blockedKeys: number;
    permanentBlocks: number;
  } {
    const now = Date.now();
    let activeBuckets = 0;
    let blockedKeys = 0;

    for (const [, bucket] of this.buckets.entries()) {
      if (bucket.resetAt > now) {
        activeBuckets++;
      }
      if (bucket.blockUntil && bucket.blockUntil > now) {
        blockedKeys++;
      }
    }

    return {
      totalBuckets: this.buckets.size,
      activeBuckets,
      blockedKeys,
      permanentBlocks: this.blockedIps.size,
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.buckets.clear();
    this.blockedIps.clear();
  }
}

const rateLimiter = new RateLimiter();

export async function rateLimitAsync(
  key: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.API_READ
): Promise<RateLimitResult> {
  return rateLimiter.check(key, config);
}

export function rateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.API_READ
): RateLimitResult {
  return rateLimiter.checkSync(key, config);
}

export function markRequestSuccess(key: string): void {
  rateLimiter.markSuccess(key);
}

export function createRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
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

export function getRateLimitStatus(key: string): RateLimitResult | null {
  return rateLimiter.getStatus(key);
}

export function resetRateLimit(key: string): boolean {
  return rateLimiter.resetKey(key);
}

export function blockPermanently(key: string): void {
  rateLimiter.blockPermanently(key);
}

export function unblock(key: string): void {
  rateLimiter.unblock(key);
}

export function getRateLimiterStats() {
  return rateLimiter.getStats();
}

// FIXED: Make headers optional to match usage
export function getClientIpFromRequest(req: { 
  headers?: Record<string, string | string[] | undefined>; // Made optional
  socket?: { remoteAddress?: string };
  connection?: { remoteAddress?: string };
}): string {
  // Handle missing headers
  const headers = req.headers || {};
  
  const headerKeys = [
    'cf-connecting-ip',
    'x-client-ip',
    'x-forwarded-for',
    'x-real-ip',
    'forwarded-for',
  ];
  
  for (const header of headerKeys) {
    const value = headers[header];
    if (value) {
      const ip = Array.isArray(value) 
        ? value[0]?.split(',')[0]?.trim()
        : value.toString().split(',')[0]?.trim();
      
      if (ip && isValidIp(ip)) {
        return ip;
      }
    }
  }
  
  const socket = req.socket || req.connection;
  const remoteAddress = socket?.remoteAddress;
  
  if (remoteAddress && isValidIp(remoteAddress)) {
    return remoteAddress;
  }
  
  return 'unknown';
}

export function isValidIp(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  
  const cleanIp = ip.split(':')[0];
  
  // IPv4
  const ipv4Regex = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  if (ipv4Regex.test(cleanIp)) return true;
  
  // IPv6
  if (cleanIp.includes(':')) {
    const ipWithoutScope = cleanIp.split('%')[0];
    const parts = ipWithoutScope.split(':');
    
    if (parts.length >= 2 && parts[parts.length - 1].includes('.')) {
      return ipv4Regex.test(parts[parts.length - 1]);
    }
    
    if (parts.length > 8) return false;
    return parts.every(part => 
      part === '' || /^[0-9a-fA-F]{1,4}$/.test(part)
    );
  }
  
  return false;
}

export function anonymizeIp(ip: string): string {
  if (!isValidIp(ip) || ip === 'unknown') return 'unknown';
  
  const cleanIp = ip.split(':')[0];
  
  if (cleanIp.includes(':')) {
    const parts = cleanIp.split(':');
    if (parts.length <= 3) return cleanIp;
    return `${parts.slice(0, Math.min(2, parts.length)).join(':')}::`;
  }
  
  const parts = cleanIp.split('.');
  if (parts.length !== 4) return cleanIp;
  return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
}

// FIXED: Properly handle optional request object
export function generateRateLimitKey(
  prefix: string,
  identifier: string,
  req?: { headers?: Record<string, string | string[] | undefined> }
): string {
  let key = `${prefix}_${identifier}`;
  
  if (req) {
    const ip = getClientIpFromRequest(req);
    if (ip && ip !== 'unknown') {
      const anonymizedIp = anonymizeIp(ip);
      key = `${prefix}_${anonymizedIp}_${identifier}`;
    }
  }
  
  return key;
}

export async function checkRateLimit(
  req: any,
  res: any,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.API_READ
): Promise<{ allowed: boolean; headers?: Record<string, string>; result?: RateLimitResult }> {
  const ip = getClientIpFromRequest(req);
  const key = generateRateLimitKey(config.keyPrefix || 'default', ip, req);
  
  try {
    const result = await rateLimitAsync(key, config);
    const headers = createRateLimitHeaders(result);
    
    // Set headers on response
    Object.entries(headers).forEach(([k, v]) => {
      res.setHeader(k, v);
    });
    
    if (!result.allowed) {
      console.warn(`[RateLimit] BLOCKED: ${ip} (${config.keyPrefix})`);
      return { allowed: false, headers, result };
    }
    
    return { allowed: true, headers, result };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: true };
  }
}

// Cleanup on process exit
if (typeof process !== 'undefined') {
  const cleanup = () => {
    rateLimiter.destroy();
  };
  
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
};
