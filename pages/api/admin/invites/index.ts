/**
 * GET /api/admin/invites
 *
 * List all access invitations for admin dashboard.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/access/require-admin";
import { prisma } from "@/lib/prisma.server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const invites = await prisma.accessInvite.findMany({
      orderBy: { issuedAt: "desc" },
    });

    return res.status(200).json({
      ok: true,
      invites: invites.map((inv) => ({
        id: inv.id,
        recipientEmail: inv.recipientEmail,
        status: inv.status,
        grants: inv.grants,
        maxUses: inv.maxUses,
        uses: inv.uses,
        issuedBy: inv.issuedBy,
        issuedAt: inv.issuedAt.toISOString(),
        expiresAt: inv.expiresAt?.toISOString() ?? null,
        redeemedAt: inv.redeemedAt?.toISOString() ?? null,
        redeemedByUserId: inv.redeemedByUserId,
        emailSentAt: inv.emailSentAt?.toISOString() ?? null,
        emailError: inv.emailError,
        createdAt: inv.createdAt.toISOString(),
      })),
    });
  } catch {
    return res.status(500).json({ ok: false, error: "Failed to load invitations" });
  }
}
