import { NextRequest, NextResponse } from "next/server";
import { scorePurposeAlignment } from "@/lib/alignment/scoring";
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
    const sessionKey = await getOrCreatePurposeAlignmentSessionKey(req);

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

    const result = scorePurposeAlignment({
      answers: parsed.answers,
      notes: parsed.notes || undefined,
      resonanceData: parsed.resonanceData,
    });

    const sessionKey = await getOrCreatePurposeAlignmentSessionKey(req);

    const assessmentId = await createPurposeAlignmentAssessment({
      sessionKey,
      input: {
        answers: parsed.answers,
        notes: parsed.notes || undefined,
        resonanceData: parsed.resonanceData,
      },
      result,
    });

    return NextResponse.json({
      ok: true,
      assessmentId,
      result,
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