/* scripts/sync-links.mjs - RELATIONSHIP ENGINE */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function syncLinks() {
  console.log("🔗 [RELATIONSHIPS]: Connecting intelligence assets...");

  // 1. Fetch all assets that have 'related' or 'dependencies' in their metadata
  const assets = await prisma.contentMetadata.findMany();
  
  for (const source of assets) {
    const metadata = source.metadata || {};
    // Check common frontmatter keys for relationships
    const relatedSlugs = metadata.related || metadata.dependencies || [];

    if (!Array.isArray(relatedSlugs) || relatedSlugs.length === 0) continue;

    for (const targetSlug of relatedSlugs) {
      // Find the target asset by its slug
      const target = assets.find(a => a.slug.includes(targetSlug) || targetSlug.includes(a.slug));

      if (target && source.id !== target.id) {
        await prisma.strategicLink.upsert({
          where: {
            sourceId_targetId: {
              sourceId: source.id,
              targetId: target.id,
            },
          },
          update: {}, // Already exists
          create: {
            sourceId: source.id,
            targetId: target.id,
            linkType: "DEPENDENCY",
            strength: 1.0,
          },
        });
        console.log(`   Linked: [${source.title}] -> [${target.title}]`);
      }
    }
  }

  console.log("✅ [SUCCESS]: Strategic graph populated.");
}

syncLinks().finally(() => prisma.$disconnect());