// lib/admin/campaigns/service.ts
// ─── CAMPAIGN SERVICE FOR CONSTITUTIONAL OPERATIONS ─────────────────────────────

import { prisma } from "@/lib/prisma";
import { coerceCanonicalSectionsEnvelope, type CanonicalSectionsEnvelope } from "@/lib/decision/canonical-sections";
import { type ConstitutionalDecision } from "@/lib/constitution/rules";

export type CampaignData = {
  id: string;
  title: string;
  organisationId: string;
  organisationName: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  participantCount: number;
  canonicalData: CanonicalSectionsEnvelope | null;
  constitutionalDecision: ConstitutionalDecision | null;
  metadata: Record<string, unknown>;
};

export type CampaignParticipant = {
  id: string;
  campaignId: string;
  userId: string;
  status: string;
  completedAt: Date | null;
  responses: Array<{
    id: string;
    domain: string;
    resonance: number;
    certainty: number;
  }>;
};

/**
 * Get complete campaign data for constitutional operations
 */
export async function getCampaignData(campaignId: string): Promise<CampaignData | null> {
  try {
    const campaign = await prisma.alignmentCampaign.findUnique({
      where: { id: campaignId },
      include: {
        organisation: true,
        participants: {
          where: { status: "completed" },
          select: { id: true, status: true, completedAt: true },
        },
      },
    });

    if (!campaign) return null;

    // Get the latest executive report for this campaign
    const report = await prisma.enterpriseReport.findFirst({
      where: { campaignId },
      orderBy: { generatedAt: "desc" },
    });

    // Parse canonical data from report if available
    let canonicalData: CanonicalSectionsEnvelope | null = null;
    if (report?.reportType === "canonical" && report.storagePath) {
      // In production, you would read from storage
      canonicalData = null;
    }

    // Try to get from campaign metadata if available
    const campaignMetadata = campaign.metadata as any;
    if (campaignMetadata?.canonicalData) {
      canonicalData = coerceCanonicalSectionsEnvelope(campaignMetadata.canonicalData);
    }

    return {
      id: campaign.id,
      title: campaign.title,
      organisationId: campaign.organisationId,
      organisationName: campaign.organisation?.name || "Unknown Organisation",
      status: campaign.status,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      participantCount: campaign.participants?.length || 0,
      canonicalData,
      constitutionalDecision: null, // Would need to parse from report if available
      metadata: {
        objective: campaign.objective,
        cadenceType: campaign.cadenceType,
        opensAt: campaign.opensAt,
        closesAt: campaign.closesAt,
      },
    };
  } catch (error) {
    console.error("[CampaignService] Failed to get campaign data:", error);
    return null;
  }
}

/**
 * Get campaign participants with their responses
 */
export async function getCampaignParticipants(campaignId: string): Promise<CampaignParticipant[]> {
  try {
    const participants = await prisma.campaignParticipant.findMany({
      where: { campaignId },
      include: {
        assessments: true,
      },
    });

    return participants.map((p) => ({
      id: p.id,
      campaignId: p.campaignId,
      userId: p.membershipId || p.email,
      status: p.status,
      completedAt: p.completedAt,
      responses: p.assessments.map((a) => ({
        id: a.id,
        domain: (a.domainScoresJson as any)?.domain || "unknown",
        resonance: (a.answersJson as any)?.resonance || 0,
        certainty: (a.answersJson as any)?.certainty || 0,
      })),
    }));
  } catch (error) {
    console.error("[CampaignService] Failed to get campaign participants:", error);
    return [];
  }
}

/**
 * Get participant count for threshold validation
 */
export async function getParticipantCount(campaignId: string): Promise<number> {
  try {
    const count = await prisma.campaignParticipant.count({
      where: {
        campaignId,
        status: "completed",
      },
    });
    return count;
  } catch (error) {
    console.error("[CampaignService] Failed to get participant count:", error);
    return 0;
  }
}

/**
 * Get campaign threshold setting
 */
export async function getCampaignThreshold(campaignId: string): Promise<number> {
  try {
    const campaign = await prisma.alignmentCampaign.findUnique({
      where: { id: campaignId },
      select: { metadata: true },
    });

    const metadata = campaign?.metadata as any;
    // Default threshold is 5
    const threshold = metadata?.anonymityThreshold || 5;
    return typeof threshold === "number" ? threshold : 5;
  } catch (error) {
    console.error("[CampaignService] Failed to get campaign threshold:", error);
    return 5;
  }
}

/**
 * Update campaign with constitutional decision
 */
export async function updateCampaignConstitutionalDecision(
  campaignId: string,
  constitutionalDecision: ConstitutionalDecision
): Promise<boolean> {
  try {
    // Store constitutional decision in campaign metadata
    const campaign = await prisma.alignmentCampaign.findUnique({
      where: { id: campaignId },
    });

    if (campaign) {
      const existingMetadata = campaign.metadata as any || {};
      
      await prisma.alignmentCampaign.update({
        where: { id: campaignId },
        data: {
          metadata: {
            ...existingMetadata,
            constitutionalDecision,
            lastConstitutionalUpdate: new Date().toISOString(),
          },
        },
      });
    }

    return true;
  } catch (error) {
    console.error("[CampaignService] Failed to update constitutional decision:", error);
    return false;
  }
}

/**
 * Get campaign for export with all required data
 */
export async function getCampaignForExport(campaignId: string): Promise<{
  campaign: CampaignData;
  participants: CampaignParticipant[];
  canonicalData: CanonicalSectionsEnvelope | null;
  constitutionalDecision: ConstitutionalDecision | null;
} | null> {
  try {
    const campaign = await getCampaignData(campaignId);
    if (!campaign) return null;

    const participants = await getCampaignParticipants(campaignId);

    return {
      campaign,
      participants,
      canonicalData: campaign.canonicalData,
      constitutionalDecision: campaign.constitutionalDecision,
    };
  } catch (error) {
    console.error("[CampaignService] Failed to get campaign for export:", error);
    return null;
  }
}