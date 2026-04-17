/**
 * POST /api/access/redeem-key
 *
 * Body: { code: string }
 * Requires authenticated session.
 *
 * Validates the access key, issues entitlements, increments usage.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { redeemAccessKey } from "@/lib/access/entitlements";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }

  const userId = (session.user as any).id || (session as any).aol?.memberId;
  if (!userId) {
    return res.status(401).json({ error: "NO_USER_ID" });
  }

  const { code } = req.body || {};
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "MISSING_CODE" });
  }

  const result = await redeemAccessKey(userId, code.trim());

  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(200).json({
    ok: true,
    grants: result.grants,
  });
}
