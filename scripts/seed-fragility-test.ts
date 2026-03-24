import { prisma } from "@/lib/prisma";
import { crypto } from "crypto";
import { calculateEnterpriseAssessment } from "@/lib/alignment/enterprise-logic";
import { generateCampaignSnapshots } from "@/lib/alignment/enterprise-snapshot-service";

async function seedFragilityTest() {
  console.log("🚀 Initializing Fragility Stress Test...");

  // 1. Create the Organisation
  const org = await prisma.organisation.create({
    data: {
      name: "Global Logistics Fragmented",
      slug: "global-logistics-fragile",
      sector: "Logistics",
      region: "EMEA",
    },
  });

  // 2. Create the Campaign
  const campaign = await prisma.alignmentCampaign.create({
    data: {
      organisationId: org.id,
      title: "Q1 Strategic Integrity Audit",
      status: "open",
      cadenceType: "ad_hoc",
    },
  });

  // 3. Generate Mock Assessments
  const mockResponses = [];

  // EXECUTIVES (3): Answering "True" to everything (Over-optimistic)
  for (let i = 0; i < 3; i++) {
    const answers = {};
    // Assume all 50 questions from enterprise-checklist are True
    // (Logic: Executives often believe systems are perfect)
    mockResponses.push({ isExecutive: true, team: "Executive Suite", answers });
  }

  // OPERATIONS TEAM (17): Answering "False" to critical domains (The Ground Truth)
  for (let i = 0; i < 17; i++) {
    const answers = {}; 
    // Logic: Operations feeling the friction of Resource Flow and Communication
    mockResponses.push({ isExecutive: false, team: "Ops & Delivery", answers });
  }

  // 4. Save to DB
  for (const mock of mockResponses) {
    const score = calculateEnterpriseAssessment(mock.answers);
    const participant = await prisma.campaignParticipant.create({
      data: {
        campaignId: campaign.id,
        email: `user-${crypto.randomBytes(4).toString("hex")}@example.com`,
        status: "completed",
        inviteTokenHash: crypto.randomBytes(32).toString("hex"),
      }
    });

    await prisma.enterpriseAssessment.create({
      data: {
        campaignId: campaign.id,
        participantId: participant.id,
        organisationId: org.id,
        teamName: mock.team,
        isExecutive: mock.isExecutive,
        answersJson: mock.answers,
        totalScore: score.totalScore,
        possibleScore: score.possibleScore,
        percentScore: score.percentScore,
        band: score.band,
        domainScoresJson: score.domainScores as any,
        weakestDomainsJson: score.weakestDomains as any,
        strongestDomainsJson: score.strongestDomains as any,
      }
    });
  }

  // 5. Trigger Synthesis
  await generateCampaignSnapshots(campaign.id);

  console.log(`✅ Success. View the fragility at: /admin/organisations/${org.id}`);
}

seedFragilityTest().catch(console.error);