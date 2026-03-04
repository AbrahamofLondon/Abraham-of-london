/* lib/intelligence/repository.ts — Intelligence Repository (Enum-correct) */
import "server-only";

import { prisma } from "@/lib/prisma.server";
import { ContentType } from "@prisma/client";

export type LatestIntelligenceItem = {
  id: string;
  slug: string;
  title: string;
  contentType: ContentType;
  createdAt: Date;
  metadata: unknown;
};

/**
 * Retrieves the latest intelligence briefs for dashboards.
 *
 * Schema truth:
 * ContentType enum = Dossier | Briefing | Operational_Framework | Lexicon | Landing
 *
 * Default behavior:
 * - Treat "intelligence briefs" as ContentType.Briefing
 * - Optionally include Dossier by setting includeDossiers=true
 */
export async function getLatestIntelligence(
  limit: number = 3,
  opts?: { includeDossiers?: boolean }
): Promise<LatestIntelligenceItem[]> {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(50, limit)) : 3;
  const includeDossiers = Boolean(opts?.includeDossiers);

  const contentTypes: ContentType[] = includeDossiers
    ? [ContentType.Briefing, ContentType.Dossier]
    : [ContentType.Briefing];

  return await prisma.contentMetadata.findMany({
    where: { contentType: { in: contentTypes } },
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
}

export type IntelligenceAccessLogInput = {
  slug: string;
  memberId: string;
  email: string;
  ip: string;
  userAgent: string;
};

/**
 * Records a secure download event in DownloadAuditEvent.
 */
export async function logIntelligenceAccess(data: IntelligenceAccessLogInput) {
  const slug = String(data.slug || "").trim();
  const memberId = String(data.memberId || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  const ipAddress = String(data.ip || "").trim();
  const userAgent = String(data.userAgent || "").trim();

  if (!slug || !memberId || !email) {
    throw new Error("logIntelligenceAccess: slug, memberId, and email are required.");
  }

  return await prisma.downloadAuditEvent.create({
    data: {
      slug,
      memberId,
      email,
      ipAddress,
      userAgent,
      eventType: "DOWNLOAD_AUTHORIZATION",
      success: true,
      processedAt: new Date(),
    } as any,
  });
}