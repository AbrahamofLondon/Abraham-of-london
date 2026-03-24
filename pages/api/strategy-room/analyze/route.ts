import type { NextApiRequest, NextApiResponse } from "next";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

type StrategyPayload = Record<string, unknown>;

type AnalyzeResponse =
  | {
      success: true;
      score: number;
    }
  | {
      error: string;
    };

function toSafeObject(value: unknown): StrategyPayload {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as StrategyPayload)
    : {};
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

/**
 * STRATEGY ANALYSIS ENGINE
 * Process raw intake data to calculate institutional gravity and readiness.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyzeResponse>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body ?? {};
    const intakeId = String(body?.intakeId || "").trim();
    const payload = toSafeObject(body?.payload);

    if (!intakeId) {
      return res
        .status(400)
        .json({ error: "Intake ID required for analysis" });
    }

    const intake = await prisma.strategyIntake.findUnique({
      where: { id: intakeId },
      select: {
        id: true,
        payload: true,
      },
    });

    if (!intake) {
      return res.status(404).json({ error: "Record not found" });
    }

    let score = 50;

    if (payload.dependencyLevel === "low") score += 20;
    if (payload.dependencyLevel === "high") score -= 15;

    if (payload.volatility === "stable") score += 10;
    if (payload.volatility === "extreme") score -= 25;

    const finalScore = Math.min(Math.max(score, 0), 100);

    const existingPayload = toSafeObject(intake.payload);

    const mergedPayload: StrategyPayload = {
      ...existingPayload,
      ...payload,
      calculatedAt: new Date().toISOString(),
      analysisVersion: "2.1.0-alpha",
    };

    await prisma.strategyIntake.update({
      where: { id: intakeId },
      data: {
        readinessScore: finalScore,
        payload: toJsonValue(mergedPayload),
      },
    });

    console.log(
      `[STRATEGY_ANALYSIS] Score ${finalScore} generated for Intake ${intakeId}`,
    );

    return res.status(200).json({
      success: true,
      score: finalScore,
    });
  } catch (error) {
    console.error("[ANALYSIS_ENGINE_ERROR]:", error);
    return res.status(500).json({ error: "Analysis engine failure" });
  }
}