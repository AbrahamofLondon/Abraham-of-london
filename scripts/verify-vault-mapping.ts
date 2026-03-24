/* scripts/vault-sync.ts - FINAL RECTIFICATION */
import { PrismaClient, ContentType } from '@prisma/client';
import { allBriefs } from '../.contentlayer/generated/index.mjs'; 

const prisma = new PrismaClient();

/**
 * INSTITUTIONAL TYPE RESOLVER
 * Validated against the March 20 Verification Run.
 */
function resolveContentType(brief: any): ContentType {
  const cat = String(brief.category || "").toLowerCase();
  const slug = String(brief.slugSafe || "").toLowerCase();
  const title = String(brief.titleSafe || "").toLowerCase();

  if (cat.includes("sovereign") || slug.includes("si-") || title.includes("sovereign")) {
    return ContentType.Sovereign_Intelligence;
  }
  if (cat.includes("audit") || slug.includes("audit")) {
    return ContentType.Audit;
  }
  if (cat.includes("governance") || slug.includes("rule-of-life") || cat.includes("framework")) {
    return ContentType.Operational_Framework;
  }
  if (cat.includes("leadership")) return ContentType.Leadership;
  if (cat.includes("strategy")) return ContentType.Strategy;
  if (cat.includes("lexicon")) return ContentType.Lexicon;

  return ContentType.Briefs;
}

async function masterSync() {
  console.log("🚀 [VAULT SYNC]: Initiating Institutional Synchronization...");
  console.log(`[VAULT SYNC]: Processing ${allBriefs.length} intelligence assets.`);

  try {
    const operations = allBriefs.map((brief) => {
      // Clean slug and determine Enum
      const cleanSlug = brief.slugSafe.replace(/^\/+/, "");
      const targetType = resolveContentType(brief);

      return prisma.contentMetadata.upsert({
        where: { slug: cleanSlug },
        update: {
          title: brief.titleSafe,
          contentType: targetType,
          classification: "PUBLIC",
          summary: brief.excerptSafe || brief.description || "",
          content: brief.body.raw,
          metadata: {
            ...brief.metadata,
            institutionalId: brief.institutionalId || `AUTO-${cleanSlug.toUpperCase()}`,
            lastSync: new Date().toISOString(),
          },
          updatedAt: new Date(),
        },
        create: {
          slug: cleanSlug,
          title: brief.titleSafe,
          contentType: targetType,
          classification: "PUBLIC",
          summary: brief.excerptSafe || brief.description || "",
          content: brief.body.raw,
          version: brief.version || "1.0.0",
        },
      });
    });

    // Execute as a single atomic unit
    const results = await prisma.$transaction(operations);
    
    console.log("\n--- SYNC COMPLETE ---");
    console.log(`✅ Status: SUCCESS`);
    console.log(`📦 Assets Committed: ${results.length}`);
    console.log(`🛡️  Classification: INSTITUTIONAL ALPHA`);
    
  } catch (error) {
    console.error("\n❌ [CRITICAL SYNC FAILURE]:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

masterSync();