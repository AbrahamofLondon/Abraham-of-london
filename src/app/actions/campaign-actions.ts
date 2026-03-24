// src/app/actions/campaign-actions.ts
"use server"

import { prisma } from "@/lib/prisma";
import { CreateCampaignRequestSchema } from "@/lib/schemas/campaign";
import { revalidatePath } from "next/cache";
import { crypto } from "crypto"; // For generating invite tokens

export async function handleCreateCampaign(data: any) {
  // 1. Validate against the composite Zod schema
  const result = CreateCampaignRequestSchema.safeParse(data);

  if (!result.success) {
    return { error: result.error.format() };
  }

  const { participants, ...campaignData } = result.data;

  try {
    const newCampaign = await prisma.$transaction(async (tx) => {
      // 2. Create the main Campaign record
      const campaign = await tx.alignmentCampaign.create({
        data: {
          ...campaignData,
          status: "draft",
        },
      });

      // 3. Process Participants: Upsert Memberships AND Create Campaign Links
      for (const p of participants) {
        // Ensure they exist as a Member of the Org first (Upsert)
        const membership = await tx.organisationMembership.upsert({
          where: {
            organisationId_email: {
              organisationId: campaignData.organisationId,
              email: p.email,
            },
          },
          update: {
            fullName: p.fullName,
            teamName: p.teamName,
            roleTitle: p.roleTitle,
          },
          create: {
            organisationId: campaignData.organisationId,
            email: p.email,
            fullName: p.fullName,
            teamName: p.teamName,
            roleTitle: p.roleTitle,
          },
        });

        // Link the specific Membership to this specific Campaign
        await tx.campaignParticipant.create({
          data: {
            campaignId: campaign.id,
            membershipId: membership.id,
            email: p.email,
            inviteTokenHash: Buffer.from(Math.random().toString()).toString('base64'), // Placeholder for real hash logic
            status: "invited",
          },
        });
      }

      return campaign;
    });

    // 4. Update the UI cache
    revalidatePath(`/dashboard/organisations/${campaignData.organisationId}`);
    
    return { success: true, campaignId: newCampaign.id };

  } catch (error) {
    console.error("Campaign Creation Failure:", error);
    return { error: "Failed to initialize campaign and participants." };
  }
}