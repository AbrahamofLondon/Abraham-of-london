/**
 * pages/api/organisation/invite.ts
 *
 * Invites a member to an organisation.
 *
 * POST /api/organisation/invite
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { inviteMember, type OrgLiteRole } from "@/lib/product/organisation-lite";

type Response =
  | { ok: true; inviteId: string; token: string }
  | { ok: false; error: string; code?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.email) {
    return res.status(401).json({ ok: false, error: "Authentication required" });
  }

  const { organisationId, recipientEmail, role } = req.body as {
    organisationId?: string;
    recipientEmail?: string;
    role?: OrgLiteRole;
  };

  if (!organisationId || !recipientEmail || !role) {
    return res.status(400).json({ ok: false, error: "organisationId, recipientEmail, and role are required" });
  }

  const validRoles: OrgLiteRole[] = ["OWNER", "ADMIN", "CONTRIBUTOR", "VIEWER", "AUDITOR"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ ok: false, error: "Invalid role" });
  }

  // Professional entitlement check for organisation invites
  const { checkActionEntitlement } = await import("@/lib/product/action-entitlement");
  const entitlement = await checkActionEntitlement(identity.email, "organisation_invite");
  if (!entitlement.allowed) {
    return res.status(403).json({ ok: false, error: entitlement.message, code: "PROFESSIONAL_REQUIRED" });
  }

  try {
    const result = await inviteMember({
      organisationId,
      inviterEmail: identity.email,
      recipientEmail,
      role,
    });

    return res.status(200).json({ ok: true, inviteId: result.inviteId, token: result.token });
  } catch (error) {
    console.error("[organisation/invite]", error);
    return res.status(500).json({ ok: false, error: "Failed to invite member" });
  }
}
