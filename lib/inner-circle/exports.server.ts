/* lib/inner-circle/exports.server.ts — PRODUCTION READY */
import { prisma } from "@/lib/prisma.server";
import * as Core from "./keys.server";
import { generatePDF } from "@/lib/pdf-generator";
import type { AccessTier } from "@prisma/client";
import { auditLogger } from "@/lib/server/db/audit";

// ✅ Resolved: Explicitly pulling required exports for the Admin Export API
export const {
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  getPrivacySafeStats,
  recordInnerCircleUnlock,
  cleanupExpiredData,
  normalizeTier,
  getKeysByMember, 
  getKeysByTier,
  isExpired
} = Core;

function parseAccessTier(input: unknown): AccessTier {
  const t = String(input || "").trim().toLowerCase();
  const validTiers: AccessTier[] = [
    "public", "member", "inner_circle", "restricted", 
    "client", "legacy", "architect", "owner", "top_secret"
  ];
  if (t === "inner-circle") return "inner_circle";
  return validTiers.includes(t as AccessTier) ? (t as AccessTier) : "public";
}

export async function generateBriefPDF(id: string, options?: any) {
  const startTime = Date.now();
  const actorId = options?.userId || null;
  const forceRebuild = Boolean(options?.force);

  try {
    const result = await generatePDF(id, forceRebuild);
    if (!result.success) throw new Error(result.error || "Institutional PDF Generation Failed");

    await auditLogger.log({
      action: "PDF_GENERATION",
      severity: "info",
      actorId: actorId,
      resourceId: id,
      resourceType: "BRIEF",
      status: "success",
      durationMs: Date.now() - startTime,
      metadata: { 
        cached: result.cached,
        path: result.path,
        requestedWatermark: Boolean(options?.includeWatermark)
      },
    });

    return result;
  } catch (error) {
    await auditLogger.log({
      action: "PDF_GENERATION_FAILED",
      severity: "critical",
      actorId: actorId,
      resourceId: id,
      resourceType: "BRIEF",
      status: "failure",
      errorMessage: String(error),
      durationMs: Date.now() - startTime,
      metadata: { errorStack: error instanceof Error ? error.stack : undefined },
    });
    throw error;
  }
}

export async function revokeKey(keyId: string, reason?: string): Promise<boolean> {
  const startTime = Date.now();
  try {
    const updated = await prisma.innerCircleKey.updateMany({
      where: { id: keyId },
      data: { status: "revoked", revokedAt: new Date(), revokedReason: reason || "admin_action" },
    });

    if (updated.count > 0) {
      await auditLogger.log({
        action: "KEY_REVOCATION",
        severity: "warning",
        resourceId: keyId,
        resourceType: "INNER_CIRCLE_KEY",
        status: "success",
        durationMs: Date.now() - startTime,
        metadata: { reason: reason || "admin_action" },
      });
    }
    return updated.count > 0;
  } catch (error) {
    await auditLogger.log({
      action: "KEY_REVOCATION_FAILED",
      severity: "high",
      resourceId: keyId,
      resourceType: "INNER_CIRCLE_KEY",
      status: "error",
      errorMessage: String(error),
      durationMs: Date.now() - startTime
    });
    return false;
  }
}