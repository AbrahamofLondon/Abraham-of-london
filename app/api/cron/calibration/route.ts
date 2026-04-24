import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { proposeCalibrationAdjustment } from "@/lib/calibration/calibration-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/cron/calibration
 *
 * Daily calibration cron. Fetches unapplied events, proposes adjustments,
 * applies only if threshold met. Persists updated CalibrationState.
 */
export async function POST() {
  try {
    // Fetch all calibration states
    const states = await prisma.calibrationState.findMany({
      where: { status: { in: ["ACTIVE", "SHADOW"] } },
    });

    const results: Array<{
      modelKey: string;
      modelVersion: string;
      applied: boolean;
      reason: string;
      outcomeCount: number;
    }> = [];

    for (const state of states) {
      // Fetch unapplied events for this model
      const events = await prisma.calibrationEvent.findMany({
        where: {
          modelKey: state.modelKey,
          modelVersion: state.modelVersion,
          applied: false,
        },
        orderBy: { createdAt: "asc" },
      });

      if (events.length === 0) {
        results.push({
          modelKey: state.modelKey,
          modelVersion: state.modelVersion,
          applied: false,
          reason: "No unapplied events.",
          outcomeCount: state.outcomeCount,
        });
        continue;
      }

      // Propose adjustment
      const proposal = proposeCalibrationAdjustment({
        events: events.map((e) => ({
          predictionError: e.predictionError,
          predictionSnapshot: (e.predictionSnapshot ?? {}) as Record<string, unknown>,
          outcomeSnapshot: (e.outcomeSnapshot ?? {}) as Record<string, unknown>,
          createdAt: e.createdAt,
        })),
        currentState: {
          outcomeCount: state.outcomeCount,
          accuracyScore: state.accuracyScore,
          biasScore: state.biasScore,
          calibrationData: (state.calibrationData ?? {}) as Record<string, unknown>,
        },
      });

      if (proposal.shouldApply && state.status === "ACTIVE") {
        // Apply the adjustment
        const currentData = (state.calibrationData ?? {}) as Record<string, unknown>;
        const updatedData = {
          ...currentData,
          severityBiasCorrection: proposal.adjustment.severityBiasCorrection,
          confidenceAdjustment: proposal.adjustment.confidenceAdjustment,
          lastAvgError: proposal.adjustment.avgError,
          lastEmaError: proposal.adjustment.emaError,
          appliedAt: new Date().toISOString(),
        };

        await prisma.calibrationState.update({
          where: { id: state.id },
          data: {
            calibrationData: updatedData as any,
            accuracyScore: 1 - proposal.adjustment.avgError,
            biasScore: proposal.adjustment.severityBiasCorrection,
            lastCalibratedAt: new Date(),
          },
        });

        // Mark events as applied and store adjustment proposal
        await prisma.calibrationEvent.updateMany({
          where: {
            modelKey: state.modelKey,
            modelVersion: state.modelVersion,
            applied: false,
          },
          data: {
            applied: true,
            adjustmentProposal: proposal.adjustment as any,
          },
        });

        results.push({
          modelKey: state.modelKey,
          modelVersion: state.modelVersion,
          applied: true,
          reason: proposal.reason,
          outcomeCount: state.outcomeCount,
        });
      } else {
        // Record but don't apply (shadow mode or threshold not met)
        await prisma.calibrationEvent.updateMany({
          where: {
            modelKey: state.modelKey,
            modelVersion: state.modelVersion,
            applied: false,
          },
          data: {
            adjustmentProposal: proposal.adjustment as any,
          },
        });

        results.push({
          modelKey: state.modelKey,
          modelVersion: state.modelVersion,
          applied: false,
          reason: state.status === "SHADOW" ? `Shadow mode — adjustment proposed but not applied. ${proposal.reason}` : proposal.reason,
          outcomeCount: state.outcomeCount,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      evaluatedModels: results.length,
      appliedAdjustments: results.filter((r) => r.applied).length,
      skippedAdjustments: results.filter((r) => !r.applied).length,
      details: results,
    });
  } catch (err) {
    console.error("[calibration-cron]", err);
    return NextResponse.json({ ok: false, error: "CALIBRATION_CRON_FAILED" }, { status: 500 });
  }
}
