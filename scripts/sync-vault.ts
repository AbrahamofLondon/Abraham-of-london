// scripts/sync-vault.ts
import { PrismaClient } from '@prisma/client';
import { allBriefs } from '../.contentlayer/generated'; // Adjust path if necessary

const prisma = new PrismaClient();

async function syncVault() {
  console.log("🚀 [VAULT SYNC]: Synchronizing via Institutional Proxy...");
  console.log(`[VAULT SYNC]: Indexing ${allBriefs.length} assets.`);

  try {
    for (const brief of allBriefs) {
      await prisma.contentMetadata.upsert({
        where: { id: brief._id },
        update: {
          title: brief.title,
          category: brief.category,
          tier: brief.tier || 'Standard',
          lastUpdated: new Date(),
        },
        create: {
          id: brief._id,
          title: brief.title,
          category: brief.category,
          tier: brief.tier || 'Standard',
        },
      });
    }
    console.log("✅ [VAULT SYNC]: Synchronization Complete.");
  } catch (error) {
    console.error("❌ [CRITICAL FAILURE]: Sync aborted.", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

syncVault();