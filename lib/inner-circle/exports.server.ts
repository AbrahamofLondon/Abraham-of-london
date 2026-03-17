/* lib/inner-circle/exports.server.ts */
import "server-only";

import { prisma } from "@/lib/prisma.server";
import * as Core from "./keys.server";
import { generatePDF } from "@/lib/pdf-generator";
import type { AccessTier } from "@prisma/client";
import { logger } from "@/lib/logging";
import { getWatermarkFooterText } from "@/lib/premium/watermark";

export const {
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  getPrivacySafeStats,
  recordInnerCircleUnlock,
  cleanupExpiredData,
  normalizeTier,
} = Core;

function parseAccessTier(input: unknown): AccessTier {
  const t = String(input || "").trim().toLowerCase();

  if (!t) return "public";
  if (t === "free") return "public";
  if (t === "inner-circle") return "inner_circle";

  switch (t) {
    case "public":
    case "member":
    case "inner_circle":
    case "client":
    case "legacy":
    case "architect":
    case "owner":
      return t as AccessTier;
    default:
      logger.warn("[TIER_PARSE] Unknown tier, defaulting to public", {
        input: t,
      });
      return "public";
  }
}

export async function getActiveKeys(options?: {
  limit?: number;
  offset?: number;
}) {
  const { limit = 1000, offset = 0 } = options || {};

  try {
    return await prisma.innerCircleKey.findMany({
      where: {
        status: "active",
        expiresAt: { gt: new Date() },
      },
      include: {
        member: {
          select: {
            id: true,
            email: true,
            tier: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  } catch (error) {
    logger.error("[ACTIVE_KEYS] Failed to fetch", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function getKeysByTier(
  tier: string,
  options?: {
    limit?: number;
    offset?: number;
  },
) {
  const { limit = 1000, offset = 0 } = options || {};
  const parsedTier = parseAccessTier(tier);

  try {
    return await prisma.innerCircleKey.findMany({
      where: {
        member: { tier: parsedTier },
      },
      include: {
        member: {
          select: {
            id: true,
            email: true,
            tier: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  } catch (error) {
    logger.error("[KEYS_BY_TIER] Failed to fetch", {
      tier,
      parsedTier,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function getKeysByMember(
  memberId: string,
  options?: {
    limit?: number;
    offset?: number;
  },
) {
  const { limit = 100, offset = 0 } = options || {};

  try {
    return await prisma.innerCircleKey.findMany({
      where: { memberId },
      include: {
        member: {
          select: {
            id: true,
            email: true,
            tier: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  } catch (error) {
    logger.error("[KEYS_BY_MEMBER] Failed to fetch", {
      memberId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export function isExpired(
  expiresAt: Date | string | null | undefined,
): boolean {
  if (!expiresAt) return false;

  try {
    const expiryDate =
      expiresAt instanceof Date ? expiresAt : new Date(expiresAt);

    return Number.isNaN(expiryDate.getTime())
      ? false
      : new Date() > expiryDate;
  } catch {
    return false;
  }
}

export type GenerateBriefPDFOptions = {
  userId?: string;
  sessionId?: string;
  tokenId?: string;
  includeWatermark?: boolean;

  watermarkId?: string;
  expectedFooter?: string;
  classification?: string;
  issuedTo?: string;
  issuedAt?: Date | string;

  fingerprint?: {
    profileId?: string;
    watermarkId?: string;
    traceId?: string;
    stableHash?: string;
    contextualHash?: string;
    fileBand?: string;
    [key: string]: unknown;
  };
};

function coerceDateString(value: Date | string | undefined): string | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function generateBriefPDF(
  id: string,
  options?: GenerateBriefPDFOptions,
) {
  const startTime = Date.now();

  try {
    const includeWatermark = Boolean(options?.includeWatermark);
    const userId = options?.userId;
    const sessionId = options?.sessionId;
    const tokenId = options?.tokenId;
    const classification = options?.classification;
    const issuedTo = options?.issuedTo ?? userId;
    const issuedAt = coerceDateString(options?.issuedAt);
    const explicitFooter = options?.expectedFooter;
    const explicitWatermarkId = options?.watermarkId;
    const fingerprint = options?.fingerprint;

    logger.info("[PDF_GEN] Starting generation", {
      id,
      includeWatermark,
      userId,
      sessionId,
      tokenId,
      classification,
      issuedTo,
      issuedAt,
      profileId: fingerprint?.profileId ?? null,
      watermarkId: explicitWatermarkId ?? fingerprint?.watermarkId ?? null,
      traceId: fingerprint?.traceId ?? null,
    });

    const computedWatermarkFooter = includeWatermark
      ? getWatermarkFooterText({
          contentId: id,
          tokenId,
          userId,
          sessionId,
          briefTitle: `Brief-${id}`,
        })
      : undefined;

    const effectiveFooter = explicitFooter ?? computedWatermarkFooter;

    if (effectiveFooter) {
      logger.info("[PDF_GEN] Footer/watermark prepared", {
        id,
        footerPreview: effectiveFooter.slice(0, 160),
      });
    }

    /**
     * Current lower-level PDF engine is still narrow:
     * generatePDF(id, includeWatermark)
     *
     * This wrapper accepts and logs the richer forensic payload now,
     * and can pass it through later when the core engine is upgraded.
     */
    const result = await generatePDF(id, includeWatermark);

    const duration = Date.now() - startTime;

    logger.info("[PDF_GEN] Completed generation", {
      id,
      durationMs: duration,
      success: Boolean((result as { success?: unknown })?.success),
      path: (result as { path?: unknown })?.path ?? null,
      profileId: fingerprint?.profileId ?? null,
      watermarkId: explicitWatermarkId ?? fingerprint?.watermarkId ?? null,
      traceId: fingerprint?.traceId ?? null,
    });

    return result;
  } catch (error) {
    logger.error("[PDF_GEN] Failed generation", {
      id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function revokeKey(
  key: string,
  reason?: string,
): Promise<boolean> {
  if (!key || typeof key !== "string") {
    logger.warn("[REVOKE] Invalid key provided");
    return false;
  }

  try {
    const updated = await prisma.innerCircleKey.updateMany({
      where: { key },
      data: {
        status: "revoked",
        metadata: {
          ...(await getExistingMetadata(key)),
          revokedAt: new Date().toISOString(),
          revokeReason: reason || "admin_action",
        },
      },
    });

    if (updated.count > 0) {
      logger.info("[REVOKE] Successfully revoked key", {
        keyPreview: `${key.substring(0, 8)}...`,
      });
    }

    return updated.count > 0;
  } catch (error) {
    logger.error("[REVOKE] Failed to revoke key", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

async function getExistingMetadata(key: string) {
  try {
    const existing = await prisma.innerCircleKey.findUnique({
      where: { key },
      select: { metadata: true },
    });

    return (existing?.metadata as Record<string, unknown>) || {};
  } catch {
    return {};
  }
}

export async function getKeyStats() {
  try {
    const [total, active, expired, revoked] = await Promise.all([
      prisma.innerCircleKey.count(),
      prisma.innerCircleKey.count({ where: { status: "active" } }),
      prisma.innerCircleKey.count({
        where: {
          status: "active",
          expiresAt: { lt: new Date() },
        },
      }),
      prisma.innerCircleKey.count({ where: { status: "revoked" } }),
    ]);

    return {
      total,
      active,
      expired,
      revoked,
      healthy: active - expired,
    };
  } catch (error) {
    logger.error("[KEY_STATS] Failed to fetch", {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      total: 0,
      active: 0,
      expired: 0,
      revoked: 0,
      healthy: 0,
    };
  }
}

export type { KeyTier, StoredKey } from "./keys.client";