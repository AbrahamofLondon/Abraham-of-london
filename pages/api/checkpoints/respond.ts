import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { recordCheckpointResponse } from "@/lib/product/checkpoint-service";
import type { RespondToCheckpointInput } from "@/lib/product/checkpoint-scheduler-contract";
import { createFieldProvenance } from "@/lib/product/field-provenance-contract";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.email) {
    return res.status(401).json({ ok: false, error: "AUTHENTICATION_REQUIRED" });
  }

  const body = req.body as Partial<RespondToCheckpointInput> | null;
  if (!body?.responseStatus) {
    return res.status(400).json({ ok: false, error: "CHECKPOINT_STATUS_REQUIRED" });
  }
  if (!body?.checkpointId && !body?.strategyRoomSessionId && !body?.caseId && !body?.executiveRunId && !body?.journeyId) {
    return res.status(400).json({ ok: false, error: "CHECKPOINT_REFERENCE_REQUIRED" });
  }

  try {
    const outcome = await recordCheckpointResponse({
      checkpointId: body.checkpointId,
      lookupMode: body.lookupMode,
      strategyRoomSessionId: body.strategyRoomSessionId,
      caseId: body.caseId,
      executiveRunId: body.executiveRunId,
      journeyId: body.journeyId,
      responseStatus: body.responseStatus,
      evidenceNote: body.evidenceNote,
      blockerDescription: body.blockerDescription,
      whatChanged: body.whatChanged,
      whatShouldSystemRemember: body.whatShouldSystemRemember,
      email: identity.email,
      userId: identity.subjectId ?? undefined,
    });

    if (!outcome) {
      return res.status(404).json({ ok: false, error: "CHECKPOINT_NOT_FOUND" });
    }

    return res.status(200).json({
      ok: true,
      checkpointId: outcome.checkpointId,
      classification: outcome.classification,
      dataQuality: "CASE_SCOPED",
      evidencePosture: "USER_REPORTED",
      provenance: [
        createFieldProvenance({
          fieldKey: "checkpoint.responseStatus",
          sourceSurface: "DECISION_CENTRE",
          sourceLabel: "Checkpoint response",
          capturedAt: new Date().toISOString(),
          caseId: body.caseId ?? null,
          journeyId: body.journeyId ?? null,
          strategyRoomSessionId: body.strategyRoomSessionId ?? null,
          executiveRunId: body.executiveRunId ?? null,
          scopeType: "CHECKPOINT",
          scopeId: outcome.checkpointId,
          evidencePosture: "USER_REPORTED",
          confidenceLabel: "REPORTED",
        }),
      ],
      emptyState: null,
      message: "Checkpoint response recorded.",
    });
  } catch (error) {
    console.error("[checkpoint-respond]", error);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}
