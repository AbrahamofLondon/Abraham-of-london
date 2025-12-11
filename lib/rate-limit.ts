// lib/rate-limit.ts
// Comprehensive rate limiting for all API endpoints

export interface RateLimitConfig {
  windowMs: number; // time window in milliseconds
  max: number;      // maximum requests per window
  keyPrefix?: string; // optional prefix for logging/identification
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number; // epoch ms
}

export const RATE_LIMIT_CONFIGS = {
  // General API endpoints
  API_READ: {
    windowMs: 60_000, // 1 minute
    max: 60,          // 60 requests/minute
    keyPrefix: "api_read",
  },
  API_WRITE: {
    windowMs: 60_000, // 1 minute
    max: 30,          // 30 requests/minute
    keyPrefix: "api_write",
  },
  
  // Content API
  CONTENT_API: {
    windowMs: 60_000, // 1 minute
    max: 30,          // 30 requests/minute for content API
    keyPrefix: "content",
  },
  
  // NEW: Shorts interactions
  SHORTS_INTERACTIONS: {
    windowMs: 60_000, // 1 minute
    max: 30,          // 30 interaction requests/minute
    keyPrefix: "shorts_interactions",
  },
  
  // Teaser system
  TEASER_REQUEST: {
    windowMs: 60_000, // 1 minute
    max: 5,           // 5 requests/minute
    keyPrefix: "teaser",
  },
  
  // Newsletter
  NEWSLETTER_SUBSCRIBE: {
    windowMs: 60_000, // 1 minute
    max: 5,           // 5 requests/minute
    keyPrefix: "newsletter",
  },
  
  // Authentication
  AUTH_LOGIN: {
    windowMs: 15 * 60_000, // 15 minutes
    max: 5,                 // 5 attempts/15 minutes
    keyPrefix: "auth_login",
  },
  AUTH_REGISTER: {
    windowMs: 60 * 60_000, // 1 hour
    max: 3,                 // 3 registrations/hour
    keyPrefix: "auth_register",
  },
  
  // Inner Circle
  INNER_CIRCLE_REGISTER: {
    windowMs: 15 * 60_000, // 15 minutes
    max: 3,                 // 3 registrations/15 minutes per IP
    keyPrefix: "inner_circle_register_ip",
  },
  INNER_CIRCLE_REGISTER_EMAIL: {
    windowMs: 60 * 60_000, // 1 hour
    max: 2,                 // 2 registrations/hour per email
    keyPrefix: "inner_circle_register_email",
  },
  INNER_CIRCLE_UNLOCK: {
    windowMs: 60_000, // 1 minute
    max: 10,          // 10 unlock attempts/minute
    keyPrefix: "inner_circle_unlock",
  },
  
  // Admin operations
  ADMIN_OPERATIONS: {
    windowMs: 60_000, // 1 minute
    max: 30,          // 30 operations/minute
    keyPrefix: "admin",
  },
  INNER_CIRCLE_ADMIN_EXPORT: {
    windowMs: 5 * 60_000, // 5 minutes
    max: 5,                // 5 exports/5 minutes
    keyPrefix: "inner_circle_admin_export",
  },
  
  // Contact forms
  CONTACT_FORM: {
    windowMs: 60_000, // 1 minute
    max: 3,           // 3 messages/minute
    keyPrefix: "contact",
  },
  
  // Downloads
  DOWNLOADS: {
    windowMs: 60_000, // 1 minute
    max: 10,          // 10 downloads/minute
    keyPrefix: "downloads",
  },
  
  // Webhooks
  WEBHOOK_RECEIVE: {
    windowMs: 60_000, // 1 minute
    max: 100,         // 100 webhooks/minute
    keyPrefix: "webhook",
  },
  
  // Cache busting/development
  CACHE_BUST: {
    windowMs: 10_000, // 10 seconds
    max: 5,           // 5 requests/10 seconds
    keyPrefix: "cache",
  },
} as const;

type Bucket = {
  count: number;
  resetAt: number;
  firstRequestAt: number;
};

