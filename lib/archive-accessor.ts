// lib/archive-accessor.ts — ARCHIVE ACCESSOR [V4.2.0]
import { decryptDocument } from './security';

// Use require for CommonJS compatibility - this works reliably with Prisma
const { PrismaClient } = require('@prisma/client');

// Create a singleton Prisma client
const globalForPrisma = global as unknown as { prisma: any };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export type BriefResult = {
  id: string;
  slug: string;
  title: string;
  decryptedContent: string | null;
  classification: string;
  metadata: any;
};

/**
 * Institutional Accessor: Retrieves and decrypts briefs.
 */
export async function getBriefBySlug(slug: string): Promise<BriefResult | null> {
  try {
    const brief = await prisma.contentMetadata.findUnique({
      where: { slug },
    });

    if (!brief) return null;

    let finalContent = brief.content;
    const metadata = brief.metadata as any;

    if (metadata?.isEncrypted && brief.content) {
      try {
        finalContent = decryptDocument(
          brief.content,
          metadata.iv,
          metadata.authTag
        );
      } catch (error) {
        console.error(`[SECURITY] Decryption failed for brief: ${slug}`);
        finalContent = "[DECRYPTION_ERROR: Institutional Key Mismatch]";
      }
    }

    return {
      id: brief.id,
      slug: brief.slug,
      title: brief.title,
      decryptedContent: finalContent,
      classification: brief.classification.toString(),
      metadata: metadata,
    };
  } catch (error) {
    console.error(`[ARCHIVE] Failed to fetch brief: ${slug}`, error);
    return null;
  }
}