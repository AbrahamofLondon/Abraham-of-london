/**
 * POST /api/admin/invites/create
 *
 * Admin creates an access invitation and sends it by email.
 * Body: { recipientEmail, grants, maxUses?, expiresAt?, sendEmail? }
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/access/require-admin";
import { createInvite, markInviteEmailSent } from "@/lib/access/invite-service";
import { sendInviteEmail } from "@/lib/access/invite-mail";
import type { EntitlementGrant } from "@/lib/access/types";

function isGrantArray(value: unknown): value is EntitlementGrant[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item: any) =>
        item &&
        typeof item === "object" &&
        (item.type === "tier" || item.type === "product" || item.type === "artifact") &&
        typeof item.key === "string" &&
        item.key.length > 0,
    )
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { recipientEmail, grants, maxUses, expiresAt, sendEmail = true } = req.body ?? {};

  if (!recipientEmail || typeof recipientEmail !== "string" || !recipientEmail.includes("@")) {
    return res.status(400).json({ ok: false, error: "Valid recipient email is required" });
  }

  if (!isGrantArray(grants) || grants.length === 0) {
    return res.status(400).json({ ok: false, error: "At least one grant is required" });
  }

  const invite = await createInvite({
    recipientEmail,
    grants,
    maxUses: typeof maxUses === "number" ? maxUses : 1,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    issuedBy: admin.email ?? admin.userId,
  });

  // Build invite URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "https://www.abrahamoflondon.org";
  const inviteUrl = `${baseUrl}/access/accept?token=${encodeURIComponent(invite.token)}`;

  // Send email if requested
  let emailStatus: { sent: boolean; error?: string } = { sent: false };

  if (sendEmail !== false) {
    const emailResult = await sendInviteEmail({
      recipientEmail: invite.recipientEmail,
      inviteUrl,
      grants,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    await markInviteEmailSent(invite.id, emailResult.ok ? undefined : emailResult.error);
    emailStatus = { sent: emailResult.ok, error: emailResult.error };
  }

  return res.status(200).json({
    ok: true,
    id: invite.id,
    recipientEmail: invite.recipientEmail,
    inviteUrl,
    emailStatus,
  });
}
