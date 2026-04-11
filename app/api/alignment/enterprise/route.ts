export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createCampaignSchema } from "@/lib/alignment/enterprise-schemas";
import { createCampaign, createCampaignParticipants } from "@/lib/alignment/enterprise-repository";

// Type matching the CampaignParticipant model from Prisma
type CampaignParticipantInput = {
  email?: string;
};

type CampaignParticipantCreateInput = {
  campaignId: string;
  email: string;
  status: "invited";
  inviteTokenHash: string;
};

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCampaignSchema.parse(body);

    // ✅ FIX: Use nested connect for relations, not raw ID fields
    const campaign = await createCampaign({
      organisation: {
        connect: {
          id: parsed.organisationId,
        },
      },
      title: parsed.title,
      objective: parsed.objective ?? null,
      opensAt: parsed.opensAt ? new Date(parsed.opensAt) : null,
      closesAt: parsed.closesAt ? new Date(parsed.closesAt) : null,
      cadenceType: parsed.cadenceType,
      createdByMembership: parsed.createdByMembershipId ? {
        connect: {
          id: parsed.createdByMembershipId,
        },
      } : undefined,
    });

    // Handle participants if provided
    if (Array.isArray(body?.participants) && body.participants.length > 0) {
      const mappedParticipants: CampaignParticipantCreateInput[] = body.participants
        .map((p: CampaignParticipantInput) => ({
          campaignId: campaign.id,
          email: normalizeEmail(p?.email),
          status: "invited" as const,
          inviteTokenHash: crypto.randomBytes(32).toString("hex"),
        }))
        .filter((p: CampaignParticipantCreateInput) => Boolean(p.email));

      if (mappedParticipants.length > 0) {
        await createCampaignParticipants(mappedParticipants);
      }
    }

    return NextResponse.json({ ok: true, campaign });
  } catch (error) {
    console.error("[CAMPAIGN_CREATE_ERROR]", error);
    
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}