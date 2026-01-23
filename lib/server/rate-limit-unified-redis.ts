// lib/server/rate-limit-unified-redis.ts
import { NextResponse } from 'next/server';
import { rateLimitRedis, type RedisCheckResult } from '@/lib/rate-limit-redis';

// Re-export the core types and function expected by the login route
export interface RateLimitOptions {
  windowMs: number;
  limit: number;
  keyPrefix?: string;
  blockDuration?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
  windowMs: number;
  retryAfterMs?: number;
  blocked?: boolean;
  blockUntil?: number;
}

/**
 * The main check function.
 * Adapts the existing Redis limiter to the expected interface.
 */
export async function check(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const result: RedisCheckResult = await rateLimitRedis.check(key, {
    windowMs: options.windowMs,
    max: options.limit,
    keyPrefix: options.keyPrefix,
    blockDuration: options.blockDuration,
  });

  // Map the result to the expected RateLimitResult format
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    resetTime: result.resetAt,
    limit: result.limit,
    windowMs: options.windowMs,
    retryAfterMs: result.blocked ? Math.max(0, (result.blockUntil || result.resetAt) - Date.now()) : 0,
    blocked: result.blocked,
    blockUntil: result.blockUntil,
  };
}

/**
 * Creates HTTP headers from a rate limit result.
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };
  if (result.retryAfterMs !== undefined) {
    headers['Retry-After'] = Math.ceil(result.retryAfterMs / 1000).toString();
  }
  return headers;
}

/**
 * Creates a standardized HTTP 429 response using NextResponse.
 * IMPORTANT: For Next.js route handlers, we must return NextResponse, not Response.
 */
export function createRateLimitedResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((result.retryAfterMs || result.windowMs) / 1000));
  
  const response = NextResponse.json(
    {
      error: 'Too many requests',
      retryAfter,
      limit: result.limit,
      remaining: 0,
    },
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        ...createRateLimitHeaders(result),
      },
    }
  );
  
  return response;
}

// Export a default object for convenience
const rateLimitRedisModule = {
  check,
  createRateLimitHeaders,
  createRateLimitedResponse,
  RateLimitOptions,
  RateLimitResult,
};

export default rateLimitRedisModule;