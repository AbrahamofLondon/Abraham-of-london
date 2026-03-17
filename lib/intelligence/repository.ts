/* lib/intelligence/repository.ts — Intelligence Repository (Schema-Aligned) */
import "server-only";

import { prisma } from "@/lib/prisma.server";
import { ContentType } from "@prisma/client";

export type LatestIntelligenceItem = {
  id: string;
  slug: string;
  title: string;
  contentType: ContentType;
  createdAt: Date;
  metadata: any; 
};

/**
 * Retrieves the latest intelligence assets.
 */
export async function getLatestIntelligence(
  limit: number = 3,
  opts?: { includeDossiers?: boolean }
): Promise<LatestIntelligenceItem[]> {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(50, limit)) : 3;
  const includeDossiers = Boolean(opts?.includeDossiers);

  // ALIGNED WITH SCHEMA: Both cases now use Briefs to match the Prisma Client
  const contentTypes: ContentType[] = includeDossiers
    ? [ContentType.Briefs, ContentType.Dossier]
    : [ContentType.Briefs];

  try {
    const results = await prisma.contentMetadata.findMany({
      where: { 
        contentType: { in: contentTypes } 
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

/**
 * Records a secure audit trail of access/downloads.
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
      eventType: "INTEL_ACCESS",
      success: true,
      processedAt: new Date(),
      metadata: { source: "web_vault" }
    },
  });
}