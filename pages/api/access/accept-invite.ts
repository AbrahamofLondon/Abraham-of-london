import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuthenticatedApi } from "@/lib/access/server";
import { redeemInvite } from "@/lib/access/invite-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const resolved = await requireAuthenticatedApi(req, res);
  if (!resolved) return;

  const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
  if (!token) {
    return res.status(400).json({ ok: false, error: "INVITE_TOKEN_REQUIRED" });
  }

  const result = await redeemInvite(
    token,
    resolved.access.userId as string,
    resolved.session?.user?.email ?? resolved.access.email ?? "",
  );

  if (!result.ok) {
    const statusMap: Record<string, number> = {
      INVALID_INVITE: 404,
      INVITE_EXPIRED: 410,
      INVITE_REVOKED: 410,
      INVITE_REDEEMED: 409,
      INVITE_DEPLETED: 409,
      EMAIL_MISMATCH: 403,
      INVALID_INVITE_FORMAT: 500,
    };

    return res.status(statusMap[result.error] ?? 400).json({
      ok: false,
      error: result.error,
    });
  }

  return res.status(200).json({
    ok: true,
    granted: result.grants,
    inviteId: result.inviteId,
  });
}
