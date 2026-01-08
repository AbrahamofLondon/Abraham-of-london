// lib/inner-circle/rate-limit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { NextRequest } from "next/server";

import {
  RATE_LIMIT_CONFIGS,
  createRateLimitHeaders,
  checkRateLimitAsync,
  getRateLimitKeys,
} from "@/lib/server/rate-limit-unified";

// Wrap common patterns for Inner Circle endpoints
export async function withInnerCircleRateLimit(
  req: NextApiRequest | NextRequest,
  options: any = RATE_LIMIT_CONFIGS?.AUTH || { windowMs: 900000, limit: 10 }
) {
  const keys = getRateLimitKeys ? getRateLimitKeys(req as any, options.keyPrefix || "ic") : ['default'];
  const { worstResult } = await checkRateLimitAsync(keys, options);
  return {
    allowed: worstResult.allowed,
    headers: createRateLimitHeaders(worstResult),
    result: worstResult,
  };
}

// Privacy-safe stats for admin dashboards
export async function getPrivacySafeStatsWithRateLimit(
  req: NextApiRequest | NextRequest
) {
  const rl = await withInnerCircleRateLimit(req, RATE_LIMIT_CONFIGS?.API_STRICT || { windowMs: 60000, limit: 30 });
  return {
    rateLimit: {
      allowed: rl.allowed,
      remaining: rl.result?.remaining ?? 0,
      resetTime: rl.result?.resetTime ?? Date.now(),
    },
  };
}

// Privacy-safe export wrapper
export async function getPrivacySafeKeyExportWithRateLimit(
  req: NextApiRequest | NextRequest
) {
  const rl = await withInnerCircleRateLimit(req, RATE_LIMIT_CONFIGS?.API_STRICT || { windowMs: 60000, limit: 30 });
  if (!rl.allowed) {
    return { ok: false as const, headers: rl.headers, data: null };
  }
  // Your real export logic lives elsewhere; this is a compat surface.
  return { ok: true as const, headers: rl.headers, data: [] as any[] };
}

// Registration wrapper (compat)
export async function createOrUpdateMemberAndIssueKeyWithRateLimit(
  req: NextApiRequest | NextRequest
) {
  const rl = await withInnerCircleRateLimit(req, RATE_LIMIT_CONFIGS?.AUTH || { windowMs: 900000, limit: 10 });
  if (!rl.allowed) return { ok: false as const, headers: rl.headers };

  // Call your real implementation if it exists.
  // If your actual function is in another module, import and call it here.
  return { ok: true as const, headers: rl.headers };
}

// Verify wrapper (compat)
export async function verifyInnerCircleKeyWithRateLimit(
  req: NextApiRequest | NextRequest
) {
  const rl = await withInnerCircleRateLimit(req, RATE_LIMIT_CONFIGS?.AUTH || { windowMs: 900000, limit: 10 });
  if (!rl.allowed) return { ok: false as const, headers: rl.headers };

  return { ok: true as const, headers: rl.headers };
}

export { createRateLimitHeaders };