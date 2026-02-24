// lib/inner-circle/rate-limit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { NextRequest } from "next/server";

import {
  RATE_LIMIT_CONFIGS,
  createRateLimitHeaders,
  checkRateLimit,
  getClientIp,
  rateLimit,
} from "@/lib/server/rateLimit";

// Helper to extract key from request for Inner Circle endpoints
function getInnerCircleKey(req: NextApiRequest | NextRequest, prefix: string = "ic"): string {
  // Handle NextApiRequest (Pages Router)
  if ('socket' in req || 'connection' in req) {
    const ip = getClientIp(req as NextApiRequest);
    return `${prefix}:${ip}`;
  }
  
  // Handle NextRequest (App Router)
  if ('headers' in req && typeof req.headers.get === 'function') {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';
    return `${prefix}:${ip}`;
  }
  
  // Fallback
  return `${prefix}:default`;
}

// Wrap common patterns for Inner Circle endpoints
export async function withInnerCircleRateLimit(
  req: NextApiRequest | NextRequest,
  options: any = RATE_LIMIT_CONFIGS?.CONTACT_FORM || { limit: 10, windowSeconds: 60 }
) {
  // Convert options to the format expected by checkRateLimit
  const limit = options.limit || options.max || 10;
  const windowMs = options.windowMs || (options.windowSeconds ? options.windowSeconds * 1000 : 60000);
  const windowSeconds = Math.ceil(windowMs / 1000);
  
  const key = getInnerCircleKey(req, options.keyPrefix || "ic");
  
  // checkRateLimit expects (key, config) format
  const result = checkRateLimit(key, { limit, windowSeconds, windowMs });
  
  return {
    allowed: result.ok,
    headers: createRateLimitHeaders({
      ok: result.ok,
      allowed: result.ok,
      remaining: result.remaining,
      resetSeconds: result.resetSeconds,
      limit: result.limit,
    }),
    result,
  };
}

// Privacy-safe stats for admin dashboards
export async function getPrivacySafeStatsWithRateLimit(
  req: NextApiRequest | NextRequest
) {
  const rl = await withInnerCircleRateLimit(req, { limit: 30, windowSeconds: 60 });
  return {
    rateLimit: {
      allowed: rl.allowed,
      remaining: rl.result?.remaining ?? 0,
      resetTime: (rl.result?.resetAt ?? Date.now()) + (rl.result?.resetSeconds ?? 0) * 1000,
    },
  };
}

// Privacy-safe export wrapper
export async function getPrivacySafeKeyExportWithRateLimit(
  req: NextApiRequest | NextRequest
) {
  const rl = await withInnerCircleRateLimit(req, { limit: 30, windowSeconds: 60 });
  if (!rl.allowed) {
    return { ok: false as const, headers: rl.headers, data: null };
  }
  return { ok: true as const, headers: rl.headers, data: [] as any[] };
}

// Registration wrapper (compat)
export async function createOrUpdateMemberAndIssueKeyWithRateLimit(
  req: NextApiRequest | NextRequest
) {
  const rl = await withInnerCircleRateLimit(req, { limit: 10, windowSeconds: 900 }); // 15 minutes
  if (!rl.allowed) return { ok: false as const, headers: rl.headers };
  return { ok: true as const, headers: rl.headers };
}

// Verify wrapper (compat)
export async function verifyInnerCircleKeyWithRateLimit(
  req: NextApiRequest | NextRequest
) {
  const rl = await withInnerCircleRateLimit(req, { limit: 10, windowSeconds: 60 });
  if (!rl.allowed) return { ok: false as const, headers: rl.headers };
  return { ok: true as const, headers: rl.headers };
}

export { createRateLimitHeaders };