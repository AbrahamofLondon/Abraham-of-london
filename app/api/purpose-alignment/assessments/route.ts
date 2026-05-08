import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scorePurposeProfile } from "@/lib/alignment/scoring";
import { validatePurposeAlignmentAnswers } from "@/lib/alignment/validation";
import {
  createPurposeAlignmentAssessment,
} from "@/lib/alignment/repository";
import { getOrCreatePurposeAlignmentSessionKey } from "@/lib/alignment/session";
import { buildPurposeAuthorityPacket } from "@/lib/diagnostics/evidence-graph";
import { persistDiagnosticStage } from "@/lib/diagnostics/journey-store";
import { extractPurposeAnchors } from "@/lib/server/decision/anchor-extractor.server";
import { detectAnchorContradictions } from "@/lib/server/decision/contradiction-engine.server";
import { composeAnchorNarrative } from "@/lib/server/decision/narrative-engine.server";
import { framePurposeSocialProof } from "@/lib/server/social-proof/aggregate-patterns.server";
import { detectAssessmentIntegrity } from "@/lib/server/decision/challenge-engine.server";
import type { PurposeProfileResult } from "@/lib/alignment/types";
import {
  enforceAppRouteRateLimit,
  failClosedForFlag,
  noStoreJson,
  parseJsonBody,
  requireJsonContent,
  requireMethod,
  requireSameOrigin,
} from "@/lib/server/security/app-route-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const answerSchema = z.object({
  resonance: z.number().int().min(0).max(10),
  certainty: z.number().int().min(0).max(10),
}).strict();

const requestSchema = z.object({
  answers: z.record(z.string().trim().min(1).max(120), answerSchema).refine(
    (value) => Object.keys(value).length <= 64,
    "Too many answers supplied",
  ),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
  clientMeta: z.object({
    startedAt: z.string().datetime().optional().nullable(),
    submittedAt: z.string().datetime().optional().nullable(),
  }).strict().optional(),
  reflections: z.object({
    avoidedDecision: z.string().trim().max(1000).nullable().optional(),
    lastSevenDays: z.string().trim().max(1000).nullable().optional(),
    dissenter: z.string().trim().max(1000).nullable().optional(),
    /** Properly-named field for institutional consequence */
    consequence: z.string().trim().max(1000).nullable().optional(),
    /** Properly-named field for competing obligation */
    competingObligation: z.string().trim().max(1000).nullable().optional(),
  }).strict().optional(),
}).strict();

function methodNotAllowed(req: NextRequest) {
  return noStoreJson(
    { ok: false, error: "METHOD_NOT_ALLOWED", isPreview: true },
    { status: 405, headers: { Allow: "POST" } },
  );
}

function badRequest(message: string) {
  return noStoreJson(
    {
      ok: false,
      error: message,
      isPreview: true,
    },
    { status: 400 },
  );
}

function internalError(message: string) {
  return noStoreJson(
    {
      ok: false,
      error: message,
      isPreview: true,
    },
    { status: 500 },
  );
}

function roundToNearest(value: number, increment: number) {
  return Math.round(value / increment) * increment;
}

function degradePurposeResultPrecision(result: PurposeProfileResult): PurposeProfileResult {
  return {
    ...result,
    totalScore: roundToNearest(result.totalScore, 5),
    percent: roundToNearest(result.percent, 10),
    domainProfiles: result.domainProfiles.map((domain) => ({
      ...domain,
      resonance: roundToNearest(domain.resonance, 2),
      certainty: roundToNearest(domain.certainty, 2),
      weighted: roundToNearest(domain.weighted, 2),
      percent: roundToNearest(domain.percent, 10),
    })),
    domainStates: result.domainStates?.map((state) => ({
      ...state,
      resonanceMean: roundToNearest(state.resonanceMean, 2),
      certaintyMean: roundToNearest(state.certaintyMean, 2),
      alignmentScore: roundToNearest(state.alignmentScore, 10),
      confidenceGap: roundToNearest(state.confidenceGap, 2),
    })),
    secondaryPattern: null,
    evidence: result.evidence
      ? {
          sharpestWeakSignal: result.evidence.sharpestWeakSignal,
          strongestStabilisingSignal: null,
          contradictionEvidence: result.evidence.contradictionEvidence.slice(0, 1),
        }
      : result.evidence,
  };
}

export async function GET(req: NextRequest) { return methodNotAllowed(req); }
export async function PUT(req: NextRequest) { return methodNotAllowed(req); }
export async function PATCH(req: NextRequest) { return methodNotAllowed(req); }
export async function DELETE(req: NextRequest) { return methodNotAllowed(req); }

