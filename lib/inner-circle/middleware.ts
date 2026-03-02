/* lib/inner-circle/middleware.ts — SSOT Access Middleware (Pages-safe) */
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeRequiredTier, normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext } from "@/lib/server/auth/tokenStore.postgres";

export type InnerCircleAccess = {
  ok: boolean;
  userTier: AccessTier;
  requiredTier: AccessTier;
  reason?: "requires_auth" | "insufficient_tier" | "expired" | "internal_error";
};

async function getTierFromReq(req: NextApiRequest): Promise<{ tier: AccessTier; hasSession: boolean }> {
  const sessionId = readAccessCookie(req);
  if (!sessionId) return { tier: "public", hasSession: false };

  const ctx = await getSessionContext(sessionId);
  if (!ctx || !ctx.tier) return { tier: "public", hasSession: false };

  return { tier: normalizeUserTier(ctx.tier), hasSession: true };
}

export async function requireTier(req: NextApiRequest, requiredTier: AccessTier | string): Promise<InnerCircleAccess> {
  try {
    const required = normalizeRequiredTier(requiredTier);
    const { tier: userTier, hasSession } = await getTierFromReq(req);

    if (required === "public") return { ok: true, userTier, requiredTier: required };

    if (!hasSession || userTier === "public") {
      return { ok: false, userTier: "public", requiredTier: required, reason: "requires_auth" };
    }

    if (!hasAccess(userTier, required)) {
      return { ok: false, userTier, requiredTier: required, reason: "insufficient_tier" };
    }

    return { ok: true, userTier, requiredTier: required };
  } catch {
    return { ok: false, userTier: "public", requiredTier: normalizeRequiredTier(requiredTier), reason: "internal_error" };
  }
}

/**
 * Wrap an API handler with SSOT tier enforcement.
 */
export function withTierAccess(
  handler: NextApiHandler,
  options?: { requiredTier?: AccessTier | string }
): NextApiHandler {
  const requiredTier = options?.requiredTier ?? "member";

  return async function wrapped(req: NextApiRequest, res: NextApiResponse) {
    const access = await requireTier(req, requiredTier);

    if (!access.ok) {
      const status = access.reason === "requires_auth" ? 401 : 403;
      return res.status(status).json({
        ok: false,
        error: access.reason === "requires_auth" ? "Authentication required" : "Insufficient clearance",
        requiredTier: access.requiredTier,
        userTier: access.userTier,
      });
    }

    return handler(req, res);
  };
}