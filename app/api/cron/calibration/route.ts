import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma.server";
import { proposeCalibrationAdjustment } from "@/lib/calibration/calibration-engine";
import { writeSecurityAudit } from "@/lib/security/audit-log";
import { noStoreJson } from "@/lib/server/security/app-route-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/cron/calibration
 *
 * Daily calibration cron. Fetches unapplied events, proposes adjustments,
 * applies only if threshold met. Persists updated CalibrationState.
 *
 * Guard: CRON_SECRET (Bearer token)
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get("authorization");

  if (!cronSecret) {
    return noStoreJson({ ok: false, error: "CRON_NOT_CONFIGURED" }, { status: 503 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    await writeSecurityAudit({
      action: "invalid_token",
      severity: "warn",
      status: "BLOCKED",
      resourceId: "/api/cron/calibration",
    });
    return noStoreJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  await writeSecurityAudit({
    action: "cron_started",
    status: "SUCCESS",
    resourceId: "/api/cron/calibration",
  });

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

    await writeSecurityAudit({
      action: "cron_completed",
      status: "SUCCESS",
      resourceId: "/api/cron/calibration",
      metadata: {
        evaluatedModels: results.length,
        appliedAdjustments: results.filter((r) => r.applied).length,
      },
    });

    return noStoreJson({
      ok: true,
      evaluatedModels: results.length,
      appliedAdjustments: results.filter((r) => r.applied).length,
      skippedAdjustments: results.filter((r) => !r.applied).length,
      details: results,
    });
  } catch (err) {
    console.error("[calibration-cron]", err);
    await writeSecurityAudit({
      action: "cron_error",
      severity: "error",
      status: "FAILED",
      resourceId: "/api/cron/calibration",
      errorMessage: err instanceof Error ? err.message : "Calibration failed",
    });
    return noStoreJson({ ok: false, error: "CALIBRATION_CRON_FAILED" }, { status: 500 });
  }
}
