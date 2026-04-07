// app/api/alignment/enterprise/campaigns/[id]/report/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getCampaignById,
  getOrganisationSnapshot,
  getLeadershipGapSnapshot,
  getTeamSnapshots,
  loadCampaignAssessments,
} from "@/lib/alignment/enterprise-repository";

export const runtime = "nodejs";

/**
 * DRIFT PREVENTION: 
 * We extract the exact type from the Repository's return promise.
 * This ensures the 'participant' and 'membership' shapes stay 100% 
 * synced with the database and repository logic.
 */
type CampaignWithParticipants = Awaited<ReturnType<typeof getCampaignById>>;
type Participant = NonNullable<CampaignWithParticipants>['participants'][number];

type RouteContext = {
  params: {
    id: string;
  };
};

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeDate(value: Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const campaignId = normalizeString(context.params?.id);

    if (!campaignId) {
      return NextResponse.json(
        { ok: false, error: "Campaign id is required" },
        { status: 400 },
      );
    }

    // SSOT repository call
    const campaign = await getCampaignById(campaignId);

    if (!campaign) {
      return NextResponse.json(
        { ok: false, error: "Campaign not found" },
        { status: 404 },
      );
    }

    // Typed directly from the repository 'include' block
    const participants: Participant[] = campaign.participants || [];

    const completedParticipants = participants.filter(
      (participant) => participant?.status === "completed"
    );

    const [
      organisationSnapshot,
      leadershipGapSnapshot,
      teamSnapshots,
      assessments,
    ] = await Promise.all([
      getOrganisationSnapshot(campaign.organisationId),
      getLeadershipGapSnapshot(campaignId),
      getTeamSnapshots(campaignId),
      loadCampaignAssessments(campaignId),
    ]);

    return NextResponse.json({
      ok: true,
      report: {
        campaign: {
          id: campaign.id,
          title: campaign.title,
          objective: campaign.objective,
          status: campaign.status,
          organisationId: campaign.organisationId,
          opensAt: normalizeDate(campaign.opensAt),
          closesAt: normalizeDate(campaign.closesAt),
          cadenceType: campaign.cadenceType,
          createdAt: normalizeDate(campaign.createdAt),
          updatedAt: normalizeDate(campaign.updatedAt),
          metadata: campaign.metadata,
          organisation: campaign.organisation
            ? {
                id: campaign.organisation.id,
                name: campaign.organisation.name,
              }
            : null,
        },

        participants: {
          total: participants.length,
          completed: completedParticipants.length,
          invited: participants.filter((p) => p?.status === "invited").length,
          opened: participants.filter((p) => p?.status === "opened").length,
          completionRate:
            participants.length > 0
              ? Number(
                  (
                    (completedParticipants.length / participants.length) *
                    100
                  ).toFixed(2),
                )
              : 0,
          rows: completedParticipants.map((participant) => ({
            id: participant.id,
            status: participant.status,
            email: participant.membership?.userEmail ?? null,
            name: participant.membership?.userName ?? null,
            teamName: participant.membership?.teamName ?? null,
            isExecutive: Boolean(participant.membership?.isExecutive),
            openedAt: normalizeDate(participant.openedAt),
            completedAt: normalizeDate(participant.completedAt),
            createdAt: normalizeDate(participant.createdAt),
          })),
        },

        snapshot: organisationSnapshot
          ? {
              id: organisationSnapshot.id,
              campaignId: organisationSnapshot.campaignId,
              organisationId: organisationSnapshot.organisationId,
              cohortSize: organisationSnapshot.cohortSize,
              finalizedAt: normalizeDate(organisationSnapshot.finalizedAt),
              aggregatedData: organisationSnapshot.aggregatedData ?? null,
            }
          : null,

        leadershipGap: leadershipGapSnapshot ?? null,
        teamSnapshots: teamSnapshots ?? [],
        assessments: assessments ?? [],
      },
    });
  } catch (error) {
    console.error("[ENTERPRISE_CAMPAIGN_REPORT_GET_ERROR]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to generate campaign report",
      },
      { status: 500 },
    );
  }
}