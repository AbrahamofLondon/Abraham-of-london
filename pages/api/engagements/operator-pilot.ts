/**
 * POST /api/engagements/operator-pilot — submit a pilot intake.
 * Customer status lookup is handled by /api/engagements/operator-pilot-status-session and /api/engagements/operator-pilot-status; secrets are never accepted in URLs.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { qualifyPilotIntake, type PilotIntake } from "@/lib/engagements/operator-pilot-qualification";
import { savePilotIntake, toCustomerStatus } from "@/lib/engagements/pilot-intake-store.composed";
import { track } from "@/lib/analytics/track";
import { recordFunnelEvent } from "@/lib/demo/funnel-event-store.composed";

function coerceIntake(body: any): PilotIntake {
  return {
    organisation: String(body?.organisation ?? "").trim(),
    role: String(body?.role ?? "").trim(),
    authorityToEngage: Boolean(body?.authorityToEngage),
    decisionDomain: String(body?.decisionDomain ?? "").trim(),
    materiality: body?.materiality ?? "MODERATE",
    decisionStage: body?.decisionStage ?? "FRAMING",
    affectedStakeholders: String(body?.affectedStakeholders ?? "").trim(),
    decisionDeadline: body?.decisionDeadline ? String(body.decisionDeadline) : null,
    existingEvidence: String(body?.existingEvidence ?? "").trim(),
    knownContradictions: String(body?.knownContradictions ?? "").trim(),
    governanceSensitivity: body?.governanceSensitivity ?? "SOME",
    confidentialityRequired: Boolean(body?.confidentialityRequired),
    desiredOutcome: String(body?.desiredOutcome ?? "").trim(),
    willingToParticipateInCheckpoints: Boolean(body?.willingToParticipateInCheckpoints),
    contactEmail: String(body?.contactEmail ?? "").trim(),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const intake = coerceIntake(req.body);
    const qualification = qualifyPilotIntake(intake);
    if (qualification.status === "INCOMPLETE") {
      return res.status(422).json({ error: "Intake incomplete", qualification });
    }
    const record = await savePilotIntake(intake, qualification);
    track("operator_pilot_intake_submitted", { qualificationStatus: qualification.status });
    try {
      await recordFunnelEvent({
        eventType: record.reviewStatus === "MORE_INFORMATION_REQUIRED" ? "PILOT_MORE_INFO_REQUIRED" : "PILOT_SUBMITTED",
        sessionId: typeof req.body?.sessionId === "string" ? req.body.sessionId.slice(0, 64) : `api_${record.reference}`,
        sourceRoute: "/engagements/operator-pilot",
      });
    } catch { /* analytics cannot block intake */ }
    return res.status(201).json({
      reference: record.reference,
      qualificationStatus: qualification.status,
      reviewStatus: record.reviewStatus,
      currentState: record.reviewStatus,
      nextStep: toCustomerStatus(record).nextExpectedStep,
      statusAccess: record.statusSecret ? { statusUrl: "/engagements/operator-pilot-status", secret: record.statusSecret, expiresAt: record.statusSecretExpiresAt } : null,
      reasons: qualification.reasons,
    });
  } catch (err) {
    console.error("[operator-pilot] submission failed:", err);
    return res.status(500).json({ error: "Submission could not be recorded." });
  }
}
