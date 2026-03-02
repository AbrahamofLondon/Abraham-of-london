// lib/server/withInnerCircleAccess.ts — SSOT Access Wrapper (Pages API)
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeRequiredTier, normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext } from "@/lib/server/auth/tokenStore.postgres";

type Options = {
  requireAuth?: boolean;
  requireTier?: Array<AccessTier | string>; // legacy tolerated, normalized
};

export default function withInnerCircleAccess(handler: NextApiHandler, options: Options = {}) {
  const { requireAuth = true, requireTier = ["member"] } = options;

  const requiredMin: AccessTier = (() => {
    // Choose the highest required tier from the list
    const order: AccessTier[] = ["public", "member", "inner-circle", "client", "legacy", "architect", "owner"];
    const normalized = requireTier.map((t) => normalizeRequiredTier(t));
    let max: AccessTier = "public";
    for (const t of normalized) {
      if (order.indexOf(t) > order.indexOf(max)) max = t;
    }
    return max;
  })();

  return async function wrapped(req: NextApiRequest, res: NextApiResponse) {
    try {
      // Public endpoints can bypass
      if (!requireAuth && requiredMin === "public") {
        return handler(req, res);
      }

      const sessionId = readAccessCookie(req);
      if (!sessionId) {
        return res.status(401).json({ ok: false, reason: "Unauthorized" });
      }

      const ctx = await getSessionContext(sessionId);
      const userTier = normalizeUserTier(ctx.tier ?? ctx.member?.tier ?? "public");

      if (!hasAccess(userTier, requiredMin)) {
        return res.status(403).json({ ok: false, reason: "Forbidden" });
      }

      // Attach minimal context for downstream handlers
      (req as any).aol = {
        tier: userTier,
        member: ctx.member ?? null,
        session: ctx.session ?? null,
      };

      return handler(req, res);
    } catch {
      return res.status(401).json({ ok: false, reason: "Unauthorized" });
    }
  };
}