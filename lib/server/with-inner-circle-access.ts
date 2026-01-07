// lib/server/with-inner-circle-access.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { getInnerCircleAccess, type AccessTier } from "@/lib/inner-circle/access";
import { withApiRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/server/rate-limit-unified";

type Options = {
  requireAuth?: boolean; // default true
  requireTier?: AccessTier[]; // optional
};

export function withInnerCircleAccess(handler: NextApiHandler, options: Options = {}) {
  const requireAuth = options.requireAuth ?? true;

  const wrapped: NextApiHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    const access = await getInnerCircleAccess(req);
    (req as any).innerCircleAccess = access;

    if (!requireAuth) return handler(req, res);

    if (!access.hasAccess) {
      return res.status(access.reason === "rate_limited" ? 429 : 401).json({
        error: "Unauthorized",
        reason: access.reason,
        resetAt: access.rateLimit?.resetAt ? new Date(access.rateLimit.resetAt).toISOString() : undefined,
      });
    }

    if (options.requireTier && (!access.tier || !options.requireTier.includes(access.tier))) {
      return res.status(403).json({
        error: "Premium Access Required",
        reason: "tier_required",
        required: options.requireTier,
        current: access.tier ?? null,
        upgradeUrl: "/inner-circle/upgrade",
      });
    }

    return handler(req, res);
  };

  // Rate limit the endpoint itself (separate from auth limiter)
  return withApiRateLimit(wrapped, RATE_LIMIT_CONFIGS.CONTENT);
}