class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired buckets every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredBuckets();
    }, 60_000);
  }

  private cleanupExpiredBuckets(): void {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
        removed++;
      }
    }
    
    if (removed > 0 && process.env.NODE_ENV === 'development') {
      console.debug(`[RateLimiter] Cleaned up ${removed} expired buckets`);
    }
  }

  async check(
    key: string,
    config: RateLimitConfig = RATE_LIMIT_CONFIGS.API_READ
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const existing = this.buckets.get(key);

    let bucket: Bucket;

    if (!existing || existing.resetAt <= now) {
      // Create new bucket
      bucket = {
        count: 0,
        resetAt: now + config.windowMs,
        firstRequestAt: now,
      };
    } else {
      bucket = existing;
    }

    // Increment count
    bucket.count += 1;
    this.buckets.set(key, bucket);

    const allowed = bucket.count <= config.max;
    const remaining = Math.max(config.max - bucket.count, 0);

    return {
      allowed,
      remaining,
      limit: config.max,
      resetAt: bucket.resetAt,
    };
  }

  checkSync(
    key: string,
    config: RateLimitConfig = RATE_LIMIT_CONFIGS.API_READ
  ): RateLimitResult {
    const now = Date.now();
    const existing = this.buckets.get(key);

    let bucket: Bucket;

    if (!existing || existing.resetAt <= now) {
      // Create new bucket
      bucket = {
        count: 0,
        resetAt: now + config.windowMs,
        firstRequestAt: now,
      };
    } else {
      bucket = existing;
    }

    // Increment count
    bucket.count += 1;
    this.buckets.set(key, bucket);

    const allowed = bucket.count <= config.max;
    const remaining = Math.max(config.max - bucket.count, 0);

    return {
      allowed,
      remaining,
      limit: config.max,
      resetAt: bucket.resetAt,
    };
  }

  getStatus(key: string): RateLimitResult | null {
    const bucket = this.buckets.get(key);
    if (!bucket) return null;

    const now = Date.now();
    if (bucket.resetAt <= now) return null;

    const config = Object.values(RATE_LIMIT_CONFIGS).find(
      c => c.keyPrefix && key.startsWith(c.keyPrefix)
    ) || RATE_LIMIT_CONFIGS.API_READ;

    return {
      allowed: bucket.count <= config.max,
      remaining: Math.max(0, config.max - bucket.count),
      limit: config.max,
      resetAt: bucket.resetAt,
    };
  }

  resetKey(key: string): boolean {
    return this.buckets.delete(key);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.buckets.clear();
  }
}

// Singleton instance
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

export function createRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)), // seconds
  };
}

export function getRateLimitStatus(key: string): RateLimitResult | null {
  return rateLimiter.getStatus(key);
}

export function resetRateLimit(key: string): boolean {
  return rateLimiter.resetKey(key);
}

export function getClientIpFromRequest(req: { 
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
  connection?: { remoteAddress?: string };
}): string {
  // Check common proxy headers
  const headers = [
    'cf-connecting-ip',     // Cloudflare
    'x-client-ip',         // AWS/GCP
    'x-forwarded-for',     // Standard proxy header
    'x-real-ip',          // Nginx
    'forwarded-for',      // RFC 7239
  ];
  
  for (const header of headers) {
    const value = req.headers[header];
    if (value) {
      const ip = Array.isArray(value) 
        ? value[0]?.split(',')[0]?.trim()
        : value.toString().split(',')[0]?.trim();
      
      if (ip && isValidIp(ip)) {
        return ip;
      }
    }
  }
  
  // Fallback to socket address
  const socket = req.socket || req.connection;
  const remoteAddress = socket?.remoteAddress;
  
  if (remoteAddress && isValidIp(remoteAddress)) {
    return remoteAddress;
  }
  
  return 'unknown';
}

export function isValidIp(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  
  // Remove port if present
  const cleanIp = ip.split(':')[0];
  
  // IPv4
  const ipv4Regex = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  if (ipv4Regex.test(cleanIp)) return true;
  
  // IPv6 (simplified)
  if (cleanIp.includes(':')) {
    // Handle IPv6 with scope
    const ipWithoutScope = cleanIp.split('%')[0];
    const parts = ipWithoutScope.split(':');
    
    // Check for IPv4-mapped IPv6
    if (parts.length >= 2 && parts[parts.length - 1].includes('.')) {
      const lastPart = parts[parts.length - 1];
      return ipv4Regex.test(lastPart);
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
  
  // Remove port
  const cleanIp = ip.split(':')[0];
  
  // IPv6
  if (cleanIp.includes(':')) {
    const parts = cleanIp.split(':');
    if (parts.length <= 3) return cleanIp;
    // Anonymize last 80 bits for IPv6
    return `${parts.slice(0, Math.min(2, parts.length)).join(':')}::`;
  }
  
  // IPv4 - anonymize last octet
  const parts = cleanIp.split('.');
  if (parts.length !== 4) return cleanIp;
  return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
}

export function generateRateLimitKey(
  prefix: string,
  identifier: string,
  req?: { headers?: Record<string, string | string[] | undefined> }
): string {
  let key = `${prefix}_${identifier}`;
  
  // Add IP if available for additional identification
  if (req) {
    const ip = getClientIpFromRequest(req);
    if (ip && ip !== 'unknown') {
      const anonymizedIp = anonymizeIp(ip);
      key = `${prefix}_${anonymizedIp}_${identifier}`;
    }
  }
  
  return key;
}

// Helper function for API routes
export async function checkRateLimit(
  req: any,
  res: any,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.API_READ
): Promise<{ allowed: boolean; headers?: Record<string, string> }> {
  const ip = getClientIpFromRequest(req);
  const key = generateRateLimitKey(config.keyPrefix || 'default', ip, req);
  
  try {
    const result = await rateLimitAsync(key, config);
    
    // Add rate limit headers to response
    const headers = createRateLimitHeaders(result);
    
    if (!result.allowed) {
      res.setHeader('Retry-After', Math.ceil((result.resetAt - Date.now()) / 1000));
      return { allowed: false, headers };
    }
    
    return { allowed: true, headers };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Allow request if rate limiting fails
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
  createRateLimitHeaders,
  getRateLimitStatus,
  resetRateLimit,
  getClientIpFromRequest,
  isValidIp,
  anonymizeIp,
  generateRateLimitKey,
  checkRateLimit,
  RATE_LIMIT_CONFIGS,
};