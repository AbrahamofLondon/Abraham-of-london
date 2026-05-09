/**
 * POST /api/counsel/intake
 *
 * Submit a structured counsel intake.
 * Creates a counsel case from the user's evidence package + their submission.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { normaliseCounselIntakeEvidence } from "@/lib/product/field-provenance-normaliser";

const intakeSchema = z.object({
  userSummary: z.string().trim().min(20).max(3000),
  whatChangedSinceSystemAssessment: z.string().trim().max(2000).optional().or(z.literal("")),
  whatHumanCounselMustConsider: z.string().trim().min(20).max(3000),
  urgency: z.enum(["NORMAL", "TIME_SENSITIVE", "BOARD_OR_LEGAL_EXPOSURE", "CRITICAL"]),
  permissionToUseEvidencePackage: z.boolean(),
  whatDecisionRequiresCounsel: z.string().trim().min(20).max(3000),
  whatWouldMakeSuccessful: z.string().trim().max(2000).optional().or(z.literal("")),
  whatConstraintMustCounselRespect: z.string().trim().max(2000).optional().or(z.literal("")),
  whatAttemptedOutsideSystem: z.string().trim().max(2000).optional().or(z.literal("")),
  whoHasAuthorityToAct: z.string().trim().max(500).optional().or(z.literal("")),
  whatMustNotBeExposed: z.string().trim().max(2000).optional().or(z.literal("")),
  deadlineOrConsequenceWindow: z.string().trim().max(500).optional().or(z.literal("")),
  counselType: z.enum([
    "DECISION_CLARIFICATION",
    "ESCALATION_REVIEW",
    "BOARDROOM_PREPARATION",
    "STRATEGIC_INTERVENTION",
    "RETAINER_REVIEW",
  ]),
}).strict();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.email) {
    return res.status(401).json({ ok: false, error: "AUTHENTICATION_REQUIRED" });
  }

  const parsed = intakeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "INVALID_INTAKE",
      details: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const { resolveCounselRoomState } = await import("@/lib/product/counsel-room-resolver");
    const { createCounselCaseFromIntake } = await import("@/lib/product/counsel-case-service");

    const counselState = await resolveCounselRoomState({
      email: identity.email,
      userId: identity.subjectId,
    });

    if (!counselState.canSubmitStructuredIntake && !counselState.canRequestCounsel) {
      return res.status(403).json({
        ok: false,
        error: "COUNSEL_NOT_WARRANTED",
        message: "Counsel is not yet warranted by the evidence available. Complete additional diagnostic stages first.",
      });
    }

    const evidencePackage = counselState.evidencePackage;
    if (!evidencePackage) {
      return res.status(400).json({
        ok: false,
        error: "EVIDENCE_PACKAGE_REQUIRED",
        message: "An evidence package is required to submit a counsel intake. Complete a diagnostic first.",
      });
    }

    const caseRecord = await createCounselCaseFromIntake({
      userId: identity.subjectId ?? identity.email,
      email: identity.email,
      intake: {
        caseId: evidencePackage.caseId ?? undefined,
        journeyId: evidencePackage.journeyId ?? undefined,
        escalationTrigger: evidencePackage.triggers,
        userSummary: parsed.data.userSummary,
        whatChangedSinceSystemAssessment: parsed.data.whatChangedSinceSystemAssessment || undefined,
        whatHumanCounselMustConsider: parsed.data.whatHumanCounselMustConsider,
        urgency: parsed.data.urgency,
        permissionToUseEvidencePackage: parsed.data.permissionToUseEvidencePackage,
      },
      evidencePackage,
    });

    if (!caseRecord) {
      return res.status(500).json({ ok: false, error: "FAILED_TO_CREATE_CASE" });
    }

    return res.status(200).json({
      ok: true,
      caseId: caseRecord.id,
      status: caseRecord.status,
      dataQuality: "CASE_SCOPED",
      evidencePosture: "USER_REPORTED",
      scope: {
        userId: identity.subjectId ?? null,
        userEmail: identity.email,
        caseId: caseRecord.id,
        journeyId: evidencePackage.journeyId ?? null,
        sourceSurface: "COUNSEL_REVIEW",
        scopeLabel: "Counsel intake case",
        scopeType: "CASE",
      },
      provenance: normaliseCounselIntakeEvidence({
        caseId: caseRecord.id,
        journeyId: evidencePackage.journeyId ?? null,
        userSummary: parsed.data.userSummary,
        whatChangedSinceSystemAssessment: parsed.data.whatChangedSinceSystemAssessment || null,
        whatHumanCounselMustConsider: parsed.data.whatHumanCounselMustConsider,
      }),
      emptyState: null,
      message: "Counsel intake submitted. Your case has been created and queued for review.",
    });
  } catch (error) {
    console.error("[COUNSEL_INTAKE_ERROR]", error);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}
