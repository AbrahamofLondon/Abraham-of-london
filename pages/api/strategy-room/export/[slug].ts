/* pages/api/strategy-room/export/[slug].ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import {
  DownloadContentType,
  DownloadDeliveryMode,
  DownloadEventType,
} from "@prisma/client";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma.pages";
import {
  generateDossierSignature,
  getWatermarkPayload,
} from "@/lib/intelligence/watermark-delegate";

function firstCsvValue(value: string): string {
  const first = value.split(",")[0];
  return String(first || "").trim();
}

function getClientIp(req: NextApiRequest): string {
  const xff = req.headers["x-forwarded-for"];

  if (typeof xff === "string" && xff.trim()) {
    return firstCsvValue(xff) || "UNKNOWN";
  }

  if (Array.isArray(xff) && xff[0]) {
    return firstCsvValue(String(xff[0])) || "UNKNOWN";
  }

  return String(req.socket.remoteAddress || "UNKNOWN");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { slug } = req.query;

  const session = await getServerSession(req, res, authOptions);
  if (!session || !(session as any).aol?.innerCircleAccess) {
    return res
      .status(403)
      .json({ error: "Access Denied: Institutional Authorization Required." });
  }

  const slugStr = String(slug || "").trim();
  if (!slugStr) {
    return res.status(400).json({ error: "Missing slug." });
  }

  try {
    const brief = await prisma.contentMetadata.findUnique({
      where: { slug: slugStr },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        contentType: true,
        classification: true,
        totalPrints: true,
      },
    });

    if (!brief) {
      return res.status(404).json({ error: "Intelligence Brief not found." });
    }

    const memberId = String((session as any).aol?.memberId || "");
    const memberName = String((session as any).user?.name || "Principal");
    const memberEmail = String((session as any).user?.email || "");

    const sigObj = generateDossierSignature(
      memberId || "UNKNOWN_MEMBER",
      String(brief.id),
      {
        brand: process.env.AOL_BRAND_NAME || "Abraham of London",
      },
    );

    const classification =
      String(brief.classification || "public").toUpperCase() === "PRIVATE"
        ? "PRINCIPAL"
        : "MEMBER";

    const watermark = getWatermarkPayload({
      signature: sigObj,
      classification: classification as any,
      context: {
        briefTitle: String(brief.title || ""),
        route: `/strategy-room/export/${brief.slug}`,
      },
    });

    const ip = getClientIp(req);
    const ua = String(req.headers["user-agent"] || "UNKNOWN");

    const contentType =
      String(brief.contentType) === "Dossier"
        ? DownloadContentType.PDF
        : DownloadContentType.PDF;

    await prisma.$transaction([
      prisma.downloadAuditEvent.create({
        data: {
          slug: String(brief.slug),
          title: String(brief.title),
          contentType,
          eventType: DownloadEventType.DOWNLOAD,
          deliveryMode: DownloadDeliveryMode.DIRECT,

          contentId: String(brief.id),
          memberId: memberId || undefined,
          email: memberEmail || undefined,

          success: true,
          statusCode: 200,
          latencyMs: 0,
          processedAt: new Date(),

          ipAddress: ip,
          userAgent: ua,
          watermarkId: sigObj.traceId,
          fileHash: sigObj.sig,

          metadata: JSON.stringify({
            traceId: sigObj.traceId,
            issuedAt: sigObj.issuedAt,
            scheme: sigObj.scheme,
            issuer: sigObj.issuer,
            proof: sigObj.proof,
            watermark: watermark.visibleFooter,
            exportRoute: "pages/api/strategy-room/export/[slug]",
          }),
        },
      }),
      prisma.contentMetadata.update({
        where: { id: String(brief.id) },
        data: {
          totalPrints: { increment: 1 },
          downloadCount: { increment: 1 },
          lastDownloadedAt: new Date(),
        },
      }),
    ]);

    return res.status(200).json({
      ok: true,
      intel: {
        id: brief.id,
        slug: brief.slug,
        title: brief.title,
        content: brief.content ?? null,
        classification: brief.classification ?? null,
      },
      security: {
        sig: sigObj.sig,
        traceId: sigObj.traceId,
        issuedAt: sigObj.issuedAt,
        classification,
        authorizedTo: memberName,
        watermark,
      },
    });
  } catch (error) {
    console.error("[EXPORT_CRITICAL_FAILURE]:", error);
    return res.status(500).json({ error: "Internal assembly failure." });
  }
}