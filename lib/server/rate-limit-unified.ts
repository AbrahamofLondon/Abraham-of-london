// lib/server/rate-limit-unified.ts - Canonical rate limiting module
import type { NextApiRequest } from 'next';
import type { NextRequest } from 'next/server';

// ==================== RATE LIMIT TYPES ====================
export type RateLimitOptions = {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterMs: number;
  resetTime: number;
  windowMs: number;
};

// ==================== DEFAULT CONFIGURATIONS ====================
export const RATE_LIMIT_CONFIGS = {
  API_STRICT: { limit: 30, windowMs: 60000, keyPrefix: "api-strict" },
  API_GENERAL: { limit: 100, windowMs: 3600000, keyPrefix: "api" },
  INNER_CIRCLE_UNLOCK: { limit: 30, windowMs: 600000, keyPrefix: "ic-unlock" },
  AUTH: { limit: 10, windowMs: 900000, keyPrefix: "auth" },
  CONTACT: { limit: 5, windowMs: 3600000, keyPrefix: "contact" },
  DOWNLOAD: { limit: 20, windowMs: 3600000, keyPrefix: "download" },
  LIKE: { limit: 50, windowMs: 300000, keyPrefix: "like" },
  SAVE: { limit: 30, windowMs: 300000, keyPrefix: "save" },
  SUBSCRIBE: { limit: 3, windowMs: 3600000, keyPrefix: "subscribe" },
  TEASER: { limit: 10, windowMs: 3600000, keyPrefix: "teaser" },
  NEWSLETTER: { limit: 5, windowMs: 3600000, keyPrefix: "newsletter" },
  EXPORT: { limit: 3, windowMs: 3600000, keyPrefix: "export" },
  ADMIN: { limit: 100, windowMs: 60000, keyPrefix: "admin" }
};

// ==================== CORE RATE LIMITING LOGIC ====================
const memoryStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(identifier: string, options: RateLimitOptions): string {
  const prefix = options.keyPrefix || "rl";
  return `${prefix}:${identifier}`;
}

async function getRateLimitData(key: string): Promise<{ count: number; resetTime: number } | null> {
  try {
    // Try Redis first if available
    const { getRedis } = await import('@/lib/redis');
    const redis = getRedis();
    if (redis && redis.get) {
      const data = await redis.get(key);
      if (data) {
        return JSON.parse(data);
      }
    }
  } catch {
    // Fallback to memory store
  }
  
  // Memory store
  return memoryStore.get(key) || null;
}

async function setRateLimitData(key: string, data: { count: number; resetTime: number }, windowMs: number): Promise<void> {
  try {
    // Try Redis first
    const { getRedis } = await import('@/lib/redis');
    const redis = getRedis();
    if (redis && redis.set) {
      await redis.set(key, JSON.stringify(data), { EX: Math.ceil(windowMs / 1000) });
    }
  } catch {
    // Fallback to memory store
  }
  
  // Always update memory store
  memoryStore.set(key, data);
  
  // Auto-cleanup for memory store
  setTimeout(() => {
    memoryStore.delete(key);
  }, windowMs);
}

// ==================== MAIN RATE LIMIT FUNCTION ====================
export async function rateLimit(identifier: string, options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL): Promise<RateLimitResult> {
  const now = Date.now();
  const key = getRateLimitKey(identifier, options);
  
  const existing = await getRateLimitData(key);
  
  if (existing && now < existing.resetTime) {
    // Within window, increment count
    existing.count += 1;
    await setRateLimitData(key, existing, options.windowMs);
    
    const remaining = Math.max(0, options.limit - existing.count);
    const allowed = remaining >= 0;
    
    return {
      allowed,
      remaining,
      limit: options.limit,
      retryAfterMs: allowed ? 0 : existing.resetTime - now,
      resetTime: existing.resetTime,
      windowMs: options.windowMs
    };
  } else {
    // New window
    const newData = {
      count: 1,
      resetTime: now + options.windowMs
    };
    
    await setRateLimitData(key, newData, options.windowMs);
    
    return {
      allowed: true,
      remaining: options.limit - 1,
      limit: options.limit,
      retryAfterMs: 0,
      resetTime: newData.resetTime,
      windowMs: options.windowMs
    };
  }
}

