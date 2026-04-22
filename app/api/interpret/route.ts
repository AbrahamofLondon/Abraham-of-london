import { NextRequest, NextResponse } from "next/server";
import {
  interpretCached,
  isInterpretationAvailable,
  stageQualifiesForInterpretation,
  type InterpretationInput,
} from "@/lib/ai/interpretation-engine";

/**
 * POST /api/interpret — Async interpretation enrichment
 *
 * Called by the frontend after the canonical engine produces deterministic output.
 * The frontend shows the canonical output immediately, then calls this endpoint
 * to get the LLM interpretation. When it arrives, the UI enriches.
 *
 * Body: InterpretationInput
 * Returns: InterpretationOutput
 */

export async function POST(req: NextRequest) {
  try {
    if (!isInterpretationAvailable()) {
      return NextResponse.json(
        { ok: false, reason: "INTERPRETATION_NOT_CONFIGURED", source: "fallback" },
        { status: 503 },
      );
    }

    const body = await req.json();
    const { canonicalResult, userInputs, stage, tensionThread } = body as Partial<InterpretationInput>;

    if (!canonicalResult || !userInputs || !stage) {
      return NextResponse.json(
        { ok: false, reason: "MISSING_REQUIRED_FIELDS" },
        { status: 400 },
      );
    }

    // Cost control: only interpret qualifying stages
    if (!stageQualifiesForInterpretation(stage)) {
      return NextResponse.json(
        { ok: false, reason: "STAGE_NOT_ELIGIBLE", stage },
        { status: 400 },
      );
    }

    const output = await interpretCached({
      canonicalResult,
      userInputs,
      stage,
      tensionThread: tensionThread ?? null,
    });

    return NextResponse.json({ ok: true, ...output });
  } catch (err) {
    console.error("[INTERPRET_API]", err);
    return NextResponse.json(
      { ok: false, reason: "INTERPRETATION_FAILED", source: "fallback" },
      { status: 500 },
    );
  }
}
