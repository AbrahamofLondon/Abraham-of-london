import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// The specific assessment ID from your last run
const ASSESSMENT_ID = "cmn3y0pl20001y47wedho8v6x";

async function detectPortfolioDrift() {
  console.log("--- INITIATING DRIFT DETECTION PROTOCOL ---");

  try {
    // 1. Retrieve the specific assessment
    const assessment = await prisma.enterpriseAssessment.findUnique({
      where: { id: ASSESSMENT_ID },
      select: {
        answersJson: true,
        band: true,
        percentScore: true
      }
    });

    if (!assessment || !assessment.answersJson) {
      console.log("!! ERROR: Assessment node not found.");
      return;
    }

    const allBriefs = assessment.answersJson as Record<string, any>;
    const driftThreshold = 70;
    const criticalBriefs: any[] = [];

    // 2. Scan the 75-brief map for scores < 70%
    Object.entries(allBriefs).forEach(([briefId, data]) => {
      if (data.score < driftThreshold) {
        criticalBriefs.push({
          id: briefId,
          score: data.score,
          status: data.status,
          resonance: data.resonance
        });
      }
    });

    // 3. Output the Findings
    console.log(`>> Assessment Band: ${assessment.band}`);
    console.log(`>> Overall Resonance: ${assessment.percentScore}%`);
    console.log(`>> Scan Results: ${criticalBriefs.length} briefs identified with Drift.`);
    console.log("-------------------------------------------");

    if (criticalBriefs.length > 0) {
      console.table(criticalBriefs);
      
      // Calculate Drift Severity
      const avgDriftScore = criticalBriefs.reduce((a, b) => a + b.score, 0) / criticalBriefs.length;
      console.log(`>> Average Drift Score: ${avgDriftScore.toFixed(1)}%`);
      console.log(">> RECOMMENDATION: Priority re-alignment for the above nodes.");
    } else {
      console.log(">> SUCCESS: No briefs currently below the 70% drift threshold.");
    }

    console.log("\n--- DETECTION COMPLETE ---");

  } catch (error) {
    console.error("!! SCAN ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

detectPortfolioDrift();