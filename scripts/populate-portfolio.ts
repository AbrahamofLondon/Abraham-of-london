import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// CONFIGURATION
const CAMPAIGN_ID = "cmn3xfke40004y47wuk15pnfa";
const PARTICIPANT_ID = "cmn3xfkg70006y47wv9klnqj4";
const ORG_ID = "sovereign-intelligence-group";

async function populateFullPortfolio() {
  console.log("--- GENERATING FULL PORTFOLIO TELEMETRY (75 BRIEFS) ---");

  try {
    const briefs: Record<string, any> = {};
    let totalAccumulatedScore = 0;

    // 1. Generate 75 Intelligence Brief Signals
    for (let i = 1; i <= 75; i++) {
      const briefId = `brief-${String(i).padStart(3, '0')}`;
      
      // Simulate varied performance across the portfolio
      const score = Math.floor(Math.random() * (100 - 60 + 1)) + 60; // 60-100 range
      const status = score > 85 ? "stable" : score > 75 ? "monitoring" : "drift_detected";
      
      briefs[briefId] = {
        score,
        status,
        resonance: (score * 0.9).toFixed(1),
        lastAudit: new Date().toISOString()
      };
      
      totalAccumulatedScore += score;
    }

    const averageScore = Math.round(totalAccumulatedScore / 75);
    const possibleScore = 7500; // 75 briefs * 100 max
    const percentScore = Math.round((totalAccumulatedScore / possibleScore) * 100);

    // 2. Map to High-Level Domains
    const domainScores = {
      strategic_alignment: averageScore,
      operational_clarity: Math.min(100, averageScore + 5),
      signal_purity: Math.max(0, averageScore - 3)
    };

    // 3. Commit the Enterprise Assessment
    const assessment = await prisma.enterpriseAssessment.create({
      data: {
        campaignId: CAMPAIGN_ID,
        participantId: PARTICIPANT_ID,
        organisationId: ORG_ID,
        isExecutive: true,
        totalScore: totalAccumulatedScore,
        possibleScore: possibleScore,
        percentScore: percentScore,
        band: percentScore > 85 ? "Sovereign Tier" : "Strategic Tier",
        answersJson: briefs,
        domainScoresJson: domainScores,
        weakestDomainsJson: ["latency_reduction"],
        strongestDomainsJson: ["portfolio_breadth"],
      }
    });

    console.log(`>> Portfolio Map Stabilized: ${assessment.id}`);
    console.log(`>> Total Briefs Ingested: 75`);
    console.log(`>> Aggregate Portfolio Resonance: ${percentScore}%`);
    console.log(`>> Classification: ${assessment.band}`);

    // 4. Update Summary Node
    const summary = await prisma.auditResponse.create({
      data: {
        campaignId: CAMPAIGN_ID,
        resonance: Math.round(percentScore / 10), // Scale 1-10
        certainty: 9, // High certainty for full portfolio audit
      }
    });
    console.log(`>> Summary Heartbeat Updated: ${summary.resonance}/10`);

    console.log("\n--- PORTFOLIO INITIALIZATION SUCCESS ---");

  } catch (error) {
    console.error("!! PORTFOLIO ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

populateFullPortfolio();