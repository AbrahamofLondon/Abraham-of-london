export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createCampaignInvitesSchema } from "@/lib/alignment/enterprise-schemas";
import {
  createCampaignParticipants,
  getCampaignById,
} from "@/lib/alignment/enterprise-repository";
import { createEnterpriseInviteBundle } from "@/lib/alignment/enterprise-invites";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function getBaseUrl(req: NextRequest): string {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.APP_URL;

  if (envUrl && /^https?:\/\//i.test(envUrl)) {
    return envUrl.replace(/\/+$/, "");
  }

  const protocol =
    req.headers.get("x-forwarded-proto") ||
    (process.env.NODE_ENV === "development" ? "http" : "https");

  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "localhost:3000";

  return `${protocol}://${host}`.replace(/\/+$/, "");
}

type CreatedParticipantRecord = {
  id: string;
  email: string;
  membershipId: string | null;
  status: string;
  invitedAt: Date;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const parsed = createCampaignInvitesSchema.parse({
      ...body,
      id,
    });

    const campaign = await getCampaignById(id);
    if (!campaign) {
      return errorResponse("Campaign not found", 404);
    }

    if (["closed", "archived"].includes(campaign.status)) {
      return errorResponse(
        "Cannot issue invites for a closed or archived campaign",
        409
      );
    }

    const baseUrl = getBaseUrl(req);

    const invitePayloads = parsed.participants.map((participant) => {
      const participantKey =
        participant.membershipId?.trim() ||
        `${id}:${participant.email.toLowerCase()}`;

      const invite = createEnterpriseInviteBundle({
        participantId: participantKey,
        campaignId: id,
        email: participant.email,
        expiresInDays: 14,
      });

      return {
        campaignId: id, // ✅ CRITICAL — embedded here
        membershipId: participant.membershipId ?? null,
        email: participant.email,
        inviteTokenHash: invite.tokenHash,

        // transient fields (NOT stored)
        rawToken: invite.token,
        inviteUrl: `${baseUrl}/enterprise/alignment/respond/${invite.token}`,
        expiresAt: new Date(invite.payload.expiresAt).toISOString(),
      };
    });

    // ✅ Clean, explicit, type-safe
    const createdParticipants = (await createCampaignParticipants(
      invitePayloads.map((item) => ({
        campaignId: item.campaignId,
        membershipId: item.membershipId,
        email: item.email,
        inviteTokenHash: item.inviteTokenHash,
      }))
    )) as CreatedParticipantRecord[];

    const invites = createdParticipants.map((record) => {
      const payload = invitePayloads.find(
        (p) => p.email.toLowerCase() === record.email.toLowerCase()
      );

      if (!payload) {
        throw new Error(
          `Integrity Error: No matching payload for ${record.email}`
        );
      }

      return {
        id: record.id,
        email: record.email,
        membershipId: record.membershipId,
        status: record.status,
        invitedAt: record.invitedAt.toISOString(),
        inviteUrl: payload.inviteUrl,
        expiresAt: payload.expiresAt,
      };
    });

    return NextResponse.json({
      ok: true,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        organisationId: campaign.organisationId,
        status: campaign.status,
      },
      count: createdParticipants.length,
      invites,
    });
  } catch (error) {
    console.error("[INVITE_ERROR]:", error);

    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }

    return errorResponse("Unable to create campaign invites", 400);
  }
}