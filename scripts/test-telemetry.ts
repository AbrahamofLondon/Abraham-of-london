import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// CONFIGURATION FROM PREVIOUS RUNS
const CAMPAIGN_ID = "cmn3xfke40004y47wuk15pnfa";
const PARTICIPANT_ID = "cmn3xfkg70006y47wv9klnqj4";
const ORG_ID = "sovereign-intelligence-group"; // Replace with your actual Org ID if different

async function runDeepTelemetry() {
  console.log("--- STARTING INTEGRATED TELEMETRY INGESTION ---");

  try {
    // 1. Calculate Summary Metrics (1-10 Scale)
    const resonanceScalar = 8; // High alignment
    const certaintyScalar = 9;  // High signal strength

    // 2. Create the Summary Node (AuditResponse)
    const summary = await prisma.auditResponse.create({
      data: {
        campaignId: CAMPAIGN_ID,
        resonance: resonanceScalar,
        certainty: certaintyScalar,
      }
    });
    console.log(`>> Summary Node Created: ${summary.id}`);

    // 3. Create the Deep Data Node (EnterpriseAssessment)
    const assessment = await prisma.enterpriseAssessment.create({
      data: {
        campaignId: CAMPAIGN_ID,
        participantId: PARTICIPANT_ID,
        organisationId: ORG_ID,
        isExecutive: true,
        totalScore: 450,
        possibleScore: 500,
        percentScore: 90,
        band: "Sovereign Alignment",
        // Storing the 75 briefs logic in JSON structures
        answersJson: {
          brief_001: { score: 95, status: "stable" },
          brief_002: { score: 82, status: "monitoring" },
          // ... logic for all 75 briefs
        },
        domainScoresJson: {
          strategic_intent: 92,
          operational_resonance: 88,
          intelligence_purity: 95
        },
        weakestDomainsJson: ["tactical_latency"],
        strongestDomainsJson: ["long_range_forecasting"],
      }
    });

    console.log(`>> Deep Assessment Node Created: ${assessment.id}`);
    console.log(`>> Status: ${assessment.band} (${assessment.percentScore}%)`);

    // 4. Update Participant to finalize the loop
    await prisma.campaignParticipant.update({
      where: { id: PARTICIPANT_ID },
      data: { status: "completed" }
    });

    console.log("\n--- FULL SPECTRUM TELEMETRY SUCCESS ---");

  } catch (error) {
    console.error("!! INGESTION ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runDeepTelemetry();