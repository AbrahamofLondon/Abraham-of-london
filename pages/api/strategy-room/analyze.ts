/* pages/api/strategy-room/analyze.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { StrategyIntakeStatus } from "@prisma/client";

type AnalyzeResponse =
  | {
      success: true;
      score: number;
      status: StrategyIntakeStatus;
    }
  | {
      error: string;
    };

type StrategyPayload = Record<string, unknown>;

const ANALYSIS_VERSION = "gravity-v1";
const ANALYZED_BY = "system:strategy-room-analyze";

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyzeResponse>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { intakeId, payload } = req.body ?? {};

  if (
    !intakeId ||
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    return res
      .status(400)
      .json({ error: "Missing required dossier identifiers." });
  }

  try {
    const incomingPayload = payload as StrategyPayload;

    const score = calculateInstitutionalGravity(incomingPayload);
    const cappedScore = Math.min(score, 25);

    const status =
      cappedScore >= 22
        ? StrategyIntakeStatus.PENDING_DIRECTORATE_REVIEW
        : StrategyIntakeStatus.ACCEPTED;

    const existing = await prisma.strategyIntake.findUnique({
      where: { id: String(intakeId) },
      select: {
        id: true,
        payload: true,
        dependencyLevel: true,
        volatility: true,
        readinessScore: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Strategy intake not found." });
    }

    const existingPayload =
      existing.payload &&
      typeof existing.payload === "object" &&
      !Array.isArray(existing.payload)
        ? (existing.payload as StrategyPayload)
        : {};

    const analyzedAt = new Date();

    const mergedPayload: StrategyPayload = {
      ...existingPayload,
      ...incomingPayload,
    };

    const analysisNotes = {
      model: ANALYSIS_VERSION,
      analyzedAt: analyzedAt.toISOString(),
      inputs: {
        dependencyLevel:
          typeof incomingPayload.dependencyLevel === "string"
            ? incomingPayload.dependencyLevel
            : existing.dependencyLevel,
        volatility:
          typeof incomingPayload.volatility === "string"
            ? incomingPayload.volatility
            : existing.volatility,
        readinessScore:
          typeof incomingPayload.readinessScore === "number"
            ? incomingPayload.readinessScore
            : existing.readinessScore,
      },
      thresholds: {
        acceptedMax: 21,
        directorateReviewMin: 22,
        scoreCap: 25,
      },
    };

    await prisma.strategyIntake.update({
      where: { id: String(intakeId) },
      data: {
        payload: toJsonValue(mergedPayload),
        score: cappedScore,
        status,
        analyzedAt,
        analyzedBy: ANALYZED_BY,
        analysisVersion: ANALYSIS_VERSION,
        analysisNotes: toJsonValue(analysisNotes),
      },
    });

    return res.status(200).json({
      success: true,
      score: cappedScore,
      status,
    });
  } catch (error) {
    console.error("[STRATEGY_ROOM_SCORING_FAILURE]", error);
    return res.status(500).json({ error: "Internal scoring failure." });
  }
}

/**
 * INSTITUTIONAL SCORING LOGIC
 * Max Score: 25
 */
function calculateInstitutionalGravity(payload: StrategyPayload): number {
  let score = 0;

  if (payload.dependencyLevel === "high") score += 10;
  else if (payload.dependencyLevel === "medium") score += 5;

  const volatilityMap: Record<string, number> = {
    extreme: 8,
    high: 6,
    stable: 2,
  };

  score += volatilityMap[String(payload.volatility || "")] || 0;

  const readinessRaw =
    typeof payload.readinessScore === "number" ? payload.readinessScore : 5;

  const readiness = Math.max(0, Math.min(7, readinessRaw));
  score += 7 - readiness;

  return score;
}