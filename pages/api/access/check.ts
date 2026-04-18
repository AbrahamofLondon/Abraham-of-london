import type { NextApiRequest, NextApiResponse } from "next";
import type { AccessTier } from "@/lib/access/types";
import { canAccessTier } from "@/lib/access/checks";
import { normalizeTier } from "@/lib/access/tier";
import { resolveRequestAccess } from "@/lib/access/server";

type InnerCircleAccess = {
  hasAccess: boolean;
  reason:
    | "no_request"
    | "requires_auth"
    | "insufficient_tier"
    | "internal_error";
  tier?: AccessTier;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InnerCircleAccess>,
) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  if (req.method === "HEAD") {
    const { access } = await resolveRequestAccess(req, res);
    return res.status(access.permissions.isAuthenticated ? 200 : 401).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET", "HEAD"]);
    return res.status(405).json({ hasAccess: false, reason: "internal_error" });
  }

  const { access } = await resolveRequestAccess(req, res);
  const requiredTier = normalizeTier(
    typeof req.query.requiredTier === "string" ? req.query.requiredTier : "member",
  );

  if (!access.permissions.isAuthenticated) {
    return res.status(200).json({
      hasAccess: false,
      reason: "requires_auth",
      tier: access.tier,
    });
  }

  if (!canAccessTier(access, requiredTier)) {
    return res.status(200).json({
      hasAccess: false,
      reason: "insufficient_tier",
      tier: access.tier,
    });
  }

  return res.status(200).json({
    hasAccess: true,
    reason: "no_request",
    tier: access.tier,
  });
}
