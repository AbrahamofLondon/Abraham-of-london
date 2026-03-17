// pages/api/premium/content/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getPremiumContentById,
  getPremiumContentList,
  getPremiumContentAsset,
  validateContentAccess,
} from "@/lib/premium/content-registry";
import {
  createDownloadToken,
  getTokenForensics,
} from "@/lib/premium/download-token";
import { buildFingerprintProfile } from "@/lib/premium/fingerprint-profile";
import { normalizeUserTier } from "@/lib/access/tier-policy";
import { logger } from "@/lib/logging";

type SuccessResponse = {
  success: true;
  data: unknown;
  download?: {
    url: string;
    expiresIn: string;
  } | null;
  identity?: {
    tier?: string | null;
    userId?: string | null;
    sessionId?: string | null;
  };
  viewer?: {
    tier?: string | null;
  };
  forensics?: {
    tokenId: string | null;
    watermarkId: string | null;
    expectedFooter: string | null;
    fingerprint: string | null;
  } | null;
};

type ErrorResponse = {
  success: false;
  error: string;
  code?: string;
};

type ApiResponse = SuccessResponse | ErrorResponse;

function safeStr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function firstQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return safeStr(value[0]);
  return safeStr(value);
}

function parseCookies(req: NextApiRequest): Record<string, string> {
  const raw = req.headers.cookie || "";
  const out: Record<string, string> = {};

  raw.split(";").forEach((part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return;

    try {
      out[key] = decodeURIComponent(rest.join("=") || "");
    } catch {
      out[key] = rest.join("=") || "";
    }
  });

  return out;
}

function getSessionIdentity(req: NextApiRequest): {
  userId: string | null;
  sessionId: string | null;
  tier: string;
} {
  const cookies = parseCookies(req);

  const userId =
    safeStr(cookies.aol_uid) ||
    safeStr(cookies.userId) ||
    safeStr(cookies.uid) ||
    null;

  const sessionId =
    safeStr(cookies.aol_session_id) ||
    safeStr(cookies.sessionId) ||
    safeStr(cookies.sid) ||
    null;

  const rawTier =
    safeStr(cookies.aol_tier) ||
    safeStr(cookies.aol_ic_tier) ||
    safeStr(cookies.inner_circle_tier) ||
    "public";

  return {
    userId,
    sessionId,
    tier: normalizeUserTier(rawTier),
  };
}

function isDevBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.PREMIUM_DEV_BYPASS === "true"
  );
}

function resolveRequiredTier(item: {
  metadata?: {
    classification?: string;
    allowedTiers?: string[];
  };
}): string {
  const allowedTiers = Array.isArray(item.metadata?.allowedTiers)
    ? item.metadata.allowedTiers.filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      )
    : [];

  if (allowedTiers.length > 0) {
    return normalizeUserTier(allowedTiers[0]);
  }

  const classification = safeStr(item.metadata?.classification);
  if (classification) {
    return normalizeUserTier(classification);
  }

  return "public";
}

