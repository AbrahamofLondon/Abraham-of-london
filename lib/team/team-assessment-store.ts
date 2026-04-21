import { createHash } from "crypto";

import { prisma } from "@/lib/prisma";
import { persistDiagnosticStage } from "@/lib/diagnostics/journey-store";
import { extractRespondentDerivedTeamTensions } from "@/lib/diagnostics/team-tension-evidence";
import {
  aggregateTeamResponses,
  TEAM_ASSESSMENT_DOMAINS,
  type TeamAssessmentAggregate,
  type TeamAssessmentCampaignStatus,
  type TeamAssessmentMode,
} from "@/lib/team/sentiment-aggregation";
import {
  createTeamAssessmentInviteToken,
  hashTeamAssessmentInviteToken,
  verifyTeamAssessmentInviteToken,
} from "@/lib/team/team-assessment-tokens";

type AnyRecord = Record<string, unknown>;

function s(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function n(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function status(value: unknown): TeamAssessmentCampaignStatus {
  const normalized = s(value, "draft");
  return normalized === "live" || normalized === "closed" || normalized === "archived" ? normalized : "draft";
}

function mode(value: unknown): TeamAssessmentMode {
  return value === "multi_respondent" ? "multi_respondent" : "leader_estimate";
}

function respondentKey(input: { inviteId?: string | null; token?: string | null; email?: string | null }) {
  return createHash("sha256")
    .update(String(input.inviteId || input.token || input.email || "anonymous"))
    .digest("hex");
}

export async function createTeamAssessmentCampaign(input: {
  organisationId?: string | null;
  sponsorUserId?: string | null;
  slug?: string | null;
  title: string;
  mode: TeamAssessmentMode;
  status?: TeamAssessmentCampaignStatus;
  closesAt?: string | null;
  minimumResponseThreshold?: number;
  anonymityMode?: "anonymous" | "attributed";
  domains?: string[];
  leaderEstimate?: Record<string, number | null | undefined> | null;
}) {
  const domains = input.domains?.length ? input.domains : TEAM_ASSESSMENT_DOMAINS;
  return (prisma as any).teamAssessmentCampaign.create({
    data: {
      organisationId: input.organisationId || null,
      sponsorUserId: input.sponsorUserId || null,
      slug: input.slug || null,
      title: input.title,
      mode: input.mode,
      status: input.status || (input.mode === "multi_respondent" ? "live" : "draft"),
      closesAt: input.closesAt ? new Date(input.closesAt) : null,
      minimumResponseThreshold: Math.max(1, input.minimumResponseThreshold ?? 3),
      anonymityMode: input.anonymityMode || "anonymous",
      domainsJson: JSON.stringify(domains),
      leaderEstimateJson: input.leaderEstimate ? JSON.stringify(input.leaderEstimate) : null,
    },
  });
}

export async function issueTeamAssessmentInvites(input: {
  campaignId: string;
  invites: Array<{ email?: string | null; roleLabel?: string | null }>;
  expiresInDays?: number;
}) {
  const campaign = await (prisma as any).teamAssessmentCampaign.findUnique({
    where: { id: input.campaignId },
  });
  if (!campaign) throw new Error("Team assessment campaign not found.");
  if (mode(campaign.mode) !== "multi_respondent") {
    throw new Error("Invites require multi_respondent campaign mode.");
  }
  if (status(campaign.status) === "closed" || status(campaign.status) === "archived") {
    throw new Error("Cannot issue invites for a closed campaign.");
  }

  const issued = [];
  for (const invite of input.invites) {
    const created = await (prisma as any).teamAssessmentInvite.create({
      data: {
        campaignId: input.campaignId,
        tokenHash: `pending:${Date.now()}:${Math.random()}`,
        email: invite.email || null,
        roleLabel: invite.roleLabel || null,
        status: "issued",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * (input.expiresInDays ?? 14)),
      },
    });
    const expiresAt = created.expiresAt instanceof Date
      ? created.expiresAt.getTime()
      : Date.now() + 1000 * 60 * 60 * 24 * (input.expiresInDays ?? 14);
    const token = createTeamAssessmentInviteToken({
      inviteId: created.id,
      campaignId: input.campaignId,
      email: invite.email || null,
      issuedAt: Date.now(),
      expiresAt,
    });
    const tokenHash = hashTeamAssessmentInviteToken(token);
    const updated = await (prisma as any).teamAssessmentInvite.update({
      where: { id: created.id },
      data: { tokenHash },
    });
    issued.push({ ...updated, token, responseUrl: `/assessment/${token}` });
  }

  return issued;
}

export async function getTeamAssessmentRespondentContext(token: string) {
  const payload = verifyTeamAssessmentInviteToken(token);
  if (!payload) return null;
  const invite = await (prisma as any).teamAssessmentInvite.findUnique({
    where: { tokenHash: hashTeamAssessmentInviteToken(token) },
    include: { campaign: true },
  });
  if (!invite || invite.id !== payload.inviteId || invite.campaignId !== payload.campaignId) return null;

  const campaignStatus = status(invite.campaign.status);
  const expired =
    invite.expiresAt instanceof Date && Number.isFinite(invite.expiresAt.getTime())
      ? Date.now() > invite.expiresAt.getTime()
      : false;
  if (expired && invite.status !== "submitted") {
    await (prisma as any).teamAssessmentInvite.update({
      where: { id: invite.id },
      data: { status: "expired" },
    });
  } else if (invite.status === "issued") {
    await (prisma as any).teamAssessmentInvite.update({
      where: { id: invite.id },
      data: { status: "opened", openedAt: new Date() },
    });
  }

  return {
    invite,
    campaign: invite.campaign,
    deniedReason:
      expired ? "Invite expired." :
      campaignStatus === "closed" || campaignStatus === "archived" ? "Campaign is closed." :
      invite.status === "submitted" ? "Response already submitted." :
      null,
  };
}

export async function submitTeamAssessmentResponse(input: {
  token: string;
  answers: Record<string, number>;
}) {
  const context = await getTeamAssessmentRespondentContext(input.token);
  if (!context) throw new Error("Invite is invalid or expired.");
  if (context.deniedReason) throw new Error(context.deniedReason);

  const domains = parseJson<string[]>(context.campaign.domainsJson, TEAM_ASSESSMENT_DOMAINS);
  const filteredAnswers: Record<string, number> = {};
  for (const domain of domains) {
    filteredAnswers[domain] = Math.max(0, Math.min(100, n(input.answers[domain], 0)));
  }

  const response = await (prisma as any).teamAssessmentResponse.create({
    data: {
      campaignId: context.campaign.id,
      inviteId: context.invite.id,
      respondentKey: respondentKey({ inviteId: context.invite.id, token: input.token, email: context.invite.email }),
      answersJson: JSON.stringify(filteredAnswers),
    },
  });
  await (prisma as any).teamAssessmentInvite.update({
    where: { id: context.invite.id },
    data: { status: "submitted", submittedAt: new Date() },
  });
  const aggregate = await computeAndPersistTeamAssessmentAggregate(context.campaign.id);
  return { response, aggregate };
}

export async function fetchTeamAssessmentCampaignStatus(campaignId: string) {
  const campaign = await (prisma as any).teamAssessmentCampaign.findUnique({
    where: { id: campaignId },
    include: { invites: true, aggregate: true },
  });
  if (!campaign) return null;
  const submittedCount = campaign.invites.filter((invite: AnyRecord) => invite.status === "submitted").length;
  return {
    id: campaign.id,
    title: campaign.title,
    mode: campaign.mode,
    status: campaign.status,
    anonymityMode: campaign.anonymityMode,
    minimumResponseThreshold: campaign.minimumResponseThreshold,
    domains: parseJson<string[]>(campaign.domainsJson, TEAM_ASSESSMENT_DOMAINS),
    invitedCount: campaign.invites.length,
    submittedCount,
    completionRate: campaign.invites.length ? submittedCount / campaign.invites.length : 0,
    aggregate: campaign.aggregate ? {
      respondentCount: campaign.aggregate.respondentCount,
      invitedCount: campaign.aggregate.invitedCount,
      completionRate: campaign.aggregate.completionRate,
      confidence: campaign.aggregate.confidence,
      claimLevel: campaign.aggregate.claimLevel,
      domains: parseJson(campaign.aggregate.domainsJson, {}),
    } : null,
  };
}

export async function closeTeamAssessmentCampaign(campaignId: string) {
  await (prisma as any).teamAssessmentCampaign.update({
    where: { id: campaignId },
    data: { status: "closed" },
  });
  return computeAndPersistTeamAssessmentAggregate(campaignId);
}

export async function computeAndPersistTeamAssessmentAggregate(campaignId: string): Promise<TeamAssessmentAggregate> {
  const campaign = await (prisma as any).teamAssessmentCampaign.findUnique({
    where: { id: campaignId },
    include: { invites: true, responses: true },
  });
  if (!campaign) throw new Error("Team assessment campaign not found.");

  const domains = parseJson<string[]>(campaign.domainsJson, TEAM_ASSESSMENT_DOMAINS);
  const leaderEstimate = parseJson<Record<string, number | null>>(campaign.leaderEstimateJson, {});
  const aggregate = aggregateTeamResponses({
    campaignId,
    mode: mode(campaign.mode),
    status: status(campaign.status),
    responses: campaign.responses.map((response: AnyRecord) => ({
      respondentKey: s(response.respondentKey),
      answers: parseJson<Record<string, number>>(response.answersJson, {}),
    })),
    invitedCount: campaign.invites.length,
    minimumResponseThreshold: campaign.minimumResponseThreshold,
    leaderEstimate,
    domains,
  });

  await (prisma as any).teamAssessmentAggregate.upsert({
    where: { campaignId },
    create: {
      campaignId,
      respondentCount: aggregate.respondentCount,
      invitedCount: aggregate.invitedCount,
      completionRate: aggregate.completionRate,
      confidence: aggregate.confidence,
      claimLevel: aggregate.claimLevel,
      domainsJson: JSON.stringify(aggregate.domains),
    },
    update: {
      respondentCount: aggregate.respondentCount,
      invitedCount: aggregate.invitedCount,
      completionRate: aggregate.completionRate,
      confidence: aggregate.confidence,
      claimLevel: aggregate.claimLevel,
      domainsJson: JSON.stringify(aggregate.domains),
    },
  });

  const respondentTensions = extractRespondentDerivedTeamTensions(aggregate);

  await persistDiagnosticStage({
    subjectId: campaign.id,
    organisation: campaign.organisationId || null,
    stage: "team",
    payload: {
      mode: aggregate.mode,
      campaignId,
      aggregate,
    },
    tensions: respondentTensions.map((signal) => signal.signal),
    routeDecision: { source: "team_assessment_campaign", claimLevel: aggregate.claimLevel },
    snapshot: {
      timestamp: new Date().toISOString(),
      stage: "team",
      coreMetrics: Object.fromEntries(
        Object.entries(aggregate.domains).map(([domain, value]) => [domain, value.teamMean]),
      ),
      tensions: Object.entries(aggregate.domains)
        .filter(([, domain]) => domain.teamMean < 45 || domain.disagreementDensity >= 45)
        .map(([domain]) => domain),
      escalationLevel: aggregate.claimLevel === "team_wide_sentiment" ? 2 : 1,
      directive: aggregate.claimLevel,
    },
  });

  return aggregate;
}
