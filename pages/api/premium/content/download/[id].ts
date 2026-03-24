import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import { pipeline } from "stream/promises";

import {
  verifyDownloadToken,
  incrementTokenUsage,
  doesTokenMatchBinding,
} from "@/lib/premium/download-token";

import { withApiRateLimit } from "@/lib/server/rate-limit-unified";

import {
  getClientIp,
  getUserAgent,
  getReferrer,
} from "@/lib/server/request-fingerprint";
import { getCurrentAccessBinding } from "@/lib/server/current-access-binding";
import { recordPremiumDownloadAttempt } from "@/lib/premium/download-audit";
import {
  watermarkPdfBuffer,
  createWatermarkPayload,
} from "@/lib/premium/watermark";
import { buildFingerprintProfile } from "@/lib/premium/fingerprint-profile";
import {
  getPremiumContentById,
  getPremiumContentAsset,
} from "@/lib/premium/content-registry";
import {
  readPremiumAssetBuffer,
  computeBufferSha256,
  createLocalReadStream,
} from "@/lib/premium/private-asset-store";
import {
  createTempPdfPath,
  writeTempFile,
  deleteTempFile,
} from "@/lib/premium/temp-files";
import { prisma } from "@/lib/prisma";

type Classification =
  | "PUBLIC"
  | "MEMBER"
  | "INNER_CIRCLE"
  | "ARCHITECT"
  | "OWNER"
  | "PRINCIPAL";

type ErrorResponse = {
  error: string;
};

function safeStr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getQueryString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return safeStr(value[0]);
  return safeStr(value);
}

function toClassification(tier?: string | null): Classification {
  const t = safeStr(tier).toUpperCase();

  if (t === "OWNER") return "OWNER";
  if (t === "ARCHITECT") return "ARCHITECT";
  if (t === "INNER-CIRCLE" || t === "INNER_CIRCLE") return "INNER_CIRCLE";
  if (t === "MEMBER") return "MEMBER";
  if (t === "PUBLIC") return "PUBLIC";

  return "PRINCIPAL";
}

