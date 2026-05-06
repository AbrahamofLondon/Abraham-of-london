/* pages/api/admin/users/upgrade.ts — Tier Elevation Engine */
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { AccessTier } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { auditLogger } from "@/lib/server/db/audit";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

const bodySchema = z.object({
  userId: z.string().trim().min(1).max(128),
  newTier: z.nativeEnum(AccessTier),
  requestId: z.string().trim().min(1).max(128),
}).strict();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const session = await requireAdminServer(req, res, { routeKey: "admin-users-upgrade" });
  if (!session) return;

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "INVALID_REQUEST" });
  }

  const { userId, newTier, requestId } = parsed.data;

  try {
    const result = await prisma.$transaction([
      // 1. Update the Member's Tier
      prisma.innerCircleMember.update({
        where: { id: userId },
        data: { tier: newTier }
      }),
      // 2. Mark the Request as Resolved in Audit Logs
      prisma.systemAuditLog.update({
        where: { id: requestId },
        data: { status: "approved" }
      })
    ]);

    // 3. Log the Administrative Action
    await auditLogger.log({
      action: "USER_TIER_UPGRADE",
      severity: "info",
      actorId: session?.user?.id,
      resourceId: userId,
      status: "success",
      metadata: { newTier, approvedBy: session?.user?.email }
    });

    return res.status(200).json({ ok: true, user: result[0] });
  } catch (error) {
    console.error("[UPGRADE_ERROR]", error);
    return res.status(500).json({ ok: false, message: "Upgrade failed." });
  }
}
