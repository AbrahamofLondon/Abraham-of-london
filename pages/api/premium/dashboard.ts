// pages/api/premium/dashboard.ts — SSOT enforced API
import type { NextApiRequest, NextApiResponse } from "next";
import { withInnerCircleAccess } from "@/lib/server/with-inner-circle-access";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({ ok: true });
}

export default withInnerCircleAccess(handler, {
  requireAuth: true,
  requiredTier: "client",
});