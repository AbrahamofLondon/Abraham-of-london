export const dynamic = "force-dynamic";
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const REQUIRED_KEY = process.env.SOVEREIGN_AUTH_KEY || "SOVEREIGN-ALIGN-2026";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type CreateCorrectionInput = {
  campaignId: string;
  domain: string;
  action: string;
  recoveryProjection: string;
  sovereignKey: string;
};

export type LiquidateProtocolInput = {
  nodeId: string;
  campaignId: string;
  sovereignKey?: string;
};

export type CorrectionNode = {
  id: string;
  domain: string;
  action: string;
  recoveryProjection: string | null;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getPrisma() {
  if (typeof (db as any)?.getPrismaClient === "function") {
    return await (db as any).getPrismaClient();
  }
  return db;
}

function validateSovereignKey(key: string): boolean {
  return key === REQUIRED_KEY;
}

// ============================================================================
// MANDATE PROTOCOL — Create a new correction node
// ============================================================================

/**
 * MANDATE_PROTOCOL
 * Creates a new correction node in the registry, marking an area requiring intervention.
 * Requires sovereign key for authorization.
 */
export async function mandateProtocol(data: CreateCorrectionInput) {
  try {
    // 1. Validate Sovereign Key
    if (!validateSovereignKey(data.sovereignKey)) {
      return { 
        success: false, 
        error: "INVALID_SOVEREIGN_KEY: Authorization Denied." 
      };
    }

    const prisma = await getPrisma();

    // 2. Validate required fields
    if (!data.campaignId || !data.domain || !data.action) {
      return {
        success: false,
        error: "MISSING_REQUIRED_FIELDS: campaignId, domain, and action are required."
      };
    }

    // 3. Write to Registry
    const node = await prisma.correctionNode.create({
      data: {
        campaignId: data.campaignId,
        domain: data.domain,
        action: data.action,
        recoveryProjection: data.recoveryProjection || null,
        status: "MANDATED",
      },
    });

    // 4. Revalidate the executive report page
    revalidatePath(`/admin/reporting/executive/${data.campaignId}`);
    
    return { 
      success: true, 
      nodeId: node.id,
      node: {
        id: node.id,
        domain: node.domain,
        action: node.action,
        status: node.status,
        createdAt: node.createdAt,
      }
    };
  } catch (error) {
    console.error("[GOVERNANCE_MANDATE_FAILURE]:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "SYSTEM_ERROR: Registry write failed." 
    };
  }
}

// ============================================================================
// LIQUIDATE PROTOCOL — Mark a correction as completed
// ============================================================================

/**
 * LIQUIDATE_PROTOCOL
 * Marks a correction node as LIQUIDATED (completed), effectively "healing" that segment of the registry.
 * Updates status and records completion timestamp.
 */
export async function liquidateProtocol(nodeId: string, campaignId: string, sovereignKey?: string) {
  try {
    const prisma = await getPrisma();

    // 1. Verify node exists
    const existingNode = await prisma.correctionNode.findUnique({
      where: { id: nodeId },
    });

    if (!existingNode) {
      return { 
        success: false, 
        error: "NODE_NOT_FOUND: Correction node does not exist." 
      };
    }

    // 2. Optional: Validate sovereign key if provided
    if (sovereignKey && !validateSovereignKey(sovereignKey)) {
      return { 
        success: false, 
        error: "INVALID_SOVEREIGN_KEY: Authorization Denied." 
      };
    }

    // 3. Update node status
    const updatedNode = await prisma.correctionNode.update({
      where: { id: nodeId },
      data: { 
        status: "LIQUIDATED",
        completedAt: new Date(),
      },
    });

    // 4. Revalidate the executive report to reflect the updated status
    revalidatePath(`/admin/reporting/executive/${campaignId}`);
    
    return { 
      success: true, 
      node: {
        id: updatedNode.id,
        domain: updatedNode.domain,
        action: updatedNode.action,
        status: updatedNode.status,
        completedAt: updatedNode.completedAt,
      }
    };
  } catch (error) {
    console.error("[GOVERNANCE_LIQUIDATION_FAILURE]:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update node status." 
    };
  }
}

// ============================================================================
// GET CORRECTION NODES — Fetch all nodes for a campaign
// ============================================================================

/**
 * GET_CORRECTION_NODES
 * Retrieves all correction nodes for a given campaign.
 */
export async function getCorrectionNodes(campaignId: string) {
  try {
    const prisma = await getPrisma();

    const nodes = await prisma.correctionNode.findMany({
      where: { campaignId },
      orderBy: { createdAt: "desc" },
    });

    // Fixed: Added explicit type for node parameter
    return {
      success: true,
      nodes: nodes.map((node: CorrectionNode) => ({
        id: node.id,
        domain: node.domain,
        action: node.action,
        recoveryProjection: node.recoveryProjection,
        status: node.status,
        createdAt: node.createdAt,
        completedAt: node.completedAt,
      }))
    };
  } catch (error) {
    console.error("[GOVERNANCE_GET_NODES_FAILURE]:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to retrieve correction nodes.",
      nodes: []
    };
  }
}

// ============================================================================
// BATCH LIQUIDATE — Close multiple corrections at once
// ============================================================================

/**
 * BATCH_LIQUIDATE
 * Marks multiple correction nodes as LIQUIDATED in a single transaction.
 * Useful for closing a campaign or bulk interventions.
 */
export async function batchLiquidate(nodes: Array<{ nodeId: string; campaignId: string }>, sovereignKey?: string) {
  try {
    const prisma = await getPrisma();

    // Optional auth check
    if (sovereignKey && !validateSovereignKey(sovereignKey)) {
      return { 
        success: false, 
        error: "INVALID_SOVEREIGN_KEY: Authorization Denied." 
      };
    }

    const results = await prisma.$transaction(
      nodes.map(({ nodeId, campaignId }) =>
        prisma.correctionNode.update({
          where: { id: nodeId },
          data: { 
            status: "LIQUIDATED",
            completedAt: new Date(),
          },
        })
      )
    );

    // Revalidate all affected campaigns
    const uniqueCampaignIds = [...new Set(nodes.map((n: { campaignId: string }) => n.campaignId))];
    uniqueCampaignIds.forEach((campaignId: string) => {
      revalidatePath(`/admin/reporting/executive/${campaignId}`);
    });

    // Fixed: Added explicit type for node parameter
    return {
      success: true,
      liquidated: results.length,
      nodes: results.map((node: CorrectionNode) => ({
        id: node.id,
        domain: node.domain,
        status: node.status,
        completedAt: node.completedAt,
      }))
    };
  } catch (error) {
    console.error("[GOVERNANCE_BATCH_LIQUIDATION_FAILURE]:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Batch liquidation failed." 
    };
  }
}