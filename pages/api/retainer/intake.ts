import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { prisma } from "@/lib/prisma";
import {
  RETAINER_INTAKE_QUESTIONS,
  validateRetainerIntake,
  retainerIntakeToEvidenceCapture,
  type RetainerIntakeResponse,
} from "@/lib/product/retainer-intake-contract";
import { sanitizeAssessmentEvidenceCapture } from "@/lib/product/evidence-capture-contract";

function s(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 4000) : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.email) {
    return res.status(401).json({ ok: false, error: "AUTHENTICATION_REQUIRED" });
  }

  const body = req.body as { intake?: Partial<RetainerIntakeResponse> } | null;
  if (!body?.intake) {
    return res.status(400).json({ ok: false, error: "INTAKE_REQUIRED" });
  }

  const intake: Partial<RetainerIntakeResponse> = {};
  for (const q of RETAINER_INTAKE_QUESTIONS) {
    const raw = (body.intake as Record<string, unknown>)[q.id];
    if (typeof raw === "string" && raw.trim()) {
      intake[q.id] = s(raw);
    }
  }

  const validation = validateRetainerIntake(intake);
  if (!validation.valid) {
    return res.status(400).json({
      ok: false,
      error: "INCOMPLETE_INTAKE",
      missing: validation.missing,
    });
  }

  const evidenceCapture = sanitizeAssessmentEvidenceCapture(
    retainerIntakeToEvidenceCapture(intake as RetainerIntakeResponse),
  );

  try {
    const record = await prisma.diagnosticRecord.create({
      data: {
        diagnosticType: "retainer_intake",
        userEmail: identity.email.toLowerCase(),
        status: "completed",
        score: 0,
        severity: "moderate",
        verdict: "Retainer oversight intake submitted. Pending governance review.",
        responsesJson: JSON.stringify({
          intake,
          evidenceCapture,
          submittedAt: new Date().toISOString(),
          version: "v0",
        }),
      },
    });

    return res.status(200).json({
      ok: true,
      intakeId: record.id,
      message: "Oversight intake recorded. Governance review will follow.",
    });
  } catch (error) {
    console.error("[retainer-intake]", error);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}
