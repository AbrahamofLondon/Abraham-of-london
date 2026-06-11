// pages/api/retainers/readiness.ts
// POST — create retainer readiness candidate from intake form.
// No auth required — consent checkbox governs submission.
// Creates RetainerReadinessEvaluation with readinessClass=CANDIDATE only.
// No automatic approval. No contract creation.
import type { NextApiRequest, NextApiResponse } from "next";
import {
  validateReadinessIntake,
  type ReadinessIntakeInput,
} from "@/lib/retainers/retainer-pipeline-contracts";
import { createReadinessCandidate } from "@/lib/retainers/retainer-pipeline-service";

function s(v: unknown, max = 2000): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const body = req.body ?? {};

  const input: Partial<ReadinessIntakeInput> = {
    organisationType:            s(body.organisationType),
    decisionPressureFrequency:   s(body.decisionPressureFrequency),
    activeDecisionsCount:        s(body.activeDecisionsCount),
    unresolvedRisks:             s(body.unresolvedRisks),
    priorBoardroomOrderId:       s(body.priorBoardroomOrderId),
    priorProductUse:             s(body.priorProductUse),
    monthlyOversightNeed:        s(body.monthlyOversightNeed),
    urgencyLevel:                s(body.urgencyLevel),
    governanceContext:           s(body.governanceContext),
    contactEmail:                s(body.contactEmail, 200),
    consentToReview:             body.consentToReview === true,
  };

  const validation = validateReadinessIntake(input);
  if (!validation.valid) {
    return res.status(400).json({ ok: false, error: "INCOMPLETE_INTAKE", missing: validation.missing });
  }

  try {
    const result = await createReadinessCandidate(input as ReadinessIntakeInput);
    return res.status(201).json({
      ok: true,
      evaluationId: result.id,
      status: "CANDIDATE",
      message: "Your readiness review has been submitted. Our team will review it and be in touch.",
    });
  } catch (error) {
    console.error("[RETAINER_READINESS_INTAKE]", error);
    return res.status(500).json({ ok: false, error: "SUBMISSION_FAILED" });
  }
}
