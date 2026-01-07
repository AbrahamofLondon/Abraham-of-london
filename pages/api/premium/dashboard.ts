// pages/api/premium/dashboard.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withInnerCircleAccess } from "@/lib/server/with-inner-circle-access";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const access = (req as any).innerCircleAccess;

  if (req.method !== "GET") return res.status(405).end();

  return res.status(200).json({
    success: true,
    viewer: { tier: access.tier, memberId: access.memberId },
    data: {
      userStats: {
        reportsAccessed: 0,
        masterclassesCompleted: 0,
        toolsUsed: 0,
        memberSince: access.expiresAt ? "unknown" : "unknown",
      },
      recentActivity: [],
    },
  });
}

export default withInnerCircleAccess(handler, { requireAuth: true, requireTier: ["patron", "founder"] });