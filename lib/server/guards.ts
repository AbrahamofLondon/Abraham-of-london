/* lib/server/guards.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { validateAdminAccess, isInvalidAdmin } from "@/lib/server/validation";
import { rateLimit } from "@/lib/server/rateLimit"; // Use the unified rateLimit function
import { logAuditEvent } from "@/lib/server/audit";
import { jsonErr } from "@/lib/server/http";

/**
 * ADMIN AUTHORIZATION GUARD
 */
export async function requireAdmin(req: NextApiRequest, res: NextApiResponse) {
  const admin = await validateAdminAccess(req);
  
  if (isInvalidAdmin(admin)) {
    await logAuditEvent({
      actorType: "api",
      action: "UNAUTHORIZED_ADMIN_ACCESS",
      resourceType: "admin_endpoint",
      status: "failed",
      severity: "high",
      details: { reason: admin.reason },
      ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress
    });

    jsonErr(res, 401, "UNAUTHORIZED", "Institutional admin access required.");
    return { ok: false as const };
  }

  return { ok: true as const, admin };
}

/**
 * RATE LIMIT GUARD
 * Updated to use the unified rateLimit function
 */
export async function requireRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  key: string,
  bucket: string,
  limit: number,
  windowMs: number = 5 * 60 * 1000 // Default 5 minute window
) {
  // Use the unified rateLimit function which returns RateLimitResult
  const result = await rateLimit(`${bucket}:${key}`, { limit, windowMs, keyPrefix: bucket });
  
  if (!result.allowed) {
    res.setHeader("Retry-After", Math.ceil(result.retryAfterMs / 1000).toString());
    
    jsonErr(res, 429, "RATE_LIMITED", "Institutional request threshold exceeded.", {
      retryAfter: Math.ceil(result.retryAfterMs / 1000),
      limit: result.limit,
      remaining: result.remaining
    });
    
    return { ok: false as const, rl: { 
      limited: true, 
      retryAfter: Math.ceil(result.retryAfterMs / 1000),
      limit: result.limit,
      remaining: result.remaining
    }};
  }

  // Inject oversight headers
  res.setHeader("X-Rate-Limit-Remaining", result.remaining.toString());
  res.setHeader("X-Rate-Limit-Limit", result.limit.toString());
  res.setHeader("X-Rate-Limit-Reset", Math.ceil(result.resetTime / 1000).toString());
  
  return { ok: true as const, rl: { 
    limited: false, 
    retryAfter: 0,
    limit: result.limit,
    remaining: result.remaining
  }};
}

// Backward compatibility function - matches the expected signature
export async function isRateLimitedWithWindow(
  key: string, 
  bucket: string, 
  limit: number, 
  windowMs: number
): Promise<{ 
  limited: boolean; 
  retryAfter: number; 
  limit: number; 
  remaining: number; 
}> {
  const result = await rateLimit(`${bucket}:${key}`, { limit, windowMs, keyPrefix: bucket });
  
  return {
    limited: !result.allowed,
    retryAfter: Math.ceil(result.retryAfterMs / 1000),
    limit: result.limit,
    remaining: result.remaining
  };
}

// Simpler version without windowMs parameter for other uses
export async function isRateLimited(
  key: string,
  bucket: string,
  limit: number
): Promise<{ 
  limited: boolean; 
  retryAfter: number; 
  limit: number; 
  remaining: number; 
}> {
  const windowMs = 5 * 60 * 1000; // Default 5 minutes
  const result = await rateLimit(`${bucket}:${key}`, { limit, windowMs, keyPrefix: bucket });
  
  return {
    limited: !result.allowed,
    retryAfter: Math.ceil(result.retryAfterMs / 1000),
    limit: result.limit,
    remaining: result.remaining
  };
}

// Helper for request-based rate limiting
export async function rateLimitForRequestIp(
  req: NextApiRequest,
  bucket: string,
  limit: number,
  windowMs?: number
): Promise<{ 
  limited: boolean; 
  retryAfter: number; 
  limit: number; 
  remaining: number; 
}> {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(',')[0]?.trim() || 
             req.socket.remoteAddress || 
             'unknown';
  const key = `ip:${ip}`;
  
  return isRateLimitedWithWindow(key, bucket, limit, windowMs || 5 * 60 * 1000);
}

// Admin rate limit guard
export async function requireAdminRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  adminId: string,
  operation: string
) {
  const result = await rateLimit(`admin:${adminId}:${operation}`, { 
    limit: 10, 
    windowMs: 60000, 
    keyPrefix: 'admin' 
  });
  
  if (!result.allowed) {
    jsonErr(res, 429, "RATE_LIMITED", "Admin rate limit exceeded");
    return { ok: false as const };
  }
  
  return { ok: true as const };
}

// Wrapper for API handlers with rate limiting
export async function withApiRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<any>,
  options?: {
    bucket?: string;
    limit?: number;
    windowMs?: number;
    adminOnly?: boolean;
  }
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Apply rate limiting
      const bucket = options?.bucket || 'api';
      const limit = options?.limit || 100;
      const windowMs = options?.windowMs || 5 * 60 * 1000;
      
      const ip = (req.headers["x-forwarded-for"] as string)?.split(',')[0]?.trim() || 
                req.socket.remoteAddress || 
                'unknown';
      
      const rateLimitResult = await isRateLimitedWithWindow(`ip:${ip}`, bucket, limit, windowMs);
      
      if (rateLimitResult.limited) {
        res.setHeader("Retry-After", rateLimitResult.retryAfter.toString());
        return jsonErr(res, 429, "RATE_LIMITED", "Rate limit exceeded");
      }
      
      // Add rate limit headers
      res.setHeader("X-Rate-Limit-Remaining", rateLimitResult.remaining.toString());
      res.setHeader("X-Rate-Limit-Limit", rateLimitResult.limit.toString());
      
      // If admin only, check admin access
      if (options?.adminOnly) {
        const adminResult = await requireAdmin(req, res);
        if (!adminResult.ok) {
          return; // Response already handled
        }
      }
      
      // Call the handler
      return await handler(req, res);
      
    } catch (error) {
      console.error('API handler error:', error);
      return jsonErr(res, 500, "INTERNAL_ERROR", "An unexpected error occurred");
    }
  };
}