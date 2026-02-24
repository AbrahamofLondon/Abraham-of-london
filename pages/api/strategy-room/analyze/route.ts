import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * STRATEGY ANALYSIS ENGINE
 * Process raw intake data to calculate institutional gravity and readiness.
 */
export async function POST(req: Request) {
  try {
    const { intakeId, payload } = await req.json();

    if (!intakeId) {
      return NextResponse.json({ error: "Intake ID required for analysis" }, { status: 400 });
    }

    // 1. Retrieve the fresh intake record
    const intake = await prisma.strategyIntake.findUnique({
      where: { id: intakeId }
    });

    if (!intake) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // 2. Strategic Calculation Logic
    // We calculate a score based on dependency and volatility
    let score = 50; // Base score (0-100 scale)

    // Dependency Adjustments
    if (payload.dependencyLevel === 'low') score += 20; // High Autonomy
    if (payload.dependencyLevel === 'high') score -= 15; // High Risk

    // Volatility Adjustments
    if (payload.volatility === 'stable') score += 10;
    if (payload.volatility === 'extreme') score -= 25;

    // Constrain score between 0 and 100
    const finalScore = Math.min(Math.max(score, 0), 100);

    // 3. Update the record with the results
    await prisma.strategyIntake.update({
      where: { id: intakeId },
      data: {
        readinessScore: finalScore,
        // Optionally store the detailed breakdown in the JSON metadata
        payload: {
          ...(payload as object),
          calculatedAt: new Date().toISOString(),
          analysisVersion: "2.1.0-alpha"
        }
      }
    });

    console.log(`🛡️ [STRATEGY_ANALYSIS]: Score ${finalScore} generated for Intake ${intakeId}`);

    return NextResponse.json({ 
      success: true, 
      score: finalScore 
    });

  } catch (error) {
    console.error("❌ [ANALYSIS_ENGINE_ERROR]:", error);
    return NextResponse.json({ error: "Analysis engine failure" }, { status: 500 });
  }
}