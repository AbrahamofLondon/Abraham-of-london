// pages/api/premium/content.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withInnerCircleAccess } from "@/lib/server/withInnerCircleAccess";

const PREMIUM_CONTENT = {
  reports: [
    {
      id: "report-001",
      title: "Global Market Intelligence Q4",
      pages: 42,
      published: "2024-01-15",
    },
  ],
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const access = (req as any).innerCircleAccess;

  if (req.method !== "GET") {
    return res.status(405).end();
  }

  return res.status(200).json({
    success: true,
    tier: access.tier,
    data: PREMIUM_CONTENT,
  });
}

export default withInnerCircleAccess(handler, {
  requireTier: ["patron", "founder"],
});
