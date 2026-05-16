import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { extractCanonicalDecisionObject } from "@/lib/diagnostics/evidence-graph";
import { persistDiagnosticStage } from "@/lib/diagnostics/journey-store";
import { checkCaseEntitlement, countActiveCases } from "@/lib/product/case-entitlement-check";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import { CATALOG } from "@/lib/commercial/catalog";

// ── Request schema ────────────────────────────────────────────────────────────
//
// Mirrors SaveCasePayload from lib/product/save-case-continuity.ts exactly.
// .strict() ensures no internal or unrecognised fields are accepted.

const EXPOSURE_TYPES = [
  "revenue",
  "operating_cost",
  "compliance",
  "opportunity",
  "reputation",
  "execution",
] as const;

const ESTIMATE_CONFIDENCES = ["rough", "known", "board_estimate"] as const;

const payloadSchema = z
  .object({
    source: z.enum(["FAST_DIAGNOSTIC", "BOARD_SUMMARY", "DECISION_DELAY_CALCULATOR"]),
    caseRef: z.string().trim().max(200).optional().nullable(),
    decisionLabel: z.string().trim().max(420).optional().nullable(),
    condition: z.string().trim().max(180).optional().nullable(),
    nextGovernanceMove: z.string().trim().max(420).optional().nullable(),
    comparisonBand: z.string().trim().max(180).optional().nullable(),
    comparisonMaturityLevel: z.string().trim().max(180).optional().nullable(),
    // Delay-calculator inputs (stored as raw inputs, not computed outputs)
    weeklyCost: z.number().finite().nonnegative().optional().nullable(),
    delayWeeks: z.number().finite().nonnegative().optional().nullable(),
    exposureType: z.enum(EXPOSURE_TYPES).optional().nullable(),
    estimateConfidence: z.enum(ESTIMATE_CONFIDENCES).optional().nullable(),
    createdAt: z.string().datetime().optional().nullable(),
  })
  .strict();

type SavePayload = z.infer<typeof payloadSchema>;

type SaveSessionCaseResponse =
  | { ok: true; caseRef: string }
  | {
      ok: false;
      reason: "AUTH_REQUIRED" | "INVALID_REQUEST" | "METHOD_NOT_ALLOWED" | "INTERNAL_ERROR" | "FREE_TIER_LIMIT_REACHED";
      message: string;
    };

// ── Cost text helper ─────────────────────────────────────────────────────────
//
// Derives a plain-English cost-of-delay string from raw inputs so the
// canonical decision object carries a human-readable exposure figure.
// Uses the same 30-day approximation as computeDecisionDelayExposure.

function buildCostOfDelayText(payload: SavePayload): string | null {
  if (
    payload.source !== "DECISION_DELAY_CALCULATOR" ||
    payload.weeklyCost == null ||
    payload.delayWeeks == null
  ) {
    return null;
  }
  const thirtyDay = Math.round(payload.weeklyCost * (30 / 7));
  if (thirtyDay <= 0) return null;
  return `£${thirtyDay.toLocaleString("en-GB")} estimated at 30 days`;
}

// ── Handler ──────────────────────────────────────────────────────────────────

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
      message: "Create a free account to keep this decision live.",
    });
  }

  // ── Free tier active case limit check ──────────────────────────────────────
  try {
    const entitlement = await resolveCanonicalEntitlement({
      email: identity.email,
      slug: CATALOG.professional!.entitlementSlug,
    });
    const isProfessional = entitlement.granted;

    // Count existing active cases for this user
    const { prisma } = await import("@/lib/prisma.server");
    const existingCases = await prisma.diagnosticJourney.findMany({
      where: { email: identity.email.toLowerCase() },
      select: { status: true },
    });
    const activeCount = countActiveCases(
      existingCases.map((c: { status: string | null }) => ({
        outcomeStatus: c.status === "resolved" ? "RESOLVED" : null,
        cognitiveState: c.status === "institutional_intelligence" ? "INSTITUTIONAL_INTELLIGENCE" : ("ACTIVE" as const),
      })),
    );

    const entitlementCheck = checkCaseEntitlement(activeCount, isProfessional);
    if (!entitlementCheck.allowed) {
      return res.status(403).json({
        ok: false,
        reason: "FREE_TIER_LIMIT_REACHED" as const,
        message: `You have reached the free active case limit of ${entitlementCheck.maxActiveCases}. Upgrade to Professional to continue governing new cases.`,
      });
    }
  } catch {
    // If entitlement check fails, allow the save (degrade gracefully)
    console.warn("[decision-centre/save-session-case] Entitlement check failed, allowing save.");
  }

  try {
    const payload = parsed.data;
    const isDelayCalc = payload.source === "DECISION_DELAY_CALCULATOR";

    const fallbackDecision = isDelayCalc
      ? "Deferred decision exposure estimate"
      : "Saved session case";

    const decisionObject = extractCanonicalDecisionObject({
      sourceStage: "purpose_alignment",
      decisionText: isDelayCalc ? null : (payload.decisionLabel ?? null),
      constraintText: payload.condition ?? null,
      costOfDelayText: buildCostOfDelayText(payload),
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
        decisionLabel: isDelayCalc ? null : (payload.decisionLabel ?? null),
        condition: payload.condition ?? null,
        comparisonBand: payload.comparisonBand ?? null,
        comparisonMaturityLevel: payload.comparisonMaturityLevel ?? null,
        nextGovernanceMove: payload.nextGovernanceMove ?? null,
        // Calculator inputs stored as raw values — not computed outputs
        weeklyCost: payload.weeklyCost ?? null,
        delayWeeks: payload.delayWeeks ?? null,
        exposureType: payload.exposureType ?? null,
        estimateConfidence: payload.estimateConfidence ?? null,
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
