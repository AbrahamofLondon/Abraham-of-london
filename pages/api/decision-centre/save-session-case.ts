import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { extractCanonicalDecisionObject } from "@/lib/diagnostics/evidence-graph";
import { persistDiagnosticStage } from "@/lib/diagnostics/journey-store";

const payloadSchema = z.object({
  source: z.enum(["FAST_DIAGNOSTIC", "BOARD_SUMMARY", "DELAY_CALCULATOR"]),
  caseRef: z.string().trim().max(200).optional(),
  decisionLabel: z.string().trim().max(420).optional(),
  condition: z.string().trim().max(180).optional(),
  authorityIndex: z.object({
    band: z.string().trim().max(80),
    label: z.string().trim().max(180),
    boardMeaning: z.string().trim().max(420),
    nextGovernanceMove: z.string().trim().max(420),
  }).strict().optional(),
  comparisonBand: z.string().trim().max(180).optional(),
  costOfDelay: z.object({
    weeklyCost: z.number().finite().nonnegative(),
    delayWeeks: z.number().finite().nonnegative(),
    exposureType: z.enum(["revenue", "operating_cost", "compliance", "opportunity", "reputation", "execution"]),
    estimateConfidence: z.enum(["rough", "known", "board_estimate"]),
    sevenDayExposure: z.number().finite().nonnegative(),
    thirtyDayExposure: z.number().finite().nonnegative(),
    ninetyDayExposure: z.number().finite().nonnegative(),
  }).strict().optional(),
  nextGovernanceMove: z.string().trim().max(420).optional(),
  createdAt: z.string().datetime().optional(),
}).strict();

type SaveSessionCaseResponse =
  | { ok: true; caseRef: string }
  | { ok: false; reason: "AUTH_REQUIRED" | "INVALID_REQUEST" | "METHOD_NOT_ALLOWED" | "INTERNAL_ERROR"; message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SaveSessionCaseResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      reason: "METHOD_NOT_ALLOWED",
      message: "Use POST to save a session case.",
    });
  }

  const parsed = payloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      reason: "INVALID_REQUEST",
      message: "Only client-safe session case fields may be saved.",
    });
  }

  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.subjectId || !identity.email) {
    return res.status(401).json({
      ok: false,
      reason: "AUTH_REQUIRED",
      message: "Sign in to save this case in Decision Centre.",
    });
  }

  try {
    const payload = parsed.data;
    const fallbackDecision = payload.source === "DELAY_CALCULATOR"
      ? "Deferred decision exposure estimate"
      : "Saved session case";
    const costOfDelayText = payload.costOfDelay
      ? `£${payload.costOfDelay.thirtyDayExposure.toLocaleString("en-GB")} estimated at 30 days`
      : null;
    const decisionObject = extractCanonicalDecisionObject({
      sourceStage: "purpose_alignment",
      decisionText: payload.source === "DELAY_CALCULATOR" ? null : payload.decisionLabel ?? null,
      constraintText: payload.condition ?? null,
      costOfDelayText,
      fallbackDecision,
    });

    const journey = await persistDiagnosticStage({
      email: identity.email,
      subjectId: identity.subjectId,
      stage: "purpose_alignment",
      payload: {
        _type: "session_case_carry_forward",
        source: payload.source,
        sourceCaseRef: payload.caseRef ?? null,
        decisionLabel: payload.source === "DELAY_CALCULATOR" ? null : payload.decisionLabel ?? null,
        condition: payload.condition ?? null,
        authorityIndex: payload.authorityIndex ?? null,
        comparisonBand: payload.comparisonBand ?? null,
        costOfDelay: payload.costOfDelay ?? null,
        nextGovernanceMove: payload.nextGovernanceMove ?? payload.authorityIndex?.nextGovernanceMove ?? null,
        carriedForwardAt: new Date().toISOString(),
        sourceCreatedAt: payload.createdAt ?? null,
      },
      decisionObject,
    });

    return res.status(200).json({ ok: true, caseRef: journey.journeyKey });
  } catch (error) {
    console.error("[decision-centre/save-session-case]", error);
    return res.status(500).json({
      ok: false,
      reason: "INTERNAL_ERROR",
      message: "The case could not be saved yet.",
    });
  }
}
