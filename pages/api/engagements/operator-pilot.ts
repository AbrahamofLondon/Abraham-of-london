/**
 * POST /api/engagements/operator-pilot — submit a pilot intake.
 * Customer status lookup is handled by /api/engagements/operator-pilot-status-session and /api/engagements/operator-pilot-status; secrets are never accepted in URLs.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { qualifyPilotIntake } from "@/lib/engagements/operator-pilot-qualification";
import { parsePilotIntakeRequest, type PilotIntakeSuccessResponse } from "@/lib/engagements/operator-pilot-api-contract";
import { savePilotIntake, toCustomerStatus } from "@/lib/engagements/pilot-intake-store.composed";
import { track } from "@/lib/analytics/track";
import { recordFunnelEvent } from "@/lib/demo/funnel-event-store.composed";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const parsed = parsePilotIntakeRequest(req.body);
    const { sessionId, idempotencyKey, ...intake } = parsed;
    const qualification = qualifyPilotIntake(intake);
    if (qualification.status === "INCOMPLETE") {
      return res.status(422).json({ error: "Intake incomplete", qualification });
    }
    const record = await savePilotIntake(intake, qualification, { idempotencyKey });
    track("operator_pilot_intake_submitted", { qualificationStatus: qualification.status });
    try {
      await recordFunnelEvent({
        eventType: record.reviewStatus === "MORE_INFORMATION_REQUIRED" ? "PILOT_MORE_INFO_REQUIRED" : "PILOT_SUBMITTED",
        sessionId: sessionId ?? `api_${record.reference}`,
        sourceRoute: "/engagements/operator-pilot",
      });
    } catch { /* analytics cannot block intake */ }
    const response: PilotIntakeSuccessResponse = {
      reference: record.reference,
      qualificationStatus: qualification.status,
      reviewStatus: record.reviewStatus,
      currentState: record.reviewStatus,
      nextStep: toCustomerStatus(record).nextExpectedStep,
      statusAccess: record.statusSecret ? { statusUrl: "/engagements/operator-pilot-status", secret: record.statusSecret, expiresAt: record.statusSecretExpiresAt } : null,
      reasons: qualification.reasons,
      duplicateClassification: record.duplicateClassification ?? "NEW_INTAKE",
    };
    return res.status(record.duplicateClassification === "EXACT_RETRY" ? 200 : 201).json(response);
  } catch (err) {
    if (err instanceof Error && err.message === "PILOT_IDEMPOTENCY_CONFLICT") {
      return res.status(409).json({ error: "This idempotency key was already used for different pilot intake content.", code: "PILOT_IDEMPOTENCY_CONFLICT" });
    }
    console.error("[operator-pilot] submission failed:", err);
    return res.status(500).json({ error: "Submission could not be recorded." });
  }
}
