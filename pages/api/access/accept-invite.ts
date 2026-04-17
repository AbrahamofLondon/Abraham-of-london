/**
 * POST /api/access/accept-invite
 *
 * Body: { token: string }
 * Requires authenticated session.
 * Validates invite token, checks email binding, issues entitlements.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redeemInvite } from "@/lib/access/invite-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  const userId = (session?.user as any)?.id;
  const userEmail = session?.user?.email;

  if (!userId || !userEmail) {
    return res.status(401).json({ ok: false, error: "Authentication required" });
  }

  const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
  if (!token) {
    return res.status(400).json({ ok: false, error: "Invite token is required" });
  }

  const result = await redeemInvite(token, userId, userEmail);

  if (!result.ok) {
    const statusMap: Record<string, number> = {
      INVALID_INVITE: 404,
      INVITE_EXPIRED: 410,
      INVITE_REVOKED: 410,
      INVITE_REDEEMED: 409,
      INVITE_DEPLETED: 409,
      EMAIL_MISMATCH: 403,
    };

    return res.status(statusMap[result.error] ?? 400).json({
      ok: false,
      error: result.error,
    });
  }

  return res.status(200).json({
    ok: true,
    granted: result.grants,
  });
}
