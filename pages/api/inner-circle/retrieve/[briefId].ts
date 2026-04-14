/* ./pages/api/inner-circle/retrieve/[briefId].ts — STREAMING WATERMARKED ASSET */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import {
  DownloadContentType,
  DownloadDeliveryMode,
  DownloadEventType,
} from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { PdfService } from "@/lib/server/services/pdf-service";
import { AuditService } from "@/lib/server/services/audit-service";
import { BRIEF_REGISTRY } from "@/lib/briefs/registry";
import { prisma } from "@/lib/server/prisma";

type SessionUserLike = {
  id?: string;
  email?: string | null;
  role?: string;
};

function firstForwardedIp(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "0.0.0.0";
  if (!value) return "0.0.0.0";
  return value.split(",")[0]?.trim() || "0.0.0.0";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const startTime = Date.now();
  const briefId = String(req.query?.briefId || "").trim();

  const session = await getServerSession(req, res, authOptions);
  const user = session?.user as SessionUserLike | undefined;

  if (!session || !user || user.role !== "INNER_CIRCLE") {
    return res.status(403).json({ error: "Clearance Denied" });
  }

  if (!briefId) {
    return res.status(400).json({ error: "Invalid Asset ID" });
  }

  const asset = BRIEF_REGISTRY.find((b) => String(b.id) === briefId);
  if (!asset) {
    return res.status(404).json({ error: "Asset Not Found" });
  }

  const memberId = String(user.id || "").trim();
  const email = String(user.email || "").trim();

  if (!memberId || !email) {
    return res.status(403).json({ error: "Incomplete session identity" });
  }

  const ip =
    firstForwardedIp(req.headers["x-forwarded-for"]) ||
    req.socket.remoteAddress ||
    "0.0.0.0";

  const userAgent = String(req.headers["user-agent"] || "unknown");
  const requestId = String(req.headers["x-request-id"] || "").trim() || undefined;
  const sessionId =
    typeof req.cookies?.["aofl_sid"] === "string" ? req.cookies["aofl_sid"] : undefined;

  try {
    const storageUrl = String(process.env.STORAGE_URL || "").replace(/\/+$/, "");
    if (!storageUrl) {
      return res.status(500).json({ error: "Storage not configured" });
    }

    const content = await prisma.contentMetadata.findUnique({
      where: { slug: asset.id },
      select: {
        id: true,
        slug: true,
        title: true,
        contentType: true,
      },
    });

    const upstream = await fetch(
      `${storageUrl}/vault/${encodeURIComponent(briefId)}.pdf`,
    );

    if (!upstream.ok) {
      await AuditService.recordDownload({
        slug: asset.id,
        title: content?.title ?? asset.title ?? asset.id,
        contentType: DownloadContentType.PDF,
        eventType: DownloadEventType.DOWNLOAD,
        deliveryMode: DownloadDeliveryMode.DIRECT,

        contentId: content?.id,
        memberId,
        email,

        ip,
        userAgent,
        requestId,
        sessionId,

        success: false,
        statusCode: upstream.status,
        latencyMs: Date.now() - startTime,
        errorCode: "UPSTREAM_NOT_FOUND",
        errorDetail: `Upstream asset returned ${upstream.status}`,
        metadata: {
          route: "pages/api/inner-circle/retrieve/[briefId]",
          upstreamStatus: upstream.status,
        },
      });

      return res.status(404).json({ error: "Asset Source Not Found" });
    }

    const pdfBuffer = await upstream.arrayBuffer();
    const sourceBuffer = Buffer.from(pdfBuffer);

    const watermarkedPdf = await PdfService.injectWatermark(sourceBuffer, email);
    const deliveredBuffer = Buffer.from(watermarkedPdf);

    await AuditService.recordDownload({
      slug: asset.id,
      title: content?.title ?? asset.title ?? asset.id,
      contentType: DownloadContentType.PDF,
      eventType: DownloadEventType.DOWNLOAD,
      deliveryMode: DownloadDeliveryMode.DIRECT,

      contentId: content?.id,
      memberId,
      email,

      ip,
      userAgent,
      requestId,
      sessionId,

      success: true,
      statusCode: 200,
      latencyMs: Date.now() - startTime,

      fileName: `${asset.id}_SECURED.pdf`,
      fileSize: BigInt(deliveredBuffer.length),
      metadata: {
        route: "pages/api/inner-circle/retrieve/[briefId]",
        watermarkRecipient: email,
      },
    });

    if (content?.slug) {
      await AuditService.incrementAssetMetrics(content.slug);
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${asset.id}_SECURED.pdf"`,
    );
    res.setHeader("Cache-Control", "private, no-store, max-age=0");

    return res.send(deliveredBuffer);
  } catch (error) {
    console.error("Retrieval Error:", error);

    try {
      const content = await prisma.contentMetadata.findUnique({
        where: { slug: asset.id },
        select: { id: true, title: true },
      });

      await AuditService.recordDownload({
        slug: asset.id,
        title: content?.title ?? asset.title ?? asset.id,
        contentType: DownloadContentType.PDF,
        eventType: DownloadEventType.DOWNLOAD,
        deliveryMode: DownloadDeliveryMode.DIRECT,

        contentId: content?.id,
        memberId,
        email,

        ip,
        userAgent,
        requestId,
        sessionId,

        success: false,
        statusCode: 500,
        latencyMs: Date.now() - startTime,
        errorCode: "ASSET_TRANSMISSION_FAILED",
        errorDetail: error instanceof Error ? error.message : "Unknown retrieval error",
        metadata: {
          route: "pages/api/inner-circle/retrieve/[briefId]",
        },
      });
    } catch (auditError) {
      console.error("Audit Failure:", auditError);
    }

    return res.status(500).json({ error: "Asset Transmission Failed" });
  }
}