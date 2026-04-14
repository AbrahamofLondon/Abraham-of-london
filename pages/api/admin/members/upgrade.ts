// pages/api/admin/members/upgrade.ts — Direct member tier upgrade
//
// This is the admin-dashboard-facing upgrade path. Unlike the legacy
// /api/admin/users/upgrade.ts (which requires a prior audit-log
// request record via `requestId`), this endpoint performs a direct
// tier update on an InnerCircleMember by id.

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { AccessTier } from "@prisma/client";

import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

type ApiResponse =
  | { ok: true; memberId: string; newTier: string }
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

  const { memberId, newTier } =
    (req.body ?? {}) as { memberId?: string; newTier?: string };

  if (!memberId || typeof memberId !== "string") {
    return res
      .status(400)
      .json({ ok: false, error: "memberId required", code: "BAD_REQUEST" });
  }
  if (!newTier || typeof newTier !== "string") {
    return res
      .status(400)
      .json({ ok: false, error: "newTier required", code: "BAD_REQUEST" });
  }

  try {
    await prisma.innerCircleMember.update({
      where: { id: memberId },
      data: { tier: newTier as AccessTier },
    });

    return res.status(200).json({ ok: true, memberId, newTier });
  } catch (error) {
    console.error("[ADMIN_MEMBERS_UPGRADE_ERROR]", error);
    return res.status(500).json({
      ok: false,
      error: "Upgrade failed",
      code: "UPGRADE_FAILED",
    });
  }
}
