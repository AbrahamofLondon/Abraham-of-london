// app/api/alignment/enterprise/campaigns/route.ts

import { NextResponse } from "next/server";
import { createCampaign, createCampaignParticipants } from "@/lib/alignment/enterprise-repository";
import { createCampaignSchema } from "@/lib/alignment/enterprise-schemas";
import { crypto } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Validate Core Campaign Data
    const validatedData = createCampaignSchema.parse(body);

    // 2. Create the Campaign Record
    const campaign = await createCampaign({
      organisationId: validatedData.organisationId,
      title: validatedData.title,
      objective: validatedData.objective,
      opensAt: validatedData.opensAt ? new Date(validatedData.opensAt) : null,
      closesAt: validatedData.closesAt ? new Date(validatedData.closesAt) : null,
      cadenceType: validatedData.cadenceType,
    });

    // 3. Process Participants if provided
    if (body.participants && Array.isArray(body.participants)) {
      const participantPayload = body.participants.map((p: { email: string }) => ({
        email: p.email.toLowerCase().trim(),
        // Generate a high-entropy hash for the invite token
        inviteTokenHash: crypto.randomBytes(32).toString("hex"),
      }));

      await createCampaignParticipants({
        campaignId: campaign.id,
        participants: participantPayload,
      });
    }

    return NextResponse.json({ success: true, campaignId: campaign.id }, { status: 201 });
  } catch (error: any) {
    console.error("[CAMPAIGN_CREATE_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize campaign" },
      { status: 400 }
    );
  }
}