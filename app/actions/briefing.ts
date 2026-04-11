'use server';
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { 
  generateIntelligenceBrief, 
  analyzeContagionRisk, 
  checkProtocolExpiry 
} from "@/lib/alignment/governance-logic";
import { revalidatePath } from "next/cache";

// Type definitions
interface CorrectionNode {
  id: string;
  status: string;
  recoveryProjection: string | null;
  [key: string]: any;
}

interface CampaignParticipant {
  id: string;
  status: string;
  responses?: any[];
  [key: string]: any;
}

interface CampaignData {
  id: string;
  organisation: { name: string } | null;
  correctionNodes: CorrectionNode[];
  participants: CampaignParticipant[];
  [key: string]: any;
}

/**
 * GENERATE_EXECUTIVE_BRIEF
 * Compiles registry data into a board-ready intelligence brief.
 */
export async function generateExecutiveBrief(campaignId: string) {
  try {
    // Ensure database client is ready
    const prisma = typeof (db as any)?.getPrismaClient === "function" 
      ? await (db as any).getPrismaClient() 
      : db;

    if (!prisma) throw new Error("Database connection unavailable");

    // 1. Fetch campaign and associated governance nodes
    const campaign = await prisma.alignmentCampaign.findUnique({
      where: { id: campaignId },
      include: {
        organisation: true,
        correctionNodes: {
          orderBy: { createdAt: 'desc' }
        },
        participants: {
          where: { status: "completed" },
          include: { responses: true }
        }
      }
    }) as CampaignData | null;

    if (!campaign) throw new Error("Campaign identification failed.");

    // 2. Recovery Calculation Logic
    const parseRecovery = (val: string | null): number => {
      if (!val) return 0;
      const match = val.match(/\d+/);
      return match ? parseFloat(match[0]) : 0;
    };

    // Fixed: Added explicit type for node parameter
    const liquidatedNodes = campaign.correctionNodes.filter((node: CorrectionNode) => node.status === "LIQUIDATED");
    const totalRecovery = liquidatedNodes.reduce((acc: number, node: CorrectionNode) => 
      acc + parseRecovery(node.recoveryProjection), 0
    );

    // 3. Telemetry Baseline (Simulated analysis of participant data)
    // In a full implementation, these would be derived from campaign.participants[].responses
    const rawMetrics = [
      { label: "STRATEGIC_INTENT", intent: 95, reality: 72 },
      { label: "OPERATIONAL_CLARITY", intent: 88, reality: 45 },
      { label: "LEADERSHIP_TRUST", intent: 92, reality: 58 },
      { label: "CULTURAL_COHESION", intent: 85, reality: 79 },
    ];

    const rawDissonance = rawMetrics.reduce((acc, m) => acc + (m.intent - m.reality), 0) / rawMetrics.length;
    const adjustedDissonance = Math.max(0, rawDissonance - totalRecovery);
    const integrityIndex = Math.min(100, 100 - Math.round(adjustedDissonance));
    const isStable = adjustedDissonance <= 30;

    // 4. Governance Status Checks
    const expiryStatus = await checkProtocolExpiry(campaignId);
    const contagionRisks = analyzeContagionRisk(rawMetrics);
    const brief = await generateIntelligenceBrief(campaignId, rawMetrics);

    // 5. Protocol Distribution - Fixed: Added explicit type
    const activeProtocols = campaign.correctionNodes.filter((node: CorrectionNode) => 
      node.status === "MANDATED" || node.status === "IN_PROGRESS"
    );
    
    const recoveryProgress = rawDissonance > 0 
      ? Math.min(100, Math.round((totalRecovery / rawDissonance) * 100))
      : 100;

    // 6. Structured Output for Intelligence Briefing Component
    return {
      success: true,
      data: {
        ...brief,
        organisation: campaign.organisation?.name || "Sovereign Entity",
        timestamp: new Date().toISOString(),
        nodeRef: `SAR-${campaignId.slice(0, 8).toUpperCase()}`,
        
        metrics: {
          integrityIndex,
          recoveryProgress,
          isStable,
        },
        
        protocols: {
          active: activeProtocols.length,
          liquidated: liquidatedNodes.length,
          total: campaign.correctionNodes.length,
          expiryWarning: expiryStatus.isExpired ? "CRITICAL" : 
                         expiryStatus.daysRemaining <= 7 ? "WARNING" : "STABLE",
          daysRemaining: Math.floor(expiryStatus.daysRemaining),
        },
        
        executiveSummary: {
          headline: isStable 
            ? `Institutional resonance stabilized at ${integrityIndex}% integrity`
            : `${integrityIndex}% integrity — Intervention required for ${Math.round(adjustedDissonance)}% friction delta`,
          primaryAction: isStable 
            ? "Maintain current cadence with quarterly recalibration"
            : `Immediate liquidation of ${activeProtocols.length} active protocols recommended`,
          recoveryConfidence: recoveryProgress > 70 ? "HIGH" : recoveryProgress > 40 ? "MEDIUM" : "LOW",
        }
      }
    };

  } catch (error) {
    console.error("[BRIEFING_GENERATION_FAILURE]:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to compile intelligence brief." 
    };
  }
}

/**
 * GET_BRIEFING_PDF_DATA
 * Specialized endpoint for generating document-ready structures.
 */
export async function getBriefingPDF(campaignId: string) {
  const result = await generateExecutiveBrief(campaignId);
  
  if (!result.success) return { success: false, error: result.error };

  return {
    success: true,
    brief: {
      ...result.data,
      confidentiality: "CLIENT CONFIDENTIAL // EYES ONLY",
      distribution: "Sovereign Board of Directors",
    }
  };
}