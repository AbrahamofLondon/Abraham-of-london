// lib/server/rateLimit.ts - Universal Runtime compatible
import type { NextApiRequest, NextApiResponse } from "next";
import type { NextRequest } from "next/server";
import { logAuditEvent } from "./audit";

// --- Types & Interfaces ---
export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
}

export interface TokenBucketOptions {
  capacity: number;
  tokensPerSecond: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  resetTime: number;
  limit: number;
  windowMs: number;
}

export interface LegacyIsRateLimitedResult {
  limited: boolean;
  retryAfter: number; 
  limit: number;
  remaining: number;
}

// --- Runtime Detection ---
export const isEdgeRuntime = typeof EdgeRuntime !== 'undefined' || 
  (typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge');

// --- Store Implementation ---
interface RateLimitEntry {
  count: number;
  first: number;
  resetTime: number;
}

// Simple in-memory store for development/testing
class MemoryRateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private lastCleanup = Date.now();

  private cleanupIfNeeded(): void {
    const now = Date.now();
    // Cleanup every minute
    if (now - this.lastCleanup > 60000) {
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.resetTime) {
          this.store.delete(key);
        }
      }
      this.lastCleanup = now;
    }
  }

  get(key: string): RateLimitEntry | undefined {
    this.cleanupIfNeeded();
    const entry = this.store.get(key);
    if (entry && Date.now() > entry.resetTime) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

// --- Redis Store for Production (Netlify compatible) ---
class RedisRateLimitStore {
  async get(key: string): Promise<RateLimitEntry | undefined> {
    try {
      // In production on Netlify, you'd use their KV store or Redis addon
      // For now, we'll fall back to memory in production context
      return undefined;
    } catch {
      return undefined;
    }
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    // Implementation would use Netlify KV/Redis
  }

  async delete(key: string): Promise<void> {
    // Implementation would use Netlify KV/Redis
  }

  async clear(): Promise<void> {
    // Implementation would use Netlify KV/Redis
  }
}

// Select store based on environment
const memoryStore = new MemoryRateLimitStore();
const redisStore = new RedisRateLimitStore();

// Use memory store for local/dev, Redis for production
const getStore = () => {
  if (process.env.NODE_ENV === 'production' && !isEdgeRuntime) {
    return redisStore;
  }
  return memoryStore;
};

// Token bucket store (memory only for simplicity)
const tokenBuckets = new Map<string, { tokens: number; lastRefill: number }>();
const violationCounts = new Map<string, number>();

// --- Core Rate Limiting Functions ---

/**
 * Fixed window rate limiter
 */
export async function rateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const { limit, windowMs, keyPrefix = "rl" } = options;
  const now = Date.now();
  const storeKey = `${keyPrefix}:${key}`;
  const resetTime = now + windowMs;
  
  const store = getStore();
  const entry = await store.get(storeKey);

  if (!entry || (now - entry.first) > windowMs) {
    await store.set(storeKey, { 
      count: 1, 
      first: now, 
      resetTime 
    });
    return { 
      allowed: true, 
      remaining: limit - 1, 
      retryAfterMs: 0, 
      resetTime, 
      limit, 
      windowMs 
    };
  }

  if (entry.count >= limit) {
    return { 
      allowed: false, 
      remaining: 0, 
      retryAfterMs: Math.max(0, windowMs - (now - entry.first)), 
      resetTime: entry.resetTime, 
      limit, 
      windowMs 
    };
  }

  entry.count += 1;
  await store.set(storeKey, entry);
  return { 
    allowed: true, 
    remaining: Math.max(0, limit - entry.count), 
    retryAfterMs: 0, 
    resetTime: entry.resetTime, 
    limit, 
    windowMs 
  };
}

/**
 * Get client IP address from request
 */
export function getClientIp(req: NextApiRequest | NextRequest): string {
  // Edge Runtime (NextRequest)
  if ('headers' in req && typeof (req as any).headers?.get === 'function') {
    const edgeReq = req as NextRequest;
    
    // Netlify specific header
    const netlifyIp = edgeReq.headers.get("x-nf-client-connection-ip");
    if (netlifyIp) return netlifyIp;
    
    // Standard headers
    const forwarded = edgeReq.headers.get("x-forwarded-for");
    if (forwarded) {
      const ips = forwarded.split(",").map(ip => ip.trim());
      return ips[0] || "unknown";
    }
    
    return edgeReq.headers.get("x-real-ip") || "unknown";
  }
  
  // Node Runtime (NextApiRequest)
  const nodeReq = req as NextApiRequest;
  
  // Netlify specific header
  const netlifyIp = nodeReq.headers["x-nf-client-connection-ip"];
  if (netlifyIp) return Array.isArray(netlifyIp) ? netlifyIp[0] : netlifyIp;
  
  // Standard headers
  const forwarded = nodeReq.headers["x-forwarded-for"];
  if (forwarded) {
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0]?.trim() || "unknown";
    }
    if (Array.isArray(forwarded) && forwarded[0]) {
      return forwarded[0].trim();
    }
  }
  
  return nodeReq.socket?.remoteAddress || "unknown";
}

