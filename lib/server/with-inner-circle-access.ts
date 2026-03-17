// lib/server/with-inner-circle-access.ts
/**
 * Inner Circle access middleware with optional tier enforcement and rate limiting.
 * Pages API only.
 */

import type { NextApiRequest, NextApiResponse } from "next";

import {
  RATE_LIMIT_CONFIGS,
  withApiRateLimit,
} from "@/lib/server/rate-limit-unified";
import { hasAccess, normalizeUserTier } from "@/lib/access/tier-policy";

type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void> | void;

export type InnerCircleRequest = NextApiRequest & {
  innerCircleAccess?: {
    hasAccess: boolean;
    tier: string;
    userId: string | null;
    sessionId: string | null;
  };
};

type RateLimitConfig = Parameters<typeof withApiRateLimit>[1];

type Options = {
  requireAuth?: boolean;
  requiredTier?: string;
  rateLimitConfig?: RateLimitConfig | null;
};

function safeCookieString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function hasInnerCircleCookie(req: NextApiRequest): boolean {
  return req.cookies?.innerCircleAccess === "true";
}

function resolveTier(req: NextApiRequest): string {
  const rawTier =
    safeCookieString(req.cookies?.aol_tier) ||
    safeCookieString(req.cookies?.aol_ic_tier) ||
    safeCookieString(req.cookies?.inner_circle_tier) ||
    "public";

  return normalizeUserTier(rawTier);
}

function resolveUserId(req: NextApiRequest): string | null {
  return (
    safeCookieString(req.cookies?.aol_uid) ||
    safeCookieString(req.cookies?.userId) ||
    safeCookieString(req.cookies?.uid) ||
    null
  );
}

function resolveSessionId(req: NextApiRequest): string | null {
  return (
    safeCookieString(req.cookies?.aol_session_id) ||
    safeCookieString(req.cookies?.sessionId) ||
    safeCookieString(req.cookies?.sid) ||
    null
  );
}

function getFallbackRateLimitConfig(): RateLimitConfig | null {
  const candidate = (RATE_LIMIT_CONFIGS as Record<string, unknown>)["INNER_CIRCLE"];
  return candidate ? (candidate as RateLimitConfig) : null;
}

export function withInnerCircleAccess(
  handler: ApiHandler,
  options: Options = {}
): ApiHandler {
  const {
    requireAuth = true,
    requiredTier,
    rateLimitConfig,
  } = options;

  const resolvedRateLimitConfig: RateLimitConfig | null =
    rateLimitConfig ?? getFallbackRateLimitConfig();

  const protectedHandler: ApiHandler = async (
    req: NextApiRequest,
    res: NextApiResponse
  ) => {
    try {
      const cookieAccess = hasInnerCircleCookie(req);
      const tier = resolveTier(req);
      const userId = resolveUserId(req);
      const sessionId = resolveSessionId(req);

      (req as InnerCircleRequest).innerCircleAccess = {
        hasAccess: cookieAccess,
        tier,
        userId,
        sessionId,
      };

      if (requireAuth && !cookieAccess) {
        res.status(403).json({
          ok: false,
          error: "ACCESS_DENIED",
          message: "Inner circle access required",
        });
        return;
      }

      if (requiredTier && !hasAccess(tier, requiredTier)) {
        res.status(403).json({
          ok: false,
          error: "INSUFFICIENT_TIER",
          message: `Required tier: ${requiredTier}`,
          tier,
        });
        return;
      }

      await handler(req, res);
    } catch (error) {
      console.error("[withInnerCircleAccess] Error:", error);
      res.status(500).json({
        ok: false,
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  };

  if (resolvedRateLimitConfig) {
    return withApiRateLimit(protectedHandler, resolvedRateLimitConfig);
  }

  return protectedHandler;
}

export default withInnerCircleAccess;