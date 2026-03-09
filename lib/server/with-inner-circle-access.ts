// lib/server/with-inner-circle-access.ts
/**
 * Inner Circle access middleware with optional rate limiting.
 * Pages API only.
 */

import type { NextApiRequest, NextApiResponse } from "next";

import {
  RATE_LIMIT_CONFIGS,
  withApiRateLimit,
} from "@/lib/server/rate-limit-unified";

type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void> | void;

type Options = {
  requireAuth?: boolean;
  rateLimitConfig?: unknown;
};

function hasInnerCircleCookie(req: NextApiRequest): boolean {
  return req.cookies?.innerCircleAccess === "true";
}

export function withInnerCircleAccess(
  handler: ApiHandler,
  options: Options = {}
): ApiHandler {
  const { requireAuth = true, rateLimitConfig } = options;

  const resolvedRateLimitConfig =
  rateLimitConfig ??
  (RATE_LIMIT_CONFIGS as Record<string, any>)["INNER_CIRCLE"] ??
  null;

  const protectedHandler: ApiHandler = async (
    req: NextApiRequest,
    res: NextApiResponse
  ) => {
    try {
      if (requireAuth && !hasInnerCircleCookie(req)) {
        res.status(403).json({
          ok: false,
          error: "Access Denied",
          message: "Inner circle access required",
        });
        return;
      }

      await handler(req, res);
    } catch (error) {
      console.error("[withInnerCircleAccess] Error:", error);
      res.status(500).json({
        ok: false,
        error: "Internal Server Error",
      });
    }
  };

  if (resolvedRateLimitConfig) {
    return withApiRateLimit(protectedHandler, resolvedRateLimitConfig);
  }

  return protectedHandler;
}

export default withInnerCircleAccess;