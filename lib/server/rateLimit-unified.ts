// lib/server/rateLimit-unified.ts
// Unified interface for both Edge and Node.js runtimes

import type { NextApiRequest, NextApiResponse } from "next";
import type { NextRequest } from "next/server";

// Declare EdgeRuntime for TypeScript
declare const EdgeRuntime: string | undefined;

// Detect runtime
const isEdgeRuntime = 
  typeof EdgeRuntime !== 'undefined' || 
  process.env.NEXT_RUNTIME === 'edge';

// Dynamically import the appropriate rate limiter
let rateLimiter: any;

// Cache the imports to avoid repeated requires
let edgeRateLimiter: any;
let nodeRateLimiter: any;

// Type definitions for better TypeScript support
export interface RateLimitOptions {
  limit: number;
  windowMs: number;
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

// Lazy load the appropriate rate limiter
function getRateLimiter() {
  if (!rateLimiter) {
    if (isEdgeRuntime) {
      // Edge runtime
      try {
        edgeRateLimiter = require('./rateLimit-edge');
        rateLimiter = edgeRateLimiter.default || edgeRateLimiter;
      } catch (error) {
        console.error('Failed to load Edge rate limiter:', error);
        // Fallback to a simple in-memory implementation
        rateLimiter = createFallbackRateLimiter();
      }
    } else {
      // Node.js runtime
      try {
        nodeRateLimiter = require('./rateLimit');
        rateLimiter = nodeRateLimiter.default || nodeRateLimiter;
      } catch (error) {
        console.error('Failed to load Node.js rate limiter:', error);
        rateLimiter = createFallbackRateLimiter();
      }
    }
  }
  return rateLimiter;
}

// Fallback rate limiter in case imports fail
function createFallbackRateLimiter() {
  const store = new Map<string, { count: number; first: number; resetTime: number }>();
  
  return {
    rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
      const { limit, windowMs, keyPrefix = "rl" } = options;
      const now = Date.now();
      const storeKey = `${keyPrefix}:${key}`;
      const resetTime = now + windowMs;
      const entry = store.get(storeKey);

      if (!entry || (now - entry.first) > windowMs) {
        store.set(storeKey, { count: 1, first: now, resetTime });
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
      return {
        allowed: true,
        remaining: Math.max(0, limit - entry.count),
        retryAfterMs: 0,
        resetTime: entry.resetTime,
        limit,
        windowMs
      };
    },
    
    createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
      return {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
        "Retry-After": result.retryAfterMs > 0 ? Math.ceil(result.retryAfterMs / 1000).toString() : "0"
      };
    },
    
    getClientIp(req: NextApiRequest | NextRequest): string {
      if ('headers' in req && typeof req.headers === 'object') {
        const forwarded = req.headers["x-forwarded-for"];
        if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
        return "unknown";
      }
      
      const forwarded = req.headers.get("x-forwarded-for");
      if (forwarded) {
        const ips = forwarded.split(",").map(ip => ip.trim());
        return ips[0] || "unknown";
      }
      
      return "unknown";
    },
    
    RATE_LIMIT_CONFIGS: {
      API_GENERAL: { limit: 100, windowMs: 3600000, keyPrefix: "api" },
      API_STRICT: { limit: 30, windowMs: 60000, keyPrefix: "api-strict" },
      DOWNLOAD_API: { limit: 30, windowMs: 600000, keyPrefix: "download" },
      ASSET_API: { limit: 50, windowMs: 300000, keyPrefix: "asset" },
      AUTH_API: { limit: 10, windowMs: 300000, keyPrefix: "auth" },
      SEARCH_API: { limit: 60, windowMs: 60000, keyPrefix: "search" },
      WEBHOOK_API: { limit: 5, windowMs: 30000, keyPrefix: "webhook" },
    }
  };
}

// Helper function to get a function from rateLimiter with fallback
function getRateLimitFunction<T extends (...args: any[]) => any>(
  fnName: string, 
  fallback: T
): T {
  const limiter = getRateLimiter();
  return (limiter[fnName] || fallback) as T;
}

// Export functions with proper fallbacks
export const rateLimit = getRateLimitFunction('rateLimit', createFallbackRateLimiter().rateLimit);
export const tokenBucketRateLimit = getRateLimitFunction('tokenBucketRateLimit', () => { 
  throw new Error('Token bucket rate limiting not available in this runtime');
});
export const rateLimitWithBackoff = getRateLimitFunction('rateLimitWithBackoff', (key: string, options: any) => {
  const baseResult = rateLimit(key, options);
  if (!baseResult.allowed) {
    // Simple backoff without persistence
    return {
      ...baseResult,
      retryAfterMs: baseResult.retryAfterMs * 2,
    };
  }
  return baseResult;
});

