// lib/server/rate-limit-edge.ts - SIMPLE, SAFE VERSION
import "server-only";

type EdgeRateLimitParams = {
  key: string;
  windowSeconds: number;
  limit: number;
};

type EdgeRateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
  headers: Record<string, string>;
};

export async function edgeRateLimit(params: EdgeRateLimitParams): Promise<EdgeRateLimitResult> {
  const { key, windowSeconds, limit } = params;
  
  // Check if rate limiting is disabled or we're not in production
  const isDisabled = process.env.DISABLE_EDGE_RATE_LIMIT === "true";
  const isProd = process.env.NODE_ENV === "production";
  
  // In development or when disabled, always allow
  if (isDisabled || !isProd) {
    const resetAtMs = Date.now() + windowSeconds * 1000;
    const remaining = Math.max(0, limit - 1);
    
    // Development warning
    if (!isProd && !isDisabled && process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Rate limiting disabled for key: "${key}" (${limit}/${windowSeconds}s)`);
    }
    
    return {
      allowed: true,
      remaining,
      resetAt: resetAtMs,
      retryAfterSeconds: undefined,
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(Math.floor(resetAtMs / 1000)),
      },
    };
  }
  
  // Production with Upstash - check if configured
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.error("Upstash Redis not configured for rate limiting in production");
    
    // In production without Upstash, still allow but log error
    const resetAtMs = Date.now() + windowSeconds * 1000;
    const remaining = Math.max(0, limit - 1);
    
    return {
      allowed: true,
      remaining,
      resetAt: resetAtMs,
      retryAfterSeconds: undefined,
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(Math.floor(resetAtMs / 1000)),
      },
    };
  }
  
  // Production with Upstash configured
  try {
    // Dynamic import to avoid bundling Upstash in Edge runtime if not used
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    
    const redis = new Redis({ url, token });
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: true,
      prefix: "aol_edge_rl",
    });

    const r = await limiter.limit(key);

    const resetAtMs = typeof r.reset === "number" 
      ? r.reset 
      : r.reset instanceof Date 
        ? r.reset.getTime() 
        : Date.now() + windowSeconds * 1000;

    const remaining = typeof r.remaining === "number" ? r.remaining : 0;
    const allowed = !!r.success;

    const retryAfterSeconds = allowed ? undefined : Math.max(1, Math.ceil((resetAtMs - Date.now()) / 1000));

    const headers: Record<string, string> = {
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": String(Math.max(0, remaining)),
      "X-RateLimit-Reset": String(Math.floor(resetAtMs / 1000)),
    };

    if (!allowed) {
      headers["Retry-After"] = String(retryAfterSeconds);
    }

    return {
      allowed,
      remaining,
      resetAt: resetAtMs,
      retryAfterSeconds,
      headers,
    };
  } catch (error) {
    console.error("Rate limiting service failed:", error);
    
    // If Upstash fails in production, allow but log
    const resetAtMs = Date.now() + windowSeconds * 1000;
    const remaining = Math.max(0, limit - 1);
    
    return {
      allowed: true,
      remaining,
      resetAt: resetAtMs,
      retryAfterSeconds: undefined,
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(Math.floor(resetAtMs / 1000)),
      },
    };
  }
}

export default edgeRateLimit;