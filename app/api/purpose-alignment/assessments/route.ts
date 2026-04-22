import { NextRequest, NextResponse } from "next/server";
import { scorePurposeProfile } from "@/lib/alignment/scoring";
import {
  purposeAlignmentInputSchema,
  validatePurposeAlignmentAnswers,
} from "@/lib/alignment/validation";
import {
  createPurposeAlignmentAssessment,
  getLatestPurposeAlignmentAssessment,
  listPurposeAlignmentAssessments,
} from "@/lib/alignment/repository";
import { getOrCreatePurposeAlignmentSessionKey } from "@/lib/alignment/session";
import { buildPurposeAuthorityPacket } from "@/lib/diagnostics/evidence-graph";
import { persistDiagnosticStage } from "@/lib/diagnostics/journey-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      isPreview: true,
    },
    { status: 400 },
  );
}

function internalError(message: string) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      isPreview: true,
    },
    { status: 500 },
  );
}

export async function GET(req: NextRequest) {
  try {
    const sessionKey = await getOrCreatePurposeAlignmentSessionKey();

    const [latest, history] = await Promise.all([
      getLatestPurposeAlignmentAssessment({ sessionKey }),
      listPurposeAlignmentAssessments({
        sessionKey,
        limit: 12,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      latest,
      history,
      isPreview: true,
      message:
        "This is a free preview of the constitutional intelligence engine.",
    });
  } catch (error) {
    console.error("[PURPOSE_ALIGNMENT_GET_ERROR]", error);
    return internalError("Unable to retrieve assessments");
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = purposeAlignmentInputSchema.parse(json);

    validatePurposeAlignmentAnswers(parsed.answers);

    const sessionKey = await getOrCreatePurposeAlignmentSessionKey();
    const context = {
      reflections: parsed.reflections ?? null,
    };

    const result = scorePurposeProfile({
      answers: parsed.answers,
      context,
    });

    const assessmentId = await createPurposeAlignmentAssessment({
      sessionKey,
      input: {
        answers: parsed.answers,
        notes: parsed.notes || undefined,
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

    return NextResponse.json({
      ok: true,
      assessmentId,
      result,
      authorityPacket,
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