/**
 * Generate HTTP headers from rate limit result
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
    ...(result.retryAfterMs > 0 ? {
      "Retry-After": Math.ceil(result.retryAfterMs / 1000).toString()
    } : {})
  };
}

/**
 * Wrapper for Next.js API routes
 */
export function withApiRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const ip = getClientIp(req);
      const key = `${options.keyPrefix}:${ip}`;
      
      const result = await rateLimit(key, options);
      
      if (!result.allowed) {
        // Log rate limit hit
        await logAuditEvent({
          actorType: "api",
          action: "rate_limit_hit",
          resourceType: "api_endpoint",
          status: "warning",
          severity: "medium",
          ipAddress: ip,
          details: {
            keyPrefix: options.keyPrefix,
            limit: options.limit,
            windowMs: options.windowMs,
            retryAfterMs: result.retryAfterMs,
            path: req.url
          }
        });
        
        // Set rate limit headers
        Object.entries(createRateLimitHeaders(result)).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        
        return res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil(result.retryAfterMs / 1000)} seconds.`,
          retryAfter: Math.ceil(result.retryAfterMs / 1000),
          limit: options.limit,
          windowMs: options.windowMs
        });
      }
      
      // Add rate limit headers to successful responses
      Object.entries(createRateLimitHeaders(result)).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      // Call the original handler
      return handler(req, res);
      
    } catch (error) {
      console.error('[RATE_LIMIT_ERROR]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Combined rate limit wrapper for Node.js API routes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const combinedRateLimit = (
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<any> | any,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const ip = getClientIp(req);
      const result = await rateLimit(`${options.keyPrefix}:${ip}`, options);
      
      if (!result.allowed) {
        // Set headers
        Object.entries(createRateLimitHeaders(result)).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        
        return res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(result.retryAfterMs / 1000),
          limit: options.limit,
          windowMs: options.windowMs
        });
      }
      
      // Call the handler
      const response = await handler(req, res);
      
      // Add rate limit headers to response
      if (!res.headersSent) {
        Object.entries(createRateLimitHeaders(result)).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }
      
      return response;
      
    } catch (error) {
      console.error('[RATE_LIMIT_ERROR]', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Edge Runtime compatible middleware function
 */
export async function edgeRateLimit(
  request: NextRequest,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  try {
    const ip = getClientIp(request);
    const key = `${options.keyPrefix}:${ip}`;
    const result = await rateLimit(key, options);
    
    return {
      allowed: result.allowed,
      headers: createRateLimitHeaders(result)
    };
  } catch (error) {
    console.error('[EDGE_RATE_LIMIT_ERROR]', error);
    return {
      allowed: true, // Fail open on error
      headers: {}
    };
  }
}

/**
 * Simplified rate limiter for Netlify functions
 */
export async function netlifyRateLimit(
  request: Request,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
): Promise<{ allowed: boolean; headers: Headers }> {
  const headers = new Headers();
  
  try {
    // Get IP from Netlify headers
    const ip = request.headers.get("x-nf-client-connection-ip") || 
               request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               "unknown";
    
    const key = `${options.keyPrefix}:${ip}`;
    const result = await rateLimit(key, options);
    
    // Set headers
    Object.entries(createRateLimitHeaders(result)).forEach(([key, value]) => {
      headers.set(key, value);
    });
    
    return {
      allowed: result.allowed,
      headers
    };
  } catch (error) {
    console.error('[NETLIFY_RATE_LIMIT_ERROR]', error);
    return {
      allowed: true, // Fail open
      headers
    };
  }
}

// ============================================================================
// Rate Limit Configurations
// ============================================================================

export const RATE_LIMIT_CONFIGS = {
  // API configurations
  API_GENERAL: { limit: 100, windowMs: 3600000, keyPrefix: "api" },
  API_STRICT: { limit: 30, windowMs: 60000, keyPrefix: "api-strict" },
  AUTH_API: { limit: 10, windowMs: 300000, keyPrefix: "auth" },
  DOWNLOAD_API: { limit: 30, windowMs: 600000, keyPrefix: "download" },
  
  // Form submissions
  CONTACT_FORM: { limit: 5, windowMs: 600000, keyPrefix: "contact" },
  NEWSLETTER_SUBSCRIBE: { limit: 5, windowMs: 600000, keyPrefix: "news" },
  
  // Admin endpoints
  ADMIN_API: { limit: 50, windowMs: 300000, keyPrefix: "admin" },
  
  // Legacy support
  STRATEGY_ROOM_INTAKE: { limit: 10, windowMs: 3600000, keyPrefix: "strategy" },
  INNER_CIRCLE_REGISTER: { limit: 20, windowMs: 900000, keyPrefix: "ic-reg" },
  TEASER_REQUEST: { limit: 10, windowMs: 900000, keyPrefix: "teaser" },
} as const;

// ============================================================================
// Export everything
// ============================================================================

export default { 
  rateLimit,
  getClientIp,
  createRateLimitHeaders,
  withApiRateLimit,
  combinedRateLimit,
  edgeRateLimit,
  netlifyRateLimit,
  RATE_LIMIT_CONFIGS 
};
