// pages/api/inner-circle/self-revoke.ts — Member-facing self-revoke
//
// Authenticated members can revoke their own active access keys without
// the admin token required by /api/access/revoke. Auth derives entirely
// from the member's own aol_access cookie, validated via
// getSessionContext.

import type { NextApiRequest, NextApiResponse } from "next";

import { prisma } from "@/lib/prisma";
import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext } from "@/lib/server/auth/tokenStore.postgres";

type ApiResponse =
  | { ok: true; revokedCount: number }
  | { ok: false; error: string; code?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const cookieValue = readAccessCookie(req);
  if (!cookieValue) {
    return res
      .status(401)
      .json({ ok: false, error: "No active session", code: "NO_SESSION" });
  }

  const ctx = await getSessionContext(cookieValue);
  if (!ctx.ok || !ctx.valid || !ctx.memberId) {
    return res
      .status(401)
      .json({ ok: false, error: "No active session", code: "NO_SESSION" });
  }

  const { reason } = (req.body ?? {}) as { reason?: string };

  try {
    const result = await prisma.innerCircleKey.updateMany({
      where: { memberId: ctx.memberId, status: "active" },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        revokedReason: reason || "self_revoke",
      },
    });

    // Clear the aol_access cookie on the response
    res.setHeader(
      "Set-Cookie",
      "aol_access=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
    );

    return res.status(200).json({ ok: true, revokedCount: result.count });
  } catch (error) {
    console.error("[SELF_REVOKE_ERROR]", error);
    return res.status(500).json({
      ok: false,
      error: "Revoke failed",
      code: "REVOKE_FAILED",
    });
  }
}
