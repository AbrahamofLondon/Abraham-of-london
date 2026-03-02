// app/actions/sync-vault.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getPrisma } from '@/lib/prisma.server';
import { getAllPDFItemsNode } from '@/lib/pdf/registry';

// ✅ IMPORTANT: use Prisma enum (underscore values)
import type { AccessTier as PrismaAccessTier } from '@prisma/client';

/**
 * Institutional Sync: Reconciles File System PDF registry with PostgreSQL ContentMetadata
 * - Server-only
 * - Chunked transactions to avoid huge $transaction payloads
 * - Writes Prisma enum AccessTier (underscored) to ContentMetadata.classification
 * - Stores metadata as Json object (not string)
 */
export async function syncVaultRegistry() {
  try {
    const prisma = await getPrisma();
    if (!prisma) throw new Error('Database connection unavailable (DATABASE_URL not configured).');

    const fsItems = await getAllPDFItemsNode({ includeMissing: true });
    console.log(`[SYNC_START]: Processing ${fsItems.length} portfolio items.`);

    const now = new Date();

    /**
     * Normalize any incoming tier-ish value into Prisma AccessTier enum values.
     * Prisma enum values: public | member | inner_circle | client | legacy | architect | owner
     */
    const normalizeTierToPrismaAccessTier = (tier: unknown): PrismaAccessTier => {
      const t = String(tier ?? 'public').trim().toLowerCase();

      // Common aliases / legacy
      if (t === 'free' || t === 'public') return 'public';
      if (t === 'member') return 'member';

      // Hyphen vs underscore (app vs prisma)
      if (t === 'inner-circle' || t === 'innercircle' || t === 'inner_circle') return 'inner_circle';

      if (t === 'client') return 'client';
      if (t === 'legacy') return 'legacy';
      if (t === 'architect') return 'architect';
      if (t === 'owner' || t === 'admin' || t === 'internal' || t === 'root') return 'owner';

      // ✅ No "verified" exists in your schema → never emit it
      // Anything unknown becomes public to avoid poisoning classification
      return 'public';
    };

    const CHUNK = 50;
    let upserted = 0;

    for (let i = 0; i < fsItems.length; i += CHUNK) {
      const batch = fsItems.slice(i, i + CHUNK);

      const ops = batch.map((item: any) => {
        const classification = normalizeTierToPrismaAccessTier(item.tier ?? item.accessLevel);

        // Json field in Prisma → pass an object (NOT JSON.stringify)
        const metadata = {
          version: String(item.version || '1.0.0'),
          existsOnDisk: Boolean(item.existsOnDisk),
          fileSizeHuman: String(item.fileSizeHuman || ''),
          fileSizeBytes: typeof item.fileSizeBytes === 'number' ? item.fileSizeBytes : undefined,
          lastModifiedISO: String(item.lastModifiedISO || ''),
          outputPath: String(item.outputPath || item.path || ''),
          sourceTierRaw: String(item.tier ?? item.accessLevel ?? ''),
        };

        return prisma.contentMetadata.upsert({
          where: { slug: String(item.id) },
          update: {
            title: String(item.title || item.id),
            // ⚠️ Your schema has ContentType enum for contentType, but your existing code uses `type`.
            // If your ContentMetadata really has no `type` field, remove the next line.
            // If you intended `contentType`, map it properly here.
            // type: String(item.type || 'brief'),

            classification, // ✅ Prisma enum AccessTier
            updatedAt: now,
            metadata,
          },
          create: {
            slug: String(item.id),
            title: String(item.title || item.id),

            // type: String(item.type || 'brief'),

            classification,
            createdAt: now,
            updatedAt: now,
            metadata,
          },
        });
      });

      await prisma.$transaction(ops);
      upserted += batch.length;
      console.log(`[SYNC_PROGRESS]: ${upserted}/${fsItems.length}`);
    }

    revalidatePath('/dashboard');
    return { success: true, count: fsItems.length };
  } catch (error: any) {
    console.error('[SYNC_CRITICAL_FAILURE]:', error);
    return { success: false, error: error?.message || String(error) };
  }
}