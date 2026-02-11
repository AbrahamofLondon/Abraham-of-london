// lib/archive-accessor.ts — ARCHIVE ACCESSOR [V4.2.0]
import { PrismaClient } from '@prisma/client';
import { decryptDocument } from './security';

const prisma = new PrismaClient();

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
 * Ensures the 'Director' and 'Architect' tiers see the raw intelligence.
 */
export async function getBriefBySlug(slug: string): Promise<BriefResult | null> {
  const brief = await prisma.contentMetadata.findUnique({
    where: { slug },
  });

  if (!brief) return null;

  let finalContent = brief.content;
  const metadata = brief.metadata as any;

  // Gate: If encrypted, perform secure restoration
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
}