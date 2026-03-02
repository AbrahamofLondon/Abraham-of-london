// pages/api/premium/dashboard.ts — SSOT enforced API
import type { NextApiRequest, NextApiResponse } from "next";
import withInnerCircleAccess from "@/lib/server/withInnerCircleAccess";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Your existing dashboard logic goes here
  return res.status(200).json({ ok: true });
}

// Require client+ (premium)
export default withInnerCircleAccess(handler, { requireAuth: true, requireTier: ["client"] });