/**
 * pages/api/trial/start.ts
 *
 * Starts a 7-day Professional trial for the authenticated user.
 *
 * POST /api/trial/start
 *
 * Response:
 *   { ok: true, trial: { status, startedAt, endsAt, daysRemaining } }
 *   { ok: false, reason: "AUTH_REQUIRED" | "TRIAL_ALREADY_ACTIVE" | "ALREADY_CONVERTED" | "INTERNAL_ERROR" }
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { startProfessionalTrial, type TrialInfo } from "@/lib/product/professional-trial";

type Response =
  | {
      ok: true;
      trial: TrialInfo;
    }
  | { ok: false; reason: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.email) {
    return res.status(401).json({ ok: false, reason: "AUTH_REQUIRED" });
  }

  const result = await startProfessionalTrial({
    email: identity.email,
    userId: identity.subjectId,
  });

  if (!result.ok) {
    if (result.reason === "TRIAL_ALREADY_ACTIVE" || result.reason === "ALREADY_CONVERTED") {
      return res.status(409).json(result);
    }
    return res.status(500).json(result);
  }

  return res.status(200).json(result);
}
