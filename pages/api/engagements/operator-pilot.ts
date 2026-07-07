/**
 * POST /api/engagements/operator-pilot — submit a pilot intake (server-side qualification
 *   + durable persistence). Returns a reference the applicant uses to check status.
 * GET  /api/engagements/operator-pilot?ref=... — customer status lookup (requires the
 *   exact reference; no enumeration of others' submissions).
 *
 * Qualification is re-run server-side (never trust a client-declared status), and an
 * INCOMPLETE intake is rejected with 422 — it is not a real submission.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { qualifyPilotIntake, type PilotIntake } from "@/lib/engagements/operator-pilot-qualification";
import { savePilotIntake, getPilotIntakeByRef } from "@/lib/engagements/pilot-intake-store";
import { track } from "@/lib/analytics/track";

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
  if (req.method === "GET") {
    const ref = typeof req.query.ref === "string" ? req.query.ref : "";
    if (!ref) return res.status(400).json({ error: "reference required" });
    const record = getPilotIntakeByRef(ref);
    if (!record) return res.status(404).json({ error: "not found" });
    // customer-safe projection — do not leak operator note/owner internals
    return res.status(200).json({
      reference: record.reference,
      qualificationStatus: record.qualification.status,
      reviewStatus: record.reviewStatus,
      nextStep: record.qualification.nextStep,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const intake = coerceIntake(req.body);
    const qualification = qualifyPilotIntake(intake); // authoritative, server-side
    if (qualification.status === "INCOMPLETE") {
      return res.status(422).json({ error: "Intake incomplete", qualification });
    }
    const record = savePilotIntake(intake, qualification);
    track("operator_pilot_intake_submitted", { qualificationStatus: qualification.status });
    return res.status(201).json({
      reference: record.reference,
      qualificationStatus: qualification.status,
      reviewStatus: record.reviewStatus,
      nextStep: qualification.nextStep,
      reasons: qualification.reasons,
    });
  } catch (err) {
    console.error("[operator-pilot] submission failed:", err);
    return res.status(500).json({ error: "Submission could not be recorded." });
  }
}
