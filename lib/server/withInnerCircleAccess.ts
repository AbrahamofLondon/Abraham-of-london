// lib/server/withInnerCircleAccess.ts
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { getInnerCircleAccess } from "@/lib/inner-circle/access";

export function withInnerCircleAccess(
  handler: NextApiHandler,
  options?: { requireTier?: ("patron" | "founder")[] }
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const access = await getInnerCircleAccess(req);
    (req as any).innerCircleAccess = access;

    if (!access.hasAccess) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (options?.requireTier && !options.requireTier.includes(access.tier!)) {
      return res.status(403).json({
        error: "Premium Access Required",
        upgradeUrl: "/inner-circle/upgrade",
      });
    }

    return handler(req, res);
  };
}