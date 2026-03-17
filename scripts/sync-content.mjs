/* scripts/sync-content.mjs - STRATEGIC CONTENT SYNCHRONIZATION (FIXED) */
import { PrismaClient } from "@prisma/client";
import { allBriefs } from "../.contentlayer/generated/index.mjs"; 

const prisma = new PrismaClient();

async function syncContent() {
  console.log(`📡 [SYNC]: Preparing to index ${allBriefs.length} intelligence briefs...`);

  for (const brief of allBriefs) {
    try {
      // FIX: Robust slug resolution
      // Falls back to the flattened path (e.g., 'briefs/si-062') if brief.slug is missing
      const resolvedSlug = brief.slug || brief._raw.flattenedPath.split('/').pop();
      
      if (!resolvedSlug) {
        console.warn(`⚠️ [SKIP]: Could not resolve slug for ${brief.title}`);
        continue;
      }

      const record = await prisma.contentMetadata.upsert({
        where: { slug: resolvedSlug },
        update: {
          title: brief.title,
          content: brief.body.raw,
          summary: brief.summary || brief.description || null,
          contentType: "Briefs",
          classification: (brief.tier || "member").toLowerCase(), 
          updatedAt: new Date(),
        },
        create: {
          slug: resolvedSlug,
          title: brief.title,
          content: brief.body.raw,
          summary: brief.summary || brief.description || null,
          contentType: "Briefs",
          classification: (brief.tier || "member").toLowerCase(),
        },
      });

      console.log(`✅ [SYNCED]: ${record.slug}`);
    } catch (error) {
      console.error(`❌ [FAILED]: ${brief.title || 'Unknown'} - ${error.message}`);
    }
  }
}

syncContent()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🏁 [SYNC COMPLETE]: Database content is now synchronized.");
  });