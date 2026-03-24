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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;
    const body = await req.json();

    const parsed = createCampaignInvitesSchema.parse({
      ...body,
      campaignId,
    });

    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      return errorResponse("Campaign not found", 404);
    }

    if (campaign.status === "closed" || campaign.status === "archived") {
      return errorResponse(
        "Cannot issue invites for a closed or archived campaign",
        409
      );
    }

    const baseUrl = getBaseUrl(req);

    // 1. Generate local payloads
    const invitePayloads = parsed.participants.map((participant) => {
      const participantKey =
        participant.membershipId?.trim() ||
        `${campaignId}:${participant.email.toLowerCase()}`;

      const invite = createEnterpriseInviteBundle({
        participantId: participantKey,
        campaignId,
        email: participant.email,
        expiresInDays: 14,
      });

      return {
        membershipId: participant.membershipId ?? null,
        email: participant.email,
        inviteTokenHash: invite.tokenHash,
        rawToken: invite.token,
        inviteUrl: `${baseUrl}/enterprise/alignment/respond/${invite.token}`,
        expiresAt: new Date(invite.payload.expiresAt).toISOString(),
      };
    });

    // 2. Persist to Repository
    const createdParticipants = await createCampaignParticipants({
      campaignId,
      participants: invitePayloads.map((item) => ({
        membershipId: item.membershipId,
        email: item.email,
        inviteTokenHash: item.inviteTokenHash,
      })),
    });

    // 3. Safe Response Mapping
    // We map the database records back to the URLs generated in memory.
    // This uses the email as a join key to ensure TS-safety and data integrity.
    const invites = createdParticipants.map((record) => {
      const payload = invitePayloads.find(
        (p) => p.email.toLowerCase() === record.email.toLowerCase()
      );

      if (!payload) {
        throw new Error(`Integrity Error: No matching payload for ${record.email}`);
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