export const createRateLimitHeaders = getRateLimitFunction('createRateLimitHeaders', createFallbackRateLimiter().createRateLimitHeaders);
export const getClientIp = getRateLimitFunction('getClientIp', createFallbackRateLimiter().getClientIp);
export const getRateLimitKeys = getRateLimitFunction('getRateLimitKeys', (req: any, keyPrefix: string) => {
  const ip = getClientIp(req);
  return [`${keyPrefix}:${ip}`];
});

export const checkMultipleRateLimits = getRateLimitFunction('checkMultipleRateLimits', (keys: string[], options: RateLimitOptions) => {
  const results = keys.map(key => rateLimit(key, options));
  const worstResult = results.reduce((worst, current) => {
    if (!current.allowed) return current;
    if (!worst.allowed) return worst;
    if (current.remaining < worst.remaining) return current;
    return worst;
  }, results[0]);
  return { results, worstResult };
});

export const checkRateLimit = getRateLimitFunction('checkRateLimit', rateLimit);

// Unified wrapper for API routes
export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options = getRateLimiter().RATE_LIMIT_CONFIGS?.API_GENERAL || { limit: 100, windowMs: 3600000, keyPrefix: "api" },
  useBackoff = false
) {
  if (isEdgeRuntime) {
    // Edge runtime handler (for App Router)
    return async (req: NextRequest) => {
      try {
        if (!edgeRateLimiter) {
          edgeRateLimiter = require('./rateLimit-edge');
        }
        const edgeHandler = edgeRateLimiter.withRateLimit || edgeRateLimiter.default?.withRateLimit;
        
        if (edgeHandler) {
          return edgeHandler(
            async (req: NextRequest) => {
              // Convert Edge request to API request format if needed
              const apiReq = createApiRequestFromEdgeRequest(req);
              const apiRes = createApiResponse();
              await handler(apiReq, apiRes);
              return apiRes.toResponse();
            },
            options,
            useBackoff
          )(req);
        }
      } catch (error) {
        console.error('Edge rate limit wrapper failed:', error);
      }
      
      // Fallback: call handler directly
      return handler(req as unknown as NextApiRequest, {} as NextApiResponse);
    };
  } else {
    // Node.js runtime handler (for Pages Router)
    try {
      if (!nodeRateLimiter) {
        nodeRateLimiter = require('./rateLimit');
      }
      const nodeHandler = nodeRateLimiter.withApiRateLimit || nodeRateLimiter.default?.withApiRateLimit;
      
      if (nodeHandler) {
        return nodeHandler(handler, options, useBackoff);
      }
    } catch (error) {
      console.error('Node.js rate limit wrapper failed:', error);
    }
    
    // Fallback: call handler directly
    return handler;
  }
}

// Helper to convert Edge request to API request format
function createApiRequestFromEdgeRequest(req: NextRequest): NextApiRequest {
  const url = new URL(req.url);
  return {
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    query: Object.fromEntries(url.searchParams.entries()),
    body: req.body,
    cookies: {},
    // Add other properties as needed
  } as any;
}

// Helper to create a mock API response
function createApiResponse(): NextApiResponse {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let body: any;
  
  return {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: any) {
      body = JSON.stringify(data);
      return this;
    },
    setHeader(name: string, value: string) {
      headers.set(name, value);
      return this;
    },
    getHeader(name: string) {
      return headers.get(name);
    },
    toResponse() {
      return new Response(body, {
        status: statusCode,
        headers: Object.fromEntries(headers.entries())
      });
    }
  } as any;
}

// Legacy compatibility
export async function isRateLimited(key: string, bucket: string, limit: number, windowMs?: number): Promise<LegacyIsRateLimitedResult> {
  const actualWindowMs = windowMs || 5 * 60 * 1000; // Default 5 minutes
  const res = rateLimit(`${bucket}:${key}`, { limit, windowMs: actualWindowMs });
  return {
    limited: !res.allowed,
    retryAfter: Math.ceil(res.retryAfterMs / 1000),
    limit: res.limit,
    remaining: res.remaining
  };
}

// Export RATE_LIMIT_CONFIGS
export const RATE_LIMIT_CONFIGS = getRateLimiter().RATE_LIMIT_CONFIGS || createFallbackRateLimiter().RATE_LIMIT_CONFIGS;

export default {
  rateLimit,
  tokenBucketRateLimit,
  rateLimitWithBackoff,
  isRateLimited,
  createRateLimitHeaders,
  getClientIp,
  getRateLimitKeys,
  checkMultipleRateLimits,
  withRateLimit,
  checkRateLimit,
  RATE_LIMIT_CONFIGS,
  isEdgeRuntime
};