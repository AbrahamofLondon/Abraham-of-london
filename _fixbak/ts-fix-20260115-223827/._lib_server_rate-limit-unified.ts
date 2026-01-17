// lib/server/rate-limit-unified.ts
// Clean, valid TypeScript implementation

import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

// Core types
export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  message?: string;
  identifier?: 'ip' | 'userId';
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
  message?: string;
}

// Configuration
export const RATE_LIMIT_CONFIGS = {
  public: { maxRequests: 10, windowMs: 60000 },
  authenticated: { maxRequests: 30, windowMs: 60000 },
  critical: { maxRequests: 5, windowMs: 60000 },
  API_GENERAL: { maxRequests: 10, windowMs: 60000 },
};

// Memory store
const memoryStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(identifier: string, options: RateLimitOptions): string {
  return `${identifier}:${options.windowMs}`;
}

// Core rate limiting function
export async function rateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = getRateLimitKey(identifier, options);
  const existing = memoryStore.get(key);

  if (existing) {
    if (now > existing.resetTime) {
      memoryStore.set(key, { count: 1, resetTime: now + options.windowMs });
      return {
        allowed: true,
        remaining: options.maxRequests - 1,
        resetTime: now + options.windowMs,
        limit: options.maxRequests,
      };
    }

    const remainingRaw = options.maxRequests - existing.count;
    const allowed = remainingRaw >= 0;
    const remaining = Math.max(0, remainingRaw);

    if (!allowed) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: existing.resetTime,
        limit: options.maxRequests,
        message: options.message || 'Too many requests',
      };
    }

    existing.count++;
    memoryStore.set(key, existing);

    return {
      allowed: true,
      remaining: options.maxRequests - existing.count,
      resetTime: existing.resetTime,
      limit: options.maxRequests,
    };
  } else {
    memoryStore.set(key, { count: 1, resetTime: now + options.windowMs });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime: now + options.windowMs,
      limit: options.maxRequests,
    };
  }
}

// Client IP utility
export function getClientIp(req: NextApiRequest): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  if (req.socket?.remoteAddress) {
    return req.socket.remoteAddress;
  }

  return 'unknown';
}

// Request-based rate limit check (what existing code expects)
export async function isRateLimited(
  req: NextApiRequest,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.public
): Promise<boolean> {
  const ip = getClientIp(req);
  const result = await rateLimit(ip, options);
  return !result.allowed;
}

// Rate limiter stats
export async function getRateLimiterStats(): Promise<{
  memoryStoreSize: number;
  totalKeys: number;
  timestamp: string;
}> {
  return {
    memoryStoreSize: memoryStore.size,
    totalKeys: memoryStore.size,
    timestamp: new Date().toISOString(),
  };
}

// Reset rate limit
export async function resetRateLimit(keyPattern: string): Promise<void> {
  const keysToDelete: string[] = [];
  for (const key of Array.from(memoryStore.keys())) {
    if (key.includes(keyPattern)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => memoryStore.delete(key));
}

// Unblock
export async function unblock(
  identifier: string,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.public
): Promise<void> {
  const key = getRateLimitKey(identifier, options);
  memoryStore.delete(key);
}

// Pages Router rate limit middleware
export function withApiRateLimit(
  handler: NextApiHandler,
  config: RateLimitOptions = RATE_LIMIT_CONFIGS.public
): NextApiHandler {
  return async function rateLimitedHandler(
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<void> {
    try {
      const ip = getClientIp(req);
      const result = await rateLimit(ip, config);

      if (!result.allowed) {
        res.status(429).json({
          error: config.message || 'Too many requests',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        });
        return;
      }

      await handler(req, res);
    } catch (error) {
      console.error('Rate limiting error:', error);
      await handler(req, res);
    }
  };
}

// Alias for backward compatibility
export const withRateLimit = withApiRateLimit;

// Sync versions for compatibility
export function getRateLimiterStatsSync(): {
  memoryStoreSize: number;
  totalKeys: number;
} {
  return {
    memoryStoreSize: memoryStore.size,
    totalKeys: memoryStore.size,
  };
}

export function resetRateLimitSync(keyPattern: string): void {
  const keysToDelete: string[] = [];
  for (const key of Array.from(memoryStore.keys())) {
    if (key.includes(keyPattern)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => memoryStore.delete(key));
}

export function unblockSync(
  identifier: string,
  options: RateLimitOptions = RATE_LIMIT_CONFIGS.public
): void {
  const key = getRateLimitKey(identifier, options);
  memoryStore.delete(key);
}

// Export types

//
// COMPAT: withRateLimit (legacy API wrapper)
//
export function withRateLimit(options = RATE_LIMIT_CONFIGS.API_GENERAL) {
  return (handler: (req: any, res: any) => any) => withApiRateLimit(handler, options);
}

