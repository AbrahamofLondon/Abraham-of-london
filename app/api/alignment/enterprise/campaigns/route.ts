// app/api/alignment/enterprise/campaigns/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createCampaignSchema } from "@/lib/alignment/enterprise-schemas";
import { createCampaign, createCampaignParticipants } from "@/lib/alignment/enterprise-repository";

type ParticipantInput = {
  email?: string;
};

type MappedParticipant = {
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
    const validatedData = createCampaignSchema.parse(body);

    // ✅ FIX: Use the nested connect pattern that Prisma expects
    const campaign = await createCampaign({
      organisation: {
        connect: {
          id: validatedData.organisationId,
        },
      },
      title: validatedData.title,
      objective: validatedData.objective ?? null,
      opensAt: validatedData.opensAt ? new Date(validatedData.opensAt) : null,
      closesAt: validatedData.closesAt ? new Date(validatedData.closesAt) : null,
      cadenceType: validatedData.cadenceType,
      createdByMembershipId: validatedData.createdByMembershipId ?? null,
    });

    // Handle participants if provided
    if (Array.isArray(body?.participants) && body.participants.length > 0) {
      const mappedParticipants: MappedParticipant[] = body.participants
        .map((p: ParticipantInput) => ({
          campaignId: campaign.id,
          email: normalizeEmail(p?.email),
          status: "invited" as const,
          inviteTokenHash: crypto.randomBytes(32).toString("hex"),
        }))
        .filter((p: MappedParticipant) => Boolean(p.email));

      if (mappedParticipants.length > 0) {
        await createCampaignParticipants(mappedParticipants);
      }
    }

    return NextResponse.json(
      {
        success: true,
        campaignId: campaign.id,
        message: "Campaign and participants initialized successfully.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[CAMPAIGN_CREATE_ERROR]", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to initialize campaign";
    
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 400 });
  }
}