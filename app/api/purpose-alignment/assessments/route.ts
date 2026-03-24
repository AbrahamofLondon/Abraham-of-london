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

export async function GET() {
  const sessionKey = await getOrCreatePurposeAlignmentSessionKey();
  const latest = await getLatestPurposeAlignmentAssessment({ sessionKey });
  const history = await listPurposeAlignmentAssessments({
    sessionKey,
    limit: 12,
  });

  return NextResponse.json({
    ok: true,
    latest,
    history,
  });
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = purposeAlignmentInputSchema.parse(json);
    validatePurposeAlignmentAnswers(parsed.answers);

    const result = scorePurposeAlignment({
      answers: parsed.answers,
      notes: parsed.notes || undefined,
    });

    const sessionKey = await getOrCreatePurposeAlignmentSessionKey();

    const assessmentId = await createPurposeAlignmentAssessment({
      sessionKey,
      input: {
        answers: parsed.answers,
        notes: parsed.notes || undefined,
      },
      result,
    });

    return NextResponse.json({
      ok: true,
      assessmentId,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid request",
      },
      { status: 400 }
    );
  }
}