export async function POST(req: NextRequest) {
  const methodCheck = requireMethod(req, ["POST"]);
  if (!methodCheck.ok) return methodCheck.response;

  const contentCheck = requireJsonContent(req);
  if (!contentCheck.ok) return contentCheck.response;

  const sameOrigin = requireSameOrigin(req, "/api/purpose-alignment/assessments");
  if (!sameOrigin.ok) return sameOrigin.response;

  try {
    const lockdown = failClosedForFlag({
      flag: "SECURITY_LOCKDOWN_MODE",
      action: "purpose_alignment_assessment",
      route: "/api/purpose-alignment/assessments",
      publicMessage: "ASSESSMENTS_TEMPORARILY_DISABLED",
    });
    if (!lockdown.ok) return lockdown.response;

    const parsed = await parseJsonBody(req, requestSchema);
    if (!parsed.ok) return parsed.response;

    validatePurposeAlignmentAnswers(parsed.data.answers);

    const sessionKey = await getOrCreatePurposeAlignmentSessionKey();
    const rateLimit = await enforceAppRouteRateLimit({
      request: req,
      routeKey: "purpose-alignment-assessments",
      limit: 6,
      windowMs: 15 * 60_000,
      sessionId: sessionKey,
      failClosed: true,
    });
    if (!rateLimit.ok) return rateLimit.response;

    const context = {
      reflections: parsed.data.reflections ?? null,
    };

    const integrity = detectAssessmentIntegrity({
      answers: parsed.data.answers,
      startedAt: parsed.data.clientMeta?.startedAt ?? null,
      submittedAt: parsed.data.clientMeta?.submittedAt ?? null,
    });

    const rawResult = scorePurposeProfile({
      answers: parsed.data.answers,
      context,
    });
    const result = integrity.shouldDegrade ? degradePurposeResultPrecision(rawResult) : rawResult;

    const assessmentId = await createPurposeAlignmentAssessment({
      sessionKey,
      input: {
        answers: parsed.data.answers,
        notes: parsed.data.notes || undefined,
      },
      result,
    });

    const authorityPacket = buildPurposeAuthorityPacket(result, context);
    await persistDiagnosticStage({
      subjectId: sessionKey,
      stage: "purpose_alignment",
      payload: {
        result,
        authorityPacket,
      },
      tensions: authorityPacket.nodes
        .filter((node) => node.kind === "contradiction" || node.kind === "escalation_trigger")
        .map((node) => node.label),
      routeDecision: {
        nextStep: result.routingRecommendation?.href ?? null,
        condition: authorityPacket.condition,
      },
      evidenceNodes: authorityPacket.nodes,
      decisionObject: authorityPacket.decisionObject,
      snapshot: {
        timestamp: new Date().toISOString(),
        stage: "purpose_alignment",
        coreMetrics: {
          percent: result.percent,
          consequenceRisk: Number(authorityPacket.consequence.value ?? 0),
        },
        tensions: [authorityPacket.contradiction],
        escalationLevel: result.routingRecommendation?.spilloverLikely ? 2 : 1,
        directive: authorityPacket.action.firstMove,
      },
    });

    // ── ANCHOR-BOUND NARRATIVE ──────────────────────────────────────────
    let anchorNarrative = null;
    try {
      const anchors = extractPurposeAnchors({
        result,
        context: context ?? undefined,
      });
      const contradictions = detectAnchorContradictions(anchors);
      anchorNarrative = composeAnchorNarrative(
        anchors,
        contradictions,
        {
          patternLabel: result.primaryPattern?.label ?? result.coherenceBand,
          firstAction: result.firstAction ?? result.corrections[0] ?? "Name the avoided decision.",
          consequence: result.primaryPattern?.consequence ?? "The pattern will continue.",
          perspectiveType: "personal",
        },
      );
    } catch {
      // Non-fatal: anchor enrichment failed
    }

    return noStoreJson({
      ok: true,
      assessmentId,
      result,
      authorityPacket,
      anchorNarrative,
      socialProof: framePurposeSocialProof(result),
      isPreview: true,
      nextSteps: {
        exploreStrategyRoom: "/strategy-room",
        viewFullProduct: "/product",
        scheduleConsultation: "/consultation",
      },
    });
  } catch (error) {
    console.error("[PURPOSE_ALIGNMENT_POST_ERROR]", error);

    if (error instanceof Error) {
      return badRequest(error.message);
    }

    return badRequest("Invalid request");
  }
}