function safeAttachmentFilename(filename: string): string {
  const clean = safeStr(filename).replace(/["\r\n]/g, "_");
  return clean || "download.bin";
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponse | Buffer>,
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).end();
    return;
  }

  const id = getQueryString(req.query.id);
  const token = getQueryString(req.query.token);

  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);
  const referrer = getReferrer(req);

  if (!id || !token) {
    await recordPremiumDownloadAttempt({
      contentId: id || "unknown",
      ipAddress,
      userAgent,
      referrer,
      method: req.method,
      success: false,
      statusCode: 400,
      reason: "Institutional parameters missing",
    });

    res.status(400).json({ error: "Institutional parameters missing" });
    return;
  }

  const report = getPremiumContentById(id);
  const asset = await getPremiumContentAsset(id);

  if (!report || !asset || !asset.exists) {
    await recordPremiumDownloadAttempt({
      contentId: id,
      ipAddress,
      userAgent,
      referrer,
      method: req.method,
      success: false,
      statusCode: 404,
      reason: "Protected asset not found",
    });

    res.status(404).json({ error: "Protected asset not found" });
    return;
  }

  const verified = await verifyDownloadToken(token, id);

  if (!verified.valid || !verified.token || !verified.payload) {
    await recordPremiumDownloadAttempt({
      tokenId: verified.payload?.tid ?? null,
      contentId: id,
      userId: verified.payload?.uid ?? null,
      sessionId: verified.payload?.sid ?? null,
      ipAddress,
      userAgent,
      referrer,
      method: req.method,
      success: false,
      statusCode: 401,
      reason: verified.reason || "Access token invalid or expired",
    });

    res.status(401).json({
      error: verified.reason || "Access token invalid or expired",
    });
    return;
  }

  const binding = await getCurrentAccessBinding(req, res);

  if (
    !doesTokenMatchBinding(verified.payload, {
      sessionId: binding.sessionId,
      userId: binding.userId,
    })
  ) {
    await recordPremiumDownloadAttempt({
      tokenId: verified.payload.tid,
      contentId: id,
      userId: binding.userId,
      sessionId: binding.sessionId,
      ipAddress,
      userAgent,
      referrer,
      method: req.method,
      success: false,
      statusCode: 403,
      reason: "Session binding mismatch",
    });

    res.status(403).json({ error: "Session binding mismatch" });
    return;
  }

  const usageIncremented = await incrementTokenUsage(token);

  if (!usageIncremented) {
    await recordPremiumDownloadAttempt({
      tokenId: verified.payload.tid,
      contentId: id,
      userId: verified.payload.uid ?? null,
      sessionId: verified.payload.sid ?? null,
      ipAddress,
      userAgent,
      referrer,
      method: req.method,
      success: false,
      statusCode: 401,
      reason: "Download allowance exhausted",
    });

    res.status(401).json({ error: "Download allowance exhausted" });
    return;
  }

  const userTier =
    typeof verified.payload.md?.tier === "string"
      ? verified.payload.md.tier
      : null;

  const requiredTier =
    typeof report.metadata?.classification === "string"
      ? report.metadata.classification
      : null;

  try {
    const filename = safeAttachmentFilename(asset.filename);
    const isPdf = asset.mimeType === "application/pdf";
    const largeThresholdBytes = 12 * 1024 * 1024;

    if (!isPdf) {
      res.setHeader("Content-Type", asset.mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private",
      );
      res.setHeader("X-Content-Type-Options", "nosniff");

      if (typeof asset.sizeBytes === "number") {
        res.setHeader("Content-Length", String(asset.sizeBytes));
      }

      await recordPremiumDownloadAttempt({
        tokenId: verified.payload.tid,
        contentId: id,
        userId: verified.payload.uid ?? null,
        sessionId: verified.payload.sid ?? null,
        ipAddress,
        userAgent,
        referrer,
        method: req.method,
        success: true,
        statusCode: 200,
        reason: "Non-PDF download granted",
        fileSize: typeof asset.sizeBytes === "number" ? asset.sizeBytes : null,
        userTier,
        requiredTier,
      });

      const stream = createLocalReadStream(asset.relativePath);
      await pipeline(stream, res);
      return;
    }

    const originalBuffer = await readPremiumAssetBuffer(asset.relativePath);
    const sourceChecksum = await computeBufferSha256(originalBuffer);

    const effectiveUserId =
      safeStr(verified.payload.uid) ||
      safeStr(verified.payload.sid) ||
      "ANON";

    const effectiveTier =
      safeStr(userTier) ||
      safeStr(report.metadata?.classification) ||
      "PRINCIPAL";

    const fingerprint = buildFingerprintProfile({
      contentId: id,
      tokenId: verified.payload.tid,
      userId: verified.payload.uid ?? null,
      sessionId: verified.payload.sid ?? null,
      classification: toClassification(effectiveTier),
      producer: "Abraham of London",
      creator: "Abraham of London",
      title: report.title,
      filename: asset.filename,
      mimeType: asset.mimeType,
      fileSize:
        typeof asset.sizeBytes === "number" ? asset.sizeBytes : undefined,
    });

    const watermarkPayload = createWatermarkPayload({
      contentId: id,
      tokenId: verified.payload.tid,
      userId: effectiveUserId,
      sessionId: verified.payload.sid ?? null,
      tier: effectiveTier,
      briefTitle: report.title,
      fingerprint,
    });

    const markedBuffer = await watermarkPdfBuffer(originalBuffer, {
      contentId: id,
      tokenId: verified.payload.tid,
      userId: effectiveUserId,
      sessionId: verified.payload.sid ?? null,
      tier: effectiveTier,
      briefTitle: report.title,
      footerText: watermarkPayload.footerText,
      watermarkId: watermarkPayload.watermarkId,
      fingerprint,
    });

    const deliveredChecksum = await computeBufferSha256(markedBuffer);

    const existingMetadata =
      verified.token.metadata && typeof verified.token.metadata === "object"
        ? verified.token.metadata
        : {};

    await prisma.premiumDownloadToken.updateMany({
      where: { tokenId: verified.payload.tid },
      data: {
        metadata: {
          ...existingMetadata,
          watermarkId: watermarkPayload.watermarkId,
          publicMarker: watermarkPayload.publicMarker,
          compactMarker: watermarkPayload.compactMarker,
          visibleFooter: watermarkPayload.footerText,
          forensicHash: watermarkPayload.forensicHash,
          sourceChecksum,
          deliveredChecksum,
          deliveredAt: new Date().toISOString(),
          fingerprint: fingerprint.profileId,
          traceId: fingerprint.traceId,
        },
      },
    });

    res.setHeader("Content-Type", asset.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-AOL-Source-Sha256", sourceChecksum);
    res.setHeader("X-AOL-Delivered-Sha256", deliveredChecksum);
    res.setHeader("X-AOL-Watermark-Id", watermarkPayload.watermarkId);

    await recordPremiumDownloadAttempt({
      tokenId: verified.payload.tid,
      contentId: id,
      userId: verified.payload.uid ?? null,
      sessionId: verified.payload.sid ?? null,
      ipAddress,
      userAgent,
      referrer,
      method: req.method,
      success: true,
      statusCode: 200,
      reason: "PDF download granted",
      watermarkId: watermarkPayload.watermarkId,
      sourceChecksum,
      deliveredChecksum,
      fileSize: markedBuffer.length,
      pageCount: report.asset.pageCount ?? null,
      userTier,
      requiredTier,
    });

    if (markedBuffer.length >= largeThresholdBytes) {
      const tempPath = createTempPdfPath("aol-watermarked");
      await writeTempFile(tempPath, markedBuffer);

      try {
        const stat = await fs.promises.stat(tempPath);
        res.setHeader("Content-Length", String(stat.size));
        const stream = fs.createReadStream(tempPath);
        await pipeline(stream, res);
        return;
      } finally {
        await deleteTempFile(tempPath);
      }
    }

    res.setHeader("Content-Length", String(markedBuffer.length));
    res.status(200).send(markedBuffer);
    return;
  } catch (error) {
    console.error("[DOWNLOAD_STREAM_ERROR]", error);

    await recordPremiumDownloadAttempt({
      tokenId: verified.payload.tid,
      contentId: id,
      userId: verified.payload.uid ?? null,
      sessionId: verified.payload.sid ?? null,
      ipAddress,
      userAgent,
      referrer,
      method: req.method,
      success: false,
      statusCode: 500,
      reason: "Failed to stream asset",
      userTier,
      requiredTier,
    });

    res.status(500).json({ error: "Failed to stream asset" });
  }
}

export default withApiRateLimit(handler, { key: "DOWNLOAD" });