/**
 * pages/api/organisation/remove-member.ts
 *
 * Removes a member from an organisation.
 *
 * POST /api/organisation/remove-member
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { removeMember } from "@/lib/product/organisation-lite";

type Response =
  | { ok: true }
  | { ok: false; error: string };

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

  const { organisationId, membershipId } = req.body as {
    organisationId?: string;
    membershipId?: string;
  };

  if (!organisationId || !membershipId) {
    return res.status(400).json({ ok: false, error: "organisationId and membershipId are required" });
  }

  try {
    const result = await removeMember({
      organisationId,
      membershipId,
      requesterEmail: identity.email,
    });

    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.reason });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[organisation/remove-member]", error);
    return res.status(500).json({ ok: false, error: "Failed to remove member" });
  }
}