function resolveClassification(item: {
  metadata?: {
    classification?: string;
  };
}): string | null {
  const classification = safeStr(item.metadata?.classification);
  return classification || null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    });
  }

  const { userId, sessionId, tier } = getSessionIdentity(req);
  const rawId = req.query.id;
  const id = firstQueryValue(rawId);

  if (typeof rawId === "undefined") {
    return res.status(200).json({
      success: true,
      data: getPremiumContentList(),
      viewer: { tier },
    });
  }

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "A valid premium content id is required",
      code: "INVALID_ID",
    });
  }

  const item = getPremiumContentById(id);

  if (!item) {
    return res.status(404).json({
      success: false,
      error: "Premium asset not found",
      code: "NOT_FOUND",
    });
  }

  if (!isDevBypassEnabled()) {
    const access = validateContentAccess(item, tier);

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        error: access.reason || "Access denied",
        code: "ACCESS_DENIED",
      });
    }
  }

  const asset = await getPremiumContentAsset(item.id);

  if (!asset || !asset.exists) {
    return res.status(404).json({
      success: false,
      error: "Protected asset not found in storage",
      code: "ASSET_NOT_FOUND",
    });
  }

  const requiredTier = resolveRequiredTier(item);
  const isPublicContent = requiredTier === "public";
  const classification = resolveClassification(item);

  const expiresInMs = 15 * 60 * 1000;
  const maxDownloads =
    typeof item.metadata?.maxDownloads === "number" &&
    item.metadata.maxDownloads > 0
      ? item.metadata.maxDownloads
      : isPublicContent
        ? 100
        : 1;

  const fingerprint = buildFingerprintProfile({
    contentId: item.id,
    title: item.title,
    filename: asset.filename,
    mimeType: asset.mimeType,
    tier,
    userId,
    sessionId,
    producer: "Abraham of London",
    creator: "Abraham of London",
    fileSize:
      typeof asset.sizeBytes === "number" ? asset.sizeBytes : undefined,
    classification,
  });

  let tokenRecord: Awaited<ReturnType<typeof createDownloadToken>> | null = null;
  let tokenError: string | null = null;

  const tokenPayload = {
    contentId: item.id,
    userId,
    sessionId,
    expiresIn: expiresInMs,
    maxDownloads,
    metadata: {
      tier,
      sessionId,
      reportId: item.id,
      filename: asset.filename,
      mimeType: asset.mimeType,
      fileSize:
        typeof asset.sizeBytes === "number" ? asset.sizeBytes : null,
      classification,
      productLine: item.metadata?.productLine || null,
      docId: item.metadata?.docId || null,
      subtitle: item.subtitle || null,
      featured: item.featured ?? false,
      tags: item.tags,
      relativePath: asset.relativePath,
      backend: asset.backend,
      sizeBytes:
        typeof asset.sizeBytes === "number" ? asset.sizeBytes : null,
      requiredTier,
      origin: "premium-content-api",
      publicAccess: isPublicContent,
    },
    fingerprint: fingerprint.profileId,
    pdfTitle: item.title,
    pdfCreator: "Abraham of London",
    pdfProducer: "Abraham of London",
  };

  if (isPublicContent) {
    try {
      tokenRecord = await createDownloadToken(tokenPayload);
    } catch (error) {
      tokenError = error instanceof Error ? error.message : String(error);

      logger.warn(
        "[PREMIUM_CONTENT] Public token creation failed; continuing without token",
        {
          contentId: item.id,
          requiredTier,
          userId,
          sessionId,
          error: tokenError,
        },
      );
    }
  } else {
    try {
      tokenRecord = await createDownloadToken(tokenPayload);
    } catch (error) {
      tokenError = error instanceof Error ? error.message : String(error);

      logger.error("[PREMIUM_CONTENT] Required token creation failed", {
        contentId: item.id,
        requiredTier,
        userId,
        sessionId,
        error: tokenError,
      });

      return res.status(500).json({
        success: false,
        error: "Failed to create secure download token",
        code: "TOKEN_CREATION_FAILED",
      });
    }
  }

  const forensics = tokenRecord ? getTokenForensics(tokenRecord.metadata) : null;

  return res.status(200).json({
    success: true,
    data: {
      ...item,
      asset: {
        filename: asset.filename,
        mimeType: asset.mimeType,
        exists: asset.exists,
        sizeBytes:
          typeof asset.sizeBytes === "number" ? asset.sizeBytes : null,
        backend: asset.backend,
        relativePath: asset.relativePath,
      },
    },
    download: tokenRecord
      ? {
          url: `/api/premium/content/download/${encodeURIComponent(
            item.id,
          )}?token=${encodeURIComponent(tokenRecord.token)}`,
          expiresIn: "15m",
        }
      : null,
    identity: {
      tier,
      userId,
      sessionId,
    },
    viewer: { tier },
    forensics: tokenRecord
      ? {
          tokenId: tokenRecord.tokenId,
          watermarkId: forensics?.watermarkId ?? null,
          expectedFooter: forensics?.expectedFooter ?? null,
          fingerprint: forensics?.fingerprint ?? null,
        }
      : {
          tokenId: null,
          watermarkId: fingerprint.watermarkId ?? null,
          expectedFooter: null,
          fingerprint: fingerprint.profileId,
        },
  });
}