/* lib/intelligence/repository.ts — Intelligence Repository (Schema-Aligned) */
import "server-only";

import { prisma } from "@/lib/prisma.server";
import {
  ContentType,
  DownloadContentType,
  DownloadDeliveryMode,
  DownloadEventType,
} from "@prisma/client";

export type LatestIntelligenceItem = {
  id: string;
  slug: string;
  title: string;
  contentType: ContentType;
  createdAt: Date;
  metadata: unknown;
};

export async function getLatestIntelligence(
  limit = 3,
  opts?: { includeDossiers?: boolean },
): Promise<LatestIntelligenceItem[]> {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(50, limit)) : 3;
  const includeDossiers = Boolean(opts?.includeDossiers);

  const contentTypes: ContentType[] = includeDossiers
    ? [ContentType.Briefs, ContentType.Dossier]
    : [ContentType.Briefs];

  try {
    const results = await prisma.contentMetadata.findMany({
      where: {
        contentType: { in: contentTypes },
      },
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        contentType: true,
        createdAt: true,
        metadata: true,
      },
    });

    return results as LatestIntelligenceItem[];
  } catch (error) {
    console.error("[REPOSITORY ERROR]: Failed to fetch intelligence assets:", error);
    return [];
  }
}

export type IntelligenceAccessLogInput = {
  slug: string;
  memberId: string;
  email: string;
  ip: string;
  userAgent: string;
};

export async function logIntelligenceAccess(data: IntelligenceAccessLogInput) {
  const slug = String(data.slug || "").trim();
  const memberId = String(data.memberId || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  const ipAddress = String(data.ip || "").trim();
  const userAgent = String(data.userAgent || "").trim();

  if (!slug || !memberId || !email) {
    throw new Error("logIntelligenceAccess: slug, memberId, and email are required.");
  }

  const content = await prisma.contentMetadata.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, contentType: true },
  });

  return await prisma.downloadAuditEvent.create({
    data: {
      slug,
      title: content?.title ?? undefined,
      contentType:
        content?.contentType === ContentType.Dossier
          ? DownloadContentType.PDF
          : DownloadContentType.PDF,
      // PROVISIONAL MAPPING: schema DownloadEventType is (PREVIEW|DOWNLOAD|PRINT)
      // — no VIEW value. Mapping VIEW → PREVIEW as the closest non-binding
      // read-only event semantic. Reversible if schema is later extended (C17).
      eventType: DownloadEventType.PREVIEW,
      deliveryMode: DownloadDeliveryMode.DIRECT,

      contentId: content?.id ?? undefined,
      memberId,
      email,

      ipAddress,
      userAgent,

      success: true,
      statusCode: 200,
      latencyMs: 0,
      processedAt: new Date(),

      metadata: JSON.stringify({ source: "web_vault" }),
    },
  });
}