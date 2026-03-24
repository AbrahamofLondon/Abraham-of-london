"use server";

import { prisma } from "@/lib/prisma";
import { CreateCampaignWithParticipantsSchema } from "@/lib/schemas/enterprise";
import { parseParticipantCSV } from "@/lib/utils/csv-parser";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function createCampaignFromCSV(
  organisationId: string, 
  campaignMetadata: { title: string; objective?: string },
  csvContent: string
) {
  // 1. Parse and Validate CSV
  const { data: participants, errors: csvErrors } = await parseParticipantCSV(csvContent);
  
  if (csvErrors.length > 0) {
    return { success: false, error: "CSV Validation Failed", details: csvErrors };
  }

  // 2. Validate Final Payload
  const finalPayload = {
    ...campaignMetadata,
    organisationId,
    participants,
  };

  const validation = CreateCampaignWithParticipantsSchema.safeParse(finalPayload);
  if (!validation.success) {
    return { success: false, error: "Schema Validation Failed", details: validation.error.format() };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create Campaign
      const campaign = await tx.alignmentCampaign.create({
        data: {
          organisationId,
          title: campaignMetadata.title,
          objective: campaignMetadata.objective,
          status: "draft",
        },
      });

      // Create Memberships and Participants
      for (const p of participants) {
        const membership = await tx.organisationMembership.upsert({
          where: { organisationId_email: { organisationId, email: p.email } },
          update: { fullName: p.fullName, teamName: p.teamName },
          create: { organisationId, email: p.email, fullName: p.fullName, teamName: p.teamName },
        });

        const tokenHash = crypto.randomBytes(32).toString("hex"); // In production, hash this!

        await tx.campaignParticipant.create({
          data: {
            campaignId: campaign.id,
            membershipId: membership.id,
            email: p.email,
            inviteTokenHash: tokenHash,
          },
        });
      }
      return campaign;
    });

    revalidatePath(`/organisations/${organisationId}/campaigns`);
    return { success: true, campaignId: result.id };

  } catch (error) {
    return { success: false, error: "Internal Server Error during bulk creation." };
  }
}