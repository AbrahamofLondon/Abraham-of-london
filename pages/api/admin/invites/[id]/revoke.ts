/**
 * POST /api/admin/invites/[id]/revoke
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/access/require-admin";
import { revokeInvite } from "@/lib/access/invite-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const inviteId = typeof req.query.id === "string" ? req.query.id : "";
  if (!inviteId) {
    return res.status(400).json({ ok: false, error: "Invite ID is required" });
  }

  try {
    await revokeInvite(inviteId, admin.email ?? admin.userId, req.body?.reason);
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, error: "Failed to revoke invitation" });
  }
}
