/**
 * pages/api/trial/status.ts
 *
 * Returns the current Professional trial status for the authenticated user.
 *
 * GET /api/trial/status
 *
 * Response:
 *   { ok: true, trial: { status, startedAt, endsAt, daysRemaining } }
 *   { ok: false, reason: "AUTH_REQUIRED" }
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { getTrialInfo } from "@/lib/product/professional-trial";

type Response = {
  ok: boolean;
  trial: {
    status: string;
    startedAt: string | null;
    endsAt: string | null;
    daysRemaining: number | null;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, trial: { status: "NONE", startedAt: null, endsAt: null, daysRemaining: null } });
  }

  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.email) {
    return res.status(401).json({ ok: false, trial: { status: "NONE", startedAt: null, endsAt: null, daysRemaining: null } });
  }

  const trial = await getTrialInfo(identity.email);
  return res.status(200).json({ ok: true, trial });
}
