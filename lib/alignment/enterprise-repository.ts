// lib/alignment/enterprise-repository.ts
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type {
  EnterpriseAlignmentBand,
  EnterpriseAlignmentDomain,
  EnterpriseDomainScore,
  EnterpriseLeadershipGap,
  EnterpriseVarianceScore,
} from "./enterprise-types";

/* -----------------------------------------------------------------------------
   JSON NORMALISATION
----------------------------------------------------------------------------- */

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function toPrismaJsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) {
    return null as unknown as Prisma.InputJsonValue;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => toPrismaJsonValue(item)) as Prisma.InputJsonArray;
  }

  if (isPlainObject(value)) {
    const out: Record<string, Prisma.InputJsonValue> = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = toPrismaJsonValue(val);
    }
    return out as Prisma.InputJsonObject;
  }

  return String(value);
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeString(item)).filter(Boolean);
}

function parseDomainArray(value: unknown): EnterpriseAlignmentDomain[] {
  return parseStringArray(value) as EnterpriseAlignmentDomain[];
}

function parseDomainScores(value: unknown): EnterpriseDomainScore[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isPlainObject)
    .map((item) => ({
      domain: normalizeString(item.domain) as EnterpriseAlignmentDomain,
      earned: normalizeNumber(item.earned, 0),
      possible: normalizeNumber(item.possible, 0),
      percent: normalizeNumber(item.percent, 0),
    }))
    .filter((item) => Boolean(item.domain));
}

function parseVarianceScores(value: unknown): EnterpriseVarianceScore[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isPlainObject)
    .map((item) => ({
      domain: normalizeString(item.domain) as EnterpriseAlignmentDomain,
      variance: normalizeNumber(item.variance, 0),
    }))
    .filter((item) => Boolean(item.domain));
}

function parseLeadershipGaps(value: unknown): EnterpriseLeadershipGap[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isPlainObject)
    .map((item) => ({
      domain: normalizeString(item.domain) as EnterpriseAlignmentDomain,
      executivePercent: normalizeNumber(item.executivePercent, 0),
      nonExecutivePercent: normalizeNumber(item.nonExecutivePercent, 0),
      delta: normalizeNumber(item.delta, 0),
    }))
    .filter((item) => Boolean(item.domain));
}

/* -----------------------------------------------------------------------------
   CONTRACT TYPES
----------------------------------------------------------------------------- */

export type EnterpriseAssessmentPersistenceInput = {
  campaignId: string;
  participantId: string;
  organisationId: string;
  teamName?: string | null;
  isExecutive?: boolean;
  answersJson: Record<string, unknown>;
  totalScore: number;
  possibleScore: number;
  percentScore: number;
  band: EnterpriseAlignmentBand;
  weakestDomains: EnterpriseAlignmentDomain[];
  strongestDomains: EnterpriseAlignmentDomain[];
  domainScores: EnterpriseDomainScore[];
};

export type OrganisationSnapshotPersistenceInput = {
  campaignId: string;
  organisationId: string;
  respondentCount: number;
  invitedCount: number;
  completionRate: number;
  totalScore: number;
  possibleScore: number;
  percentScore: number;
  band: EnterpriseAlignmentBand;
  weakestDomains: EnterpriseAlignmentDomain[];
  strongestDomains: EnterpriseAlignmentDomain[];
  domainScores: EnterpriseDomainScore[];
  varianceScores: EnterpriseVarianceScore[];
  fragilitySignal: "HIGH" | "MEDIUM" | "LOW" | null;
  dissonanceArea: number;
  confidenceScore?: number | null;
};

export type LeadershipGapSnapshotPersistenceInput = {
  campaignId: string;
  organisationId: string;
  overallGapPercent: number;
  domainGaps: EnterpriseLeadershipGap[];
  interpretationFlags: string[];
};

export type TeamSnapshotPersistenceInput = {
  organisationId: string;
  teamName: string;
  respondentCount: number;
  totalScore: number;
  possibleScore: number;
  percentScore: number;
  band: EnterpriseAlignmentBand;
  weakestDomains: EnterpriseAlignmentDomain[];
  strongestDomains: EnterpriseAlignmentDomain[];
  domainScores: EnterpriseDomainScore[];
  varianceScores: EnterpriseVarianceScore[];
};