// ==================== HELPER FUNCTIONS ====================
export function getClientIp(req: NextApiRequest | NextRequest): string {
  if ('headers' in req && req.headers && typeof (req.headers as any).get === 'function') {
    const edgeHeaders = req.headers as any;
    const forwarded = edgeHeaders.get('x-forwarded-for');
    return forwarded?.split(',')[0]?.trim() || 
           edgeHeaders.get('x-real-ip') || 
           edgeHeaders.get('cf-connecting-ip') || 
           'unknown';
  }
  
  const apiReq = req as NextApiRequest;
  const forwarded = apiReq.headers['x-forwarded-for'];
  
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded : forwarded.split(',');
    return ips[0]?.trim() || 'unknown';
  }
  
  return apiReq.socket?.remoteAddress || 'unknown';
}

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    ...(result.retryAfterMs > 0 && {
      'Retry-After': Math.ceil(result.retryAfterMs / 1000).toString()
    })
  };
}

// ==================== API MIDDLEWARE WRAPPERS ====================
export function withApiRateLimit(
  handler: (req: NextApiRequest, res: any) => Promise<void> | void,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
) {
  return async (req: NextApiRequest, res: any) => {
    try {
      const ip = getClientIp(req);
      const key = `${ip}:${req.url || '/'}`;
      
      const result = await rateLimit(key, options);
      
      if (!result.allowed) {
        const headers = createRateLimitHeaders(result);
        Object.entries(headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: Math.ceil(result.retryAfterMs / 1000)
        });
      }
      
      // Add rate limit headers to successful responses
      const headers = createRateLimitHeaders(result);
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      return handler(req, res);
    } catch (error) {
      console.error('[RateLimit] Error:', error);
      // If rate limiting fails, allow the request
      return handler(req, res);
    }
  };
}

export function withEdgeRateLimit(
  handler: (req: NextRequest) => Promise<Response> | Response,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
) {
  return async (req: NextRequest) => {
    try {
      const ip = getClientIp(req);
      const key = `${ip}:${req.nextUrl.pathname}`;
      
      const result = await rateLimit(key, options);
      
      if (!result.allowed) {
        const headers = createRateLimitHeaders(result);
        
        return new Response(JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          retryAfter: Math.ceil(result.retryAfterMs / 1000)
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        });
      }
      
      return handler(req);
    } catch (error) {
      console.error('[EdgeRateLimit] Error:', error);
      // If rate limiting fails, allow the request
      return handler(req);
    }
  };
}

// ==================== UTILITY FUNCTIONS ====================
export async function isRateLimited(identifier: string, options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL): Promise<boolean> {
  const result = await rateLimit(identifier, options);
  return !result.allowed;
}

export async function checkRateLimit(identifier: string, options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL): Promise<RateLimitResult> {
  return rateLimit(identifier, options);
}

export async function rateLimitForRequestIp(req: NextApiRequest | NextRequest, options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL): Promise<{ ip: string } & RateLimitResult> {
  const ip = getClientIp(req);
  const result = await rateLimit(ip, options);
  return { ip, ...result };
}

// ==================== ADMIN FUNCTIONS ====================
export async function getRateLimiterStats(): Promise<{
  memoryStoreSize: number;
  usingRedis: boolean;
  configs: typeof RATE_LIMIT_CONFIGS;
}> {
  let usingRedis = false;
  
  try {
    const { getRedis } = await import('@/lib/redis');
    const redis = getRedis();
    if (redis && redis.ping) {
      await redis.ping();
      usingRedis = true;
    }
  } catch {
    // Redis not available
  }
  
  return {
    memoryStoreSize: memoryStore.size,
    usingRedis,
    configs: RATE_LIMIT_CONFIGS
  };
}

export async function resetRateLimit(keyPattern: string): Promise<void> {
  try {
    const { getRedis } = await import('@/lib/redis');
    const redis = getRedis();
    
    if (redis && redis.keys && redis.del) {
      const keys = await redis.keys(`${keyPattern}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  } catch {
    // Fallback to memory store
  }
  
  // Clear memory store
  for (const key of memoryStore.keys()) {
    if (key.startsWith(keyPattern)) {
      memoryStore.delete(key);
    }
  }
}

export async function unblock(identifier: string, options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL): Promise<void> {
  const key = getRateLimitKey(identifier, options);
  
  try {
    const { getRedis } = await import('@/lib/redis');
    const redis = getRedis();
    if (redis && redis.del) {
      await redis.del(key);
    }
  } catch {
    // Fallback to memory store
  }
  
  memoryStore.delete(key);
}

// ==================== DEFAULT EXPORT ====================
export default {
  rateLimit,
  getClientIp,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  withApiRateLimit,
  withEdgeRateLimit,
  isRateLimited,
  checkRateLimit,
  rateLimitForRequestIp,
  getRateLimiterStats,
  resetRateLimit,
  unblock
};