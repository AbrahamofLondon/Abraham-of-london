/* lib/intelligence/repository.ts — Bridging the UI to your New Schema */
import { prisma } from "@/lib/db";

/**
 * Retrieves the latest briefs for the VIP Dashboard 
 * using the ContentMetadata table from your corrected schema.
 */
export async function getLatestIntelligence(limit = 3) {
  return await prisma.contentMetadata.findMany({
    where: {
      contentType: "intelligence_brief", // Filtering for your portfolio
    },
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      slug: true,
      title: true,
      contentType: true,
      createdAt: true,
      metadata: true, // Stores codeNames or classification levels
    }
  });
}

/**
 * Records a secure download event in the DownloadAuditEvent table.
 */
export async function logIntelligenceAccess(data: {
  slug: string;
  memberId: string;
  email: string;
  ip: string;
  userAgent: string;
}) {
  return await prisma.downloadAuditEvent.create({
    data: {
      slug: data.slug,
      memberId: data.memberId,
      email: data.email,
      ipAddress: data.ip,
      userAgent: data.userAgent,
      eventType: "DOWNLOAD_AUTHORIZATION",
      success: true,
      processedAt: new Date(),
    }
  });
}