import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * CORE CAMPAIGN & REGISTRY RETRIEVAL
 */
export async function getCampaignById(id: string) {
  return db.alignmentCampaign.findUnique({
    where: { id },
    include: { 
      organisation: true, 
      participants: {
        include: { membership: true }
      }
    }
  });
}

export async function getOrganisationSnapshot(orgId: string) {
  return db.alignmentSnapshot.findFirst({
    where: { organisationId: orgId },
    orderBy: { finalizedAt: 'desc' }
  });
}

/**
 * PARTICIPANT & ASSESSMENT LIFECYCLE
 */
export async function getParticipantByInviteTokenHash(tokenHash: string) {
  return db.campaignParticipant.findFirst({
    where: { inviteToken: tokenHash },
    include: { membership: true }
  });
}

export async function markParticipantOpened(id: string) {
  return db.campaignParticipant.update({
    where: { id },
    data: { status: 'opened', openedAt: new Date() }
  });
}

export async function markParticipantCompleted(id: string) {
  return db.campaignParticipant.update({
    where: { id },
    data: { status: 'completed', completedAt: new Date() }
  });
}

export async function saveEnterpriseAssessment(participantId: string, data: any) {
  return db.enterpriseAssessment.upsert({
    where: { participantId },
    update: { ...data, updatedAt: new Date() },
    create: { ...data, participantId }
  });
}

/**
 * AGGREGATION DATA LOADING
 */
export async function loadCampaignAssessments(campaignId: string) {
  const participants = await db.campaignParticipant.findMany({
    where: { campaignId, status: 'completed' },
    include: { 
      assessment: true,
      membership: true 
    }
  });

  return participants.map(p => {
    const asm = p.assessment as any;
    return {
      percentScore: asm?.percentScore ?? 0,
      totalScore: asm?.totalScore ?? 0,
      possibleScore: asm?.possibleScore ?? 100,
      domainScoresJson: asm?.domainScoresJson ?? [],
      teamName: p.membership?.teamName ?? "General Operations",
      isExecutive: p.membership?.isExecutive ?? false
    };
  });
}

/**
 * ATOMIC SNAPSHOT PERSISTENCE
 */
export async function replaceOrganisationSnapshot(data: any) {
  return db.alignmentSnapshot.upsert({
    where: { campaignId: data.campaignId },
    update: {
      cohortSize: data.respondentCount,
      finalizedAt: new Date(),
      aggregatedData: data as unknown as Prisma.InputJsonValue,
    },
    create: {
      campaignId: data.campaignId,
      organisationId: data.organisationId,
      cohortSize: data.respondentCount,
      finalizedAt: new Date(),
      aggregatedData: data as unknown as Prisma.InputJsonValue,
    }
  });
}

export async function replaceLeadershipGapSnapshot(data: any) {
  return db.leadershipGapSnapshot.upsert({
    where: { campaignId: data.campaignId },
    update: {
      overallGapPercent: data.overallGapPercent,
      // Map the data keys to your specific Prisma schema field names
      domainGapsJson: data.domainGaps as unknown as Prisma.InputJsonValue,
      interpretationFlagsJson: data.interpretationFlags as unknown as Prisma.InputJsonValue,
      // The model uses @default(now()) for generatedAt, but we can refresh it
      generatedAt: new Date(),
    },
    create: {
      campaignId: data.campaignId,
      organisationId: data.organisationId,
      overallGapPercent: data.overallGapPercent,
      domainGapsJson: data.domainGaps as unknown as Prisma.InputJsonValue,
      interpretationFlagsJson: data.interpretationFlags as unknown as Prisma.InputJsonValue,
    }
  });
}

export async function replaceTeamSnapshots(campaignId: string, snapshots: any[]) {
  return db.$transaction(async (tx) => {
    // 1. Purge stale team data for this specific campaign
    await tx.teamAssessmentSnapshot.deleteMany({
      where: { campaignId }
    });

    // 2. Batch insert the new calculated team snapshots
    return tx.teamAssessmentSnapshot.createMany({
      data: snapshots.map((s) => ({
        campaignId,
        organisationId: s.organisationId,
        teamName: s.teamName,
        respondentCount: s.respondentCount,
        totalScore: s.totalScore,
        possibleScore: s.possibleScore,
        percentScore: s.percentScore,
        band: s.band,
        // Map the intelligence arrays to your Json-suffixed fields
        weakestDomainsJson: s.weakestDomains as unknown as Prisma.InputJsonValue,
        strongestDomainsJson: s.strongestDomains as unknown as Prisma.InputJsonValue,
        domainScoresJson: s.domainScores as unknown as Prisma.InputJsonValue,
        varianceScoresJson: s.varianceScores as unknown as Prisma.InputJsonValue,
        // generatedAt defaults to now() in schema
      }))
    });
  });
}

/**
 * DASHBOARD & ADMIN VIEWS
 */
export async function getEnterpriseDashboardView(orgId: string) {
  return db.organisation.findUnique({
    where: { id: orgId },
    include: {
      campaigns: { orderBy: { createdAt: 'desc' } },
      snapshots: { orderBy: { finalizedAt: 'desc' }, take: 1 }
    }
  });
}

export async function createOrganisation(data: any) {
  return db.organisation.create({ data });
}

export async function createCampaign(data: any) {
  return db.alignmentCampaign.create({ data });
}

export async function updateCampaignStatus(id: string, status: string) {
  return db.alignmentCampaign.update({
    where: { id },
    data: { status }
  });
}

export async function createCampaignParticipants(campaignId: string, participants: any[]) {
  return db.campaignParticipant.createMany({
    data: participants.map(p => ({ ...p, campaignId }))
  });
}