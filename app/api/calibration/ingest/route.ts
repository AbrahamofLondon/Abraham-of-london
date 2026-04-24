import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma.server";
import { comparePredictionToOutcome } from "@/lib/calibration/calibration-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IngestSchema = z.object({
  sessionKey: z.string().min(1),
  outcome: z.object({
    classification: z.enum(["RESOLVED", "IMPROVED", "UNCHANGED", "DETERIORATED"]),
    evidence: z.array(z.string()).optional(),
    observedAt: z.string().min(1),
    notes: z.string().optional(),
  }),
});

/**
 * POST /api/calibration/ingest
 *
 * Ingests an outcome observation and compares to the original prediction.
 * Creates a CalibrationEvent. Does NOT mutate live weights.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = IngestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_PAYLOAD", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { sessionKey, outcome } = parsed.data;

    // Fetch the original prediction for this session
    const prediction = await prisma.outcomeVerificationRecord.findFirst({
      where: { sessionId: sessionKey },
      orderBy: { createdAt: "desc" },
    });

    if (!prediction) {
      return NextResponse.json(
        { ok: false, error: "PREDICTION_NOT_FOUND", message: "No prediction found for this session." },
        { status: 404 },
      );
    }

    // Compare prediction to outcome
    const predictionSnapshot = {
      classification: prediction.outcomeClassification,
      severity: prediction.magnitudeOfChange,
      effectiveness: prediction.effectivenessScore,
    };

    const outcomeSnapshot = {
      classification: outcome.classification,
      evidence: outcome.evidence ?? [],
      observedAt: outcome.observedAt,
      notes: outcome.notes ?? "",
    };

    const comparison = comparePredictionToOutcome({
      prediction: predictionSnapshot,
      outcome: outcomeSnapshot,
    });

    // Determine model key from the prediction source
    const modelKey = "decision_kernel_v1";
    const modelVersion = "1.0.0";

    // Create CalibrationEvent — do NOT mutate live weights
    const event = await prisma.calibrationEvent.create({
      data: {
        sessionKey,
        modelKey,
        modelVersion,
        predictionSnapshot: predictionSnapshot as any,
        outcomeSnapshot: outcomeSnapshot as any,
        predictionError: comparison.predictionError,
        // adjustmentProposal: populated by calibration cron, not here
        applied: false,
      },
    });

    // Update outcome count on calibration state (if exists)
    await prisma.calibrationState.upsert({
      where: { modelKey_modelVersion: { modelKey, modelVersion } },
      create: {
        modelKey,
        modelVersion,
        status: "ACTIVE",
        calibrationData: {},
        outcomeCount: 1,
      },
      update: {
        outcomeCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      ok: true,
      calibrationEventId: event.id,
      modelKey,
      predictionError: comparison.predictionError,
      biasDirection: comparison.biasDirection,
      status: "RECORDED_NOT_APPLIED",
    });
  } catch (err) {
    console.error("[calibration-ingest]", err);
    return NextResponse.json(
      { ok: false, error: "INGESTION_FAILED" },
      { status: 500 },
    );
  }
}
