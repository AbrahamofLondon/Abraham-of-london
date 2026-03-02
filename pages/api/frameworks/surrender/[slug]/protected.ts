// pages/api/protected-content.ts — NODE-ONLY (Pages Router API)
// Institutional-grade, but not stupid.
// - No NextRequest (Edge) usage
// - No Upstash / redis-safe import chain
// - Deterministic in Windows + Netlify
// - In-memory rate limiting (good enough for this endpoint)

import type { NextApiRequest, NextApiResponse } from "next";

const INNER_CIRCLE_COOKIE_NAME = "innerCircleAccess";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export interface InnerCircleAccess {
  hasAccess: boolean;
  reason?: "no_cookie" | "rate_limited";
  rateLimit?: {
    remaining: number;
    limit: number;
    resetTime: number;
    retryAfterMs?: number;
  };
  userData?: {
    ip: string;
    userAgent: string;
    timestamp: number;
  };
}

export interface AccessCheckOptions {
  requireAuth?: boolean;
  rateLimitConfig?: {
    windowMs: number;
    limit: number;
    keyPrefix: string;
  };
  skipRateLimit?: boolean;
}

/* -------------------------------------------------------------------------- */
/* SIMPLE IP + COOKIE HELPERS                                                 */
/* -------------------------------------------------------------------------- */

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ip =
    (raw || "").split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.socket?.remoteAddress ||
    "unknown";
  return ip;
}

function hasInnerCircleCookie(req: NextApiRequest): boolean {
  // Next.js parses cookies into req.cookies in pages API routes
  const v = req.cookies?.[INNER_CIRCLE_COOKIE_NAME];
  return v === "true";
}

/* -------------------------------------------------------------------------- */
/* IN-MEMORY RATE LIMITER (TOKEN BUCKET / WINDOW COUNTER)                     */
/* -------------------------------------------------------------------------- */

type Bucket = { resetTime: number; count: number };
const memoryBuckets = new Map<string, Bucket>();

function checkRateLimit(key: string, windowMs: number, limit: number) {
  const now = Date.now();
  const existing = memoryBuckets.get(key);

  if (!existing || now >= existing.resetTime) {
    const resetTime = now + windowMs;
    const b: Bucket = { resetTime, count: 1 };
    memoryBuckets.set(key, b);
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      limit,
      resetTime,
      retryAfterMs: 0,
    };
  }

  if (existing.count >= limit) {
    const retryAfterMs = Math.max(0, existing.resetTime - now);
    return {
      allowed: false,
      remaining: 0,
      limit,
      resetTime: existing.resetTime,
      retryAfterMs,
    };
  }

  existing.count += 1;
  memoryBuckets.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    limit,
    resetTime: existing.resetTime,
    retryAfterMs: 0,
  };
}

function createRateLimitHeaders(rl: NonNullable<InnerCircleAccess["rateLimit"]>) {
  // Standard-ish headers (fine for internal usage)
  return {
    "X-RateLimit-Limit": String(rl.limit),
    "X-RateLimit-Remaining": String(rl.remaining),
    "X-RateLimit-Reset": String(Math.floor(rl.resetTime / 1000)),
  };
}

/* -------------------------------------------------------------------------- */
/* CORE ACCESS CHECK                                                          */
/* -------------------------------------------------------------------------- */

export async function getInnerCircleAccess(
  req: NextApiRequest,
  options: AccessCheckOptions = {}
): Promise<InnerCircleAccess> {
  const { requireAuth = true, rateLimitConfig, skipRateLimit = false } = options;

  const ip = getClientIp(req);
  const userAgent = String(req.headers["user-agent"] || "");

  // ---- Rate limiting (optional) ----
  if (!skipRateLimit) {
    const cfg = rateLimitConfig || { windowMs: 60_000, limit: 30, keyPrefix: "protected_content" };
    const key = `${cfg.keyPrefix}:${ip}`;

    const rl = checkRateLimit(key, cfg.windowMs, cfg.limit);

    if (!rl.allowed) {
      return {
        hasAccess: false,
        reason: "rate_limited",
        rateLimit: {
          remaining: 0,
          limit: rl.limit,
          resetTime: rl.resetTime,
          retryAfterMs: rl.retryAfterMs,
        },
        userData: { ip, userAgent, timestamp: Date.now() },
      };
    }
  }

  // ---- Auth check ----
  const okCookie = hasInnerCircleCookie(req);
  if (requireAuth && !okCookie) {
    return {
      hasAccess: false,
      reason: "no_cookie",
      userData: { ip, userAgent, timestamp: Date.now() },
    };
  }

  return {
    hasAccess: true,
    userData: { ip, userAgent, timestamp: Date.now() },
  };
}

/* -------------------------------------------------------------------------- */
/* WRAPPER                                                                     */
/* -------------------------------------------------------------------------- */

export function withInnerCircleAccess(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options: AccessCheckOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const access = await getInnerCircleAccess(req, options);

    // Attach for downstream
    (req as any).innerCircleAccess = access;

    // Rate limit headers if present
    if (access.rateLimit) {
      const headers = createRateLimitHeaders(access.rateLimit);
      Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
    }

    if (!access.hasAccess) {
      if (access.reason === "rate_limited") {
        const retryAfter = Math.ceil(((access.rateLimit?.retryAfterMs || 60_000) / 1000));
        res.setHeader("Retry-After", String(retryAfter));
        return res.status(429).json({
          error: "Too Many Requests",
          reason: "rate_limited",
          retryAfter,
          resetAt: access.rateLimit?.resetTime,
        });
      }

      return res.status(403).json({
        error: "Access Denied",
        reason: access.reason || "no_cookie",
        message: "Inner Circle access required",
      });
    }

    // Security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Access-Level", "inner-circle");

    return handler(req, res);
  };
}

/* -------------------------------------------------------------------------- */
/* DEFAULT HANDLER (EXAMPLE)                                                  */
/* -------------------------------------------------------------------------- */

const protectedContentHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const access = (req as any).innerCircleAccess as InnerCircleAccess | undefined;
  const ip = access?.userData?.ip || "unknown";

  return res.status(200).json({
    success: true,
    message: "Welcome to the Inner Circle",
    accessedBy: ip,
    accessedAt: new Date().toISOString(),
    protectedContent: [
      { id: 1, title: "Exclusive Strategy", content: "..." },
      { id: 2, title: "Private Analysis", content: "..." },
      { id: 3, title: "Member-only Resources", content: "..." },
    ],
  });
};

export default withInnerCircleAccess(protectedContentHandler, {
  requireAuth: true,
  rateLimitConfig: {
    windowMs: 60_000,
    limit: 30,
    keyPrefix: "protected_content",
  },
});