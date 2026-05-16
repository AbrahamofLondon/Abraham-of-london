/**
 * lib/server/apply-rate-limit.ts
 *
 * Pages Router helper. Applies a scoped rate limit check and, if exceeded,
 * writes the 429 response and returns false. Caller returns immediately on false.
 *
 * Usage:
 *   const ok = await applyRateLimit(req, res, {
 *     scope: "RETURN_BRIEF_GENERATION",
 *     identifier: session.user.email,
 *     limit: 5,
 *     windowSeconds: 3600,
 *   });
 *   if (!ok) return;
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { checkRateLimit, rateLimitHeaders, type RateLimitScope } from "@/lib/server/rate-limit";

export function getClientIp(req: NextApiRequest): string {
  const headers = req.headers ?? {};
  const forwarded = headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return raw?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? "unknown";
}

export async function applyRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  options: {
    scope: RateLimitScope;
    identifier?: string;
    limit: number;
    windowSeconds: number;
  },
): Promise<boolean> {
  const identifier = options.identifier ?? getClientIp(req);

  const result = await checkRateLimit({
    scope: options.scope,
    identifier,
    limit: options.limit,
    windowSeconds: options.windowSeconds,
  });

  const headers = rateLimitHeaders(result);
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  if (!result.allowed) {
    res.status(429).json({
      error: "Too many requests. Please try again later.",
      resetAt: result.resetAt,
    });
    return false;
  }

  return true;
}
