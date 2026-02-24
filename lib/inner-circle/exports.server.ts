/* lib/inner-circle/exports.server.ts */
import "server-only";
import { prisma } from "@/lib/prisma"; // Ensure this matches your prisma instance path
import * as Core from "./keys.server";
import { generatePDF } from "@/lib/pdf-generator";

// Bridge existing core functions
export const {
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  getPrivacySafeStats,
  recordInnerCircleUnlock,
  cleanupExpiredData,
  normalizeTier
} = Core;

/**
 * ✅ RESTORED: Administrative Data Exports
 * Required by /pages/api/admin/inner-circle/export.ts
 */

export async function getActiveKeys() {
  return await prisma.accessKey.findMany({
    where: { 
      active: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    include: { user: true }
  });
}

export async function getKeysByTier(tier: string) {
  return await prisma.accessKey.findMany({
    where: { tier: tier.toUpperCase() },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getKeysByMember(userId: string) {
  return await prisma.accessKey.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * ✅ RESTORED: Expiry Utility
 */
export function isExpired(expiresAt: Date | string | null): boolean {
  if (!expiresAt) return false;
  return new Date() > new Date(expiresAt);
}

/**
 * ON-DEMAND GENERATION CALL
 * Orchestrates the synthesis of PDF assets from the Vault.
 */
export async function generateBriefPDF(id: string) {
  return await generatePDF(id);
}

export type { KeyTier, StoredKey } from "./keys.client";