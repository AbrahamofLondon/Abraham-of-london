// pages/api/admin/members/upgrade.ts — Direct member tier upgrade
//
// This is the admin-dashboard-facing upgrade path. Unlike the legacy
// /api/admin/users/upgrade.ts (which requires a prior audit-log
// request record via `requestId`), this endpoint performs a direct
// tier update on an InnerCircleMember by id.

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { AccessTier } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

type ApiResponse =
  | { ok: true; memberId: string; newTier: string }
  | { ok: false; error: string; code?: string };

const bodySchema = z.object({
  memberId: z.string().trim().min(1).max(128),
  newTier: z.nativeEnum(AccessTier),
}).strict();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-members-upgrade" });
  if (!session) return;

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid request", code: "BAD_REQUEST" });
  }

  const { memberId, newTier } = parsed.data;

  try {
    await prisma.innerCircleMember.update({
      where: { id: memberId },
      data: { tier: newTier },
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