/* -----------------------------------------------------------------------------
   CORE CAMPAIGN & REGISTRY RETRIEVAL
----------------------------------------------------------------------------- */

export async function getCampaignById(id: string) {
  return db.alignmentCampaign.findUnique({
    where: { id },
    include: {
      organisation: true,
      participants: {
        include: { membership: true },
      },
    },
  });
}

export async function getOrganisationSnapshot(orgId: string) {
  return db.alignmentSnapshot.findFirst({
    where: { organisationId: orgId },
    orderBy: { finalizedAt: "desc" },
  });
}

/* -----------------------------------------------------------------------------
   PARTICIPANT & ASSESSMENT LIFECYCLE
----------------------------------------------------------------------------- */

export async function getParticipantByInviteTokenHash(tokenHash: string) {
  return db.campaignParticipant.findFirst({
    where: { inviteToken: tokenHash },
    include: {
      membership: true,
      campaign: {
        include: {
          organisation: true,
        },
      },
    },
  });
}

export async function markParticipantOpened(id: string) {
  return db.campaignParticipant.update({
    where: { id },
    data: {
      status: "opened",
      openedAt: new Date(),
    },
  });
}

export async function markParticipantCompleted(id: string) {
  return db.campaignParticipant.update({
    where: { id },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
  });
}

export async function saveEnterpriseAssessment(
  data: EnterpriseAssessmentPersistenceInput,
) {
  return db.$transaction(async (tx) => {
    await tx.enterpriseAssessment.deleteMany({
      where: { participantId: data.participantId },
    });

    return tx.enterpriseAssessment.create({
      data: {
        campaignId: data.campaignId,
        participantId: data.participantId,
        organisationId: data.organisationId,
        teamName: data.teamName ?? null,
        isExecutive: Boolean(data.isExecutive),
        answersJson: toPrismaJsonValue(data.answersJson),
        totalScore: data.totalScore,
        possibleScore: data.possibleScore,
        percentScore: data.percentScore,
        band: data.band,
        weakestDomainsJson: toPrismaJsonValue(data.weakestDomains),
        strongestDomainsJson: toPrismaJsonValue(data.strongestDomains),
        domainScoresJson: toPrismaJsonValue(data.domainScores),
      },
    });
  });
}

/* -----------------------------------------------------------------------------
   AGGREGATION DATA LOADING
----------------------------------------------------------------------------- */

export async function loadCampaignAssessments(campaignId: string) {
  const participants = await db.campaignParticipant.findMany({
    where: { campaignId, status: "completed" },
    include: {
      assessment: true,
      membership: true,
    },
  });

  return participants.map((participant) => {
    const assessment = participant.assessment as any;

    return {
      percentScore: normalizeNumber(assessment?.percentScore, 0),
      totalScore: normalizeNumber(assessment?.totalScore, 0),
      possibleScore: normalizeNumber(assessment?.possibleScore, 100),
      band: normalizeString(assessment?.band) as EnterpriseAlignmentBand,
      domainScoresJson: parseDomainScores(assessment?.domainScoresJson),
      teamName:
        normalizeString(participant.membership?.teamName) || "General Operations",
      isExecutive: Boolean(participant.membership?.isExecutive),
    };
  });
}

/* -----------------------------------------------------------------------------
   ATOMIC SNAPSHOT PERSISTENCE
----------------------------------------------------------------------------- */

export async function replaceOrganisationSnapshot(
  data: OrganisationSnapshotPersistenceInput,
) {
  return db.alignmentSnapshot.upsert({
    where: { campaignId: data.campaignId },
    update: {
      cohortSize: data.respondentCount,
      finalizedAt: new Date(),
      aggregatedData: toPrismaJsonValue(data),
    },
    create: {
      campaignId: data.campaignId,
      organisationId: data.organisationId,
      cohortSize: data.respondentCount,
      finalizedAt: new Date(),
      aggregatedData: toPrismaJsonValue(data),
    },
  });
}

