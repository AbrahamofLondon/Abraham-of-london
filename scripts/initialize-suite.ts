import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function initializeSovereignSuite() {
  console.log("--- INITIALIZING SOVEREIGN INFRASTRUCTURE ---");

  try {
    // 1. Create the Host Organisation
    const org = await prisma.organisation.upsert({
      where: { slug: "sovereign-intelligence-group" },
      update: {},
      create: {
        name: "Sovereign Intelligence Group",
        slug: "sovereign-intelligence-group",
        sector: "Strategic Intelligence",
        region: "Global",
      },
    });
    console.log(`>> Organisation Stabilized: ${org.name}`);

    // 2. Create the Lead Strategist Membership
    // Note: Replace with your actual email to link to your account
    const membership = await prisma.organisationMembership.upsert({
      where: {
        organisationId_email: {
          organisationId: org.id,
          email: "strategist@sovereign.intelligence", 
        },
      },
      update: {},
      create: {
        organisationId: org.id,
        email: "strategist@sovereign.intelligence",
        fullName: "Lead Strategist",
        roleTitle: "Director of Alignment",
        isExecutive: true,
        status: "active",
      },
    });
    console.log(`>> Strategist Membership Active: ${membership.fullName}`);

    // 3. Launch the First Alignment Campaign
    const campaign = await prisma.alignmentCampaign.create({
      data: {
        organisationId: org.id,
        title: "Q1 Strategic Resonance Audit",
        objective: "Assess organizational drift and identify fragility signals in decision-making nodes.",
        status: "active",
        cadenceType: "quarterly",
        opensAt: new Date(),
        closesAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 Days from now
        createdByMembershipId: membership.id,
      },
    });
    console.log(`>> Campaign Launched: ${campaign.title}`);
    console.log(`>> Campaign ID: ${campaign.id}`);

    // 4. Generate a Test Participant Node
    const participant = await prisma.campaignParticipant.create({
      data: {
        campaignId: campaign.id,
        membershipId: membership.id,
        email: membership.email,
        inviteTokenHash: "test_token_hash_001", // In production, use a secure hash
        status: "invited",
      },
    });
    console.log(`>> Test Participant Node Created: ${participant.id}`);

    console.log("\n--- INFRASTRUCTURE READY ---");
    console.log(`To test telemetry, use Participant ID: ${participant.id}`);
    console.log(`To view the dashboard, use Campaign ID: ${campaign.id}`);

  } catch (error) {
    console.error("!! INITIALIZATION FAILURE:", error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeSovereignSuite();