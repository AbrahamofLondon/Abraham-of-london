/**
 * pages/api/organisation/accept-invite.ts
 *
 * Accepts an organisation invite using a token.
 *
 * POST /api/organisation/accept-invite
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { acceptInvite } from "@/lib/product/organisation-lite";

type Response =
  | { ok: true; organisationId: string }
  | { ok: false; error: string; reason?: string };

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

  const { token } = req.body as { token?: string };
  if (!token) {
    return res.status(400).json({ ok: false, error: "Token is required" });
  }

  try {
    const result = await acceptInvite({
      token,
      email: identity.email,
      userId: identity.subjectId,
    });

    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.reason, reason: result.reason });
    }

    return res.status(200).json({ ok: true, organisationId: result.organisationId });
  } catch (error) {
    console.error("[organisation/accept-invite]", error);
    return res.status(500).json({ ok: false, error: "Failed to accept invite" });
  }
}