export async function replaceLeadershipGapSnapshot(
  data: LeadershipGapSnapshotPersistenceInput,
) {
  return db.leadershipGapSnapshot.upsert({
    where: { campaignId: data.campaignId },
    update: {
      overallGapPercent: data.overallGapPercent,
      domainGapsJson: toPrismaJsonValue(data.domainGaps),
      interpretationFlagsJson: toPrismaJsonValue(data.interpretationFlags),
      generatedAt: new Date(),
    },
    create: {
      campaignId: data.campaignId,
      organisationId: data.organisationId,
      overallGapPercent: data.overallGapPercent,
      domainGapsJson: toPrismaJsonValue(data.domainGaps),
      interpretationFlagsJson: toPrismaJsonValue(data.interpretationFlags),
    },
  });
}

export async function replaceTeamSnapshots(
  campaignId: string,
  snapshots: TeamSnapshotPersistenceInput[],
) {
  return db.$transaction(async (tx) => {
    await tx.teamAssessmentSnapshot.deleteMany({
      where: { campaignId },
    });

    if (!snapshots.length) {
      return { count: 0 };
    }

    return tx.teamAssessmentSnapshot.createMany({
      data: snapshots.map((snapshot) => ({
        campaignId,
        organisationId: snapshot.organisationId,
        teamName: snapshot.teamName,
        respondentCount: snapshot.respondentCount,
        totalScore: snapshot.totalScore,
        possibleScore: snapshot.possibleScore,
        percentScore: snapshot.percentScore,
        band: snapshot.band,
        weakestDomainsJson: toPrismaJsonValue(snapshot.weakestDomains),
        strongestDomainsJson: toPrismaJsonValue(snapshot.strongestDomains),
        domainScoresJson: toPrismaJsonValue(snapshot.domainScores),
        varianceScoresJson: toPrismaJsonValue(snapshot.varianceScores),
      })),
    });
  });
}

/* -----------------------------------------------------------------------------
   DASHBOARD & ADMIN VIEWS
----------------------------------------------------------------------------- */

export async function getEnterpriseDashboardView(orgId: string) {
  return db.organisation.findUnique({
    where: { id: orgId },
    include: {
      campaigns: { orderBy: { createdAt: "desc" } },
      snapshots: { orderBy: { finalizedAt: "desc" }, take: 1 },
    },
  });
}

export async function createOrganisation(data: Prisma.OrganisationCreateInput) {
  return db.organisation.create({ data });
}

export async function createCampaign(data: Prisma.AlignmentCampaignCreateInput) {
  return db.alignmentCampaign.create({ data });
}

export async function updateCampaignStatus(id: string, status: string) {
  return db.alignmentCampaign.update({
    where: { id },
    data: { status },
  });
}

// ✅ FIXED: Pattern 1 - Explicit payload (campaignId included in data)
export async function createCampaignParticipants(
  data: Prisma.CampaignParticipantCreateManyInput[],
) {
  return db.campaignParticipant.createMany({
    data,
  });
}

/* -----------------------------------------------------------------------------
   OPTIONAL READ HELPERS
----------------------------------------------------------------------------- */

export async function getLeadershipGapSnapshot(campaignId: string) {
  const row = await db.leadershipGapSnapshot.findUnique({
    where: { campaignId },
  });

  if (!row) return null;

  return {
    overallGapPercent: row.overallGapPercent,
    domainGaps: parseLeadershipGaps(row.domainGapsJson),
    interpretationFlags: parseStringArray(row.interpretationFlagsJson),
  };
}

export async function getTeamSnapshots(campaignId: string) {
  const rows = await db.teamAssessmentSnapshot.findMany({
    where: { campaignId },
    orderBy: { teamName: "asc" },
  });

  return rows.map((row) => ({
    teamName: row.teamName,
    respondentCount: row.respondentCount,
    totalScore: row.totalScore,
    possibleScore: row.possibleScore,
    percentScore: row.percentScore,
    band: row.band as EnterpriseAlignmentBand,
    weakestDomains: parseDomainArray(row.weakestDomainsJson),
    strongestDomains: parseDomainArray(row.strongestDomainsJson),
    domainScores: parseDomainScores(row.domainScoresJson),
    varianceScores: parseVarianceScores(row.varianceScoresJson),
  }));
}