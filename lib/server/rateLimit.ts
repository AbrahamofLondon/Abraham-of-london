/* lib/server/rateLimit.ts */
import type { NextApiRequest } from "next";
import crypto from "crypto";
import { logAuditEvent } from "./audit";

// --- Types & Interfaces ---
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

// --- In-Memory Store ---
class RateLimitStore {
  private store = new Map<string, { count: number; first: number; resetTime: number }>();
  constructor() {
    if (typeof setInterval !== "undefined") {
      setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
          if (now > entry.resetTime) this.store.delete(key);
        }
      }, 60 * 60 * 1000);
    }
  }
  get(key: string) { return this.store.get(key); }
  set(key: string, entry: any) { this.store.set(key, entry); }
}

const memoryStore = new RateLimitStore();

// --- Core Exports ---
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const { limit, windowMs, keyPrefix = "rl" } = options;
  const now = Date.now();
  const storeKey = `${keyPrefix}:${key}`;
  const resetTime = now + windowMs;
  const entry = memoryStore.get(storeKey);

  if (!entry || (now - entry.first) > windowMs) {
    memoryStore.set(storeKey, { count: 1, first: now, resetTime });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0, resetTime, limit, windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, windowMs - (now - entry.first)), resetTime: entry.resetTime, limit, windowMs };
  }

  entry.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - entry.count), retryAfterMs: 0, resetTime: entry.resetTime, limit, windowMs };
}

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
    "Retry-After": result.retryAfterMs > 0 ? Math.ceil(result.retryAfterMs / 1000).toString() : "0"
  };
}

export function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return (req.headers["x-nf-client-connection-ip"] as string) || req.socket?.remoteAddress || "unknown";
}

export function rateLimitForRequestIp(req: NextApiRequest, label: string, options: RateLimitOptions) {
  const ip = getClientIp(req);
  const result = rateLimit(`${label}:${ip}`, options);
  return { result, ip, headers: createRateLimitHeaders(result) };
}

export async function isRateLimited(key: string, bucket: string, limit: number): Promise<LegacyIsRateLimitedResult> {
  const res = rateLimit(`${bucket}:${key}`, { limit, windowMs: 5 * 60 * 1000 });
  return { limited: !res.allowed, retryAfter: Math.ceil(res.retryAfterMs / 1000), limit: res.limit, remaining: res.remaining };
}

// ============================================================================
// NEW: ADD MISSING EXPORT - combinedRateLimit
// ============================================================================

/**
 * Combined rate limit wrapper for middleware and API routes
 * @param handler The route handler function
 * @param options Rate limit options (defaults to API_GENERAL)
 */
export const combinedRateLimit = (
  handler: Function, 
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.API_GENERAL
) => {
  return async (req: NextApiRequest, ...args: any[]) => {
    try {
      const ip = getClientIp(req);
      const result = rateLimit(`${options.keyPrefix}:${ip}`, options);
      
      // Log rate limit attempts
      if (!result.allowed) {
        await logAuditEvent?.('rate_limit_hit', {
          ip,
          keyPrefix: options.keyPrefix,
          limit: options.limit,
          windowMs: options.windowMs,
          retryAfterMs: result.retryAfterMs
        }).catch(() => {});
        
        // Return 429 Too Many Requests
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil(result.retryAfterMs / 1000),
            limit: options.limit,
            windowMs: options.windowMs
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...createRateLimitHeaders(result)
            }
          }
        );
      }
      
      // Add rate limit headers to successful requests
      const response = await handler(req, ...args);
      
      if (response instanceof Response) {
        const headers = new Headers(response.headers);
        Object.entries(createRateLimitHeaders(result)).forEach(([key, value]) => {
          headers.set(key, value);
        });
        
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      }
      
      return response;
      
    } catch (error) {
      console.error('[RATE_LIMIT_ERROR]', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
};

/**
 * Middleware-friendly rate limit check (for Next.js middleware)
 */
export const checkRateLimit = (identifier: string, options: RateLimitOptions): RateLimitResult => {
  return rateLimit(identifier, options);
};

// ============================================================================
// Rate Limit Configurations
// ============================================================================

export const RATE_LIMIT_CONFIGS = {
  STRATEGY_ROOM_INTAKE: { limit: 10, windowMs: 3600000, keyPrefix: "strategy" },
  INNER_CIRCLE_REGISTER: { limit: 20, windowMs: 900000, keyPrefix: "ic-reg" },
  CONTACT_FORM: { limit: 5, windowMs: 600000, keyPrefix: "contact" },
  NEWSLETTER_SUBSCRIBE: { limit: 5, windowMs: 600000, keyPrefix: "news" },
  API_GENERAL: { limit: 100, windowMs: 3600000, keyPrefix: "api" },
  TEASER_REQUEST: { limit: 10, windowMs: 900000, keyPrefix: "teaser" },
  ADMIN_API: { limit: 50, windowMs: 300000, keyPrefix: "admin" },
  ADMIN_OPERATIONS: { limit: 20, windowMs: 3600000, keyPrefix: "admin-ops" },
  
  // NEW: Special configurations
  DOWNLOAD_API: { limit: 30, windowMs: 600000, keyPrefix: "download" },
  ASSET_API: { limit: 50, windowMs: 300000, keyPrefix: "asset" }
} as const;

// ============================================================================
// Export everything
// ============================================================================

export default { 
  rateLimit, 
  isRateLimited, 
  rateLimitForRequestIp, 
  createRateLimitHeaders,
  combinedRateLimit, // ADDED
  checkRateLimit, // ADDED
  RATE_LIMIT_CONFIGS 
};