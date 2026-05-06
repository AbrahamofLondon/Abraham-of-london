// pages/api/admin/members/revoke.ts — Bulk active-key revoke by memberId
//
// Unlike /api/admin/inner-circle/revoke (which accepts a raw AL-key),
// this endpoint revokes every active key attached to an InnerCircleMember
// by the member's DB id. Intended for the admin-dashboard Revoke Key
// action where the admin UI only holds the member row, not the raw key.

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

type ApiResponse =
  | { ok: true; memberId: string; revokedCount: number }
  | { ok: false; error: string; code?: string };

const bodySchema = z.object({
  memberId: z.string().trim().min(1).max(128),
}).strict();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-members-revoke" });
  if (!session) return;

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "memberId required", code: "BAD_REQUEST" });
  }

  const { memberId } = parsed.data;

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
