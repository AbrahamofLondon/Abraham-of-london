// app/actions/sync-vault.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getPrisma } from '@/lib/prisma.server';
import { getAllPDFItemsNode } from '@/lib/pdf/registry';
import { normalizeRequiredTier } from '@/lib/access/tier-policy';
import type { AccessTier as PrismaAccessTier } from '@prisma/client';

const toPrismaAccessTier = (tier: string): PrismaAccessTier => {
  const normalized = normalizeRequiredTier(tier);
  
  // Use type assertion with runtime check
  const validTiers: string[] = [
    'public', 'member', 'inner_circle', 'restricted',
    'client', 'legacy', 'architect', 'owner', 'top_secret'
  ];
  
  if (validTiers.includes(normalized)) {
    return normalized as PrismaAccessTier;
  }
  
  return 'public' as PrismaAccessTier;
};

export async function syncVaultRegistry() {
  try {
    const prisma = await getPrisma();
    if (!prisma) throw new Error('Database connection unavailable.');

    const fsItems = await getAllPDFItemsNode({ includeMissing: true });
    console.log(`[SYNC_START]: Processing ${fsItems.length} portfolio items.`);

    const now = new Date();
    const CHUNK = 50;
    let upserted = 0;

    for (let i = 0; i < fsItems.length; i += CHUNK) {
      const batch = fsItems.slice(i, i + CHUNK);

      const ops = batch.map((item: any) => {
        const classification = toPrismaAccessTier(item.tier ?? item.accessLevel);

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
            classification,
            updatedAt: now,
            metadata,
          },
          create: {
            slug: String(item.id),
            title: String(item.title || item.id),
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