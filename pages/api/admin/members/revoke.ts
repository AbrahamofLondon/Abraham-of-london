// pages/api/admin/members/revoke.ts — Bulk active-key revoke by memberId
//
// Unlike /api/admin/inner-circle/revoke (which accepts a raw AL-key),
// this endpoint revokes every active key attached to an InnerCircleMember
// by the member's DB id. Intended for the admin-dashboard Revoke Key
// action where the admin UI only holds the member row, not the raw key.

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

type ApiResponse =
  | { ok: true; memberId: string; revokedCount: number }
  | { ok: false; error: string; code?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  const isInternal = Boolean((session as any)?.aol?.isInternal);

  if (!session || !isInternal) {
    return res.status(403).json({
      ok: false,
      error: "Forbidden",
      code: "ADMIN_REQUIRED",
    });
  }

  const { memberId } = (req.body ?? {}) as { memberId?: string };

  if (!memberId || typeof memberId !== "string") {
    return res
      .status(400)
      .json({ ok: false, error: "memberId required", code: "BAD_REQUEST" });
  }

  try {
    const result = await prisma.innerCircleKey.updateMany({
      where: { memberId, status: "active" },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        revokedReason: "admin_revoke",
      },
    });

    return res.status(200).json({
      ok: true,
      memberId,
      revokedCount: result.count,
    });
  } catch (error) {
    console.error("[ADMIN_MEMBERS_REVOKE_ERROR]", error);
    return res.status(500).json({
      ok: false,
      error: "Revoke failed",
      code: "REVOKE_FAILED",
    });
  }
}
