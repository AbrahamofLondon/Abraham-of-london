import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { resolveIdentity } from "@/lib/auth/resolve-identity";
import {
  loadOutcomeVerificationContext,
  submitOutcomeVerification,
} from "@/lib/product/outcome-verification-service";

const payloadSchema = z.object({
  token: z.string().trim().optional().nullable(),
  checkpointId: z.string().trim().optional().nullable(),
  caseId: z.string().trim().optional().nullable(),
  journeyId: z.string().trim().optional().nullable(),
  strategyRoomSessionId: z.string().trim().optional().nullable(),
  executiveRunId: z.string().trim().optional().nullable(),
  didAct: z.enum(["YES", "PARTIAL", "NO", "BLOCKED"]),
  changedState: z.enum(["IMPROVED", "UNCHANGED", "WORSENED", "UNKNOWN"]),
  whatChanged: z.string().trim().min(8).max(2400),
  evidenceSummary: z.string().trim().max(2400).optional().nullable(),
  systemDiagnosisAccuracy: z.enum(["ACCURATE", "PARTIAL", "INACCURATE"]),
  requiredMoveUsefulness: z.enum(["USEFUL", "PARTIAL", "NOT_USEFUL"]),
  rememberNote: z.string().trim().max(1800).optional().nullable(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token) {
      return res.status(400).json({ ok: false, error: "TOKEN_REQUIRED" });
    }
    const redirectUrl = `/account/proof-pack?outcomeToken=${encodeURIComponent(token)}`;
    return res.redirect(302, redirectUrl);
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.email) {
    return res.status(401).json({ ok: false, error: "AUTHENTICATION_REQUIRED" });
  }

  const parsed = payloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "INVALID_PAYLOAD",
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const result = await submitOutcomeVerification({
      email: identity.email,
      userId: identity.subjectId,
      request: parsed.data,
    });

    const context = await loadOutcomeVerificationContext({
      email: identity.email,
      userId: identity.subjectId,
      token: parsed.data.token,
      checkpointId: result.checkpointId,
      caseId: parsed.data.caseId,
      journeyId: parsed.data.journeyId,
      strategyRoomSessionId: parsed.data.strategyRoomSessionId,
      executiveRunId: parsed.data.executiveRunId,
    });

    return res.status(200).json({
      ok: true,
      record: result.record,
      checkpointId: result.checkpointId ?? null,
      checkpointResponseStatus: result.checkpointResponseStatus ?? null,
      calibration: result.calibration ?? null,
      context,
    });
  } catch (error) {
    console.error("[outcomes/verify]", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "OUTCOME_VERIFICATION_FAILED",
    });
  }
}
