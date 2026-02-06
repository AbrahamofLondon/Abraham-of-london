/* scripts/sync-pdfs.ts — PDF ASSET ALIGNMENT */
import { PrismaClient } from "@prisma/client";
import { getPDFRegistrySource } from "../pdf/pdf-registry.source";

const prisma = new PrismaClient();

/**
 * Synchronizes the hard-coded PDF registry with the Postgres content ledger.
 * This ensures the Dashboard can render dossiers even if the file is stored in S3/Local.
 */
async function syncBriefsToDatabase() {
  console.log("📡 Initializing PDF Brief Synchronization...");
  
  // Fetching the source of truth for the 75+ briefs
  const assets = getPDFRegistrySource();

  for (const asset of assets) {
    // Institutional Classification Logic
    // Maps standard tags to database-readable JSON
    const metadataObject = {
      category: asset.category || "STRATEGIC_ANALYSIS",
      classification: asset.classification || "LEVEL 3",
      readTime: asset.readTime || "12 MIN",
      pages: asset.pages || 0,
      institutional_code: `AOL-PDF-${asset.id.slice(0, 4).toUpperCase()}`,
    };

    try {
      await prisma.contentMetadata.upsert({
        where: { slug: asset.id },
        update: {
          title: asset.title,
          metadata: JSON.stringify(metadataObject),
          // Ensure the tier matches the classification
          tier: asset.classification === "LEVEL 4" ? "directorate" : "standard",
        },
        create: {
          slug: asset.id,
          title: asset.title,
          contentType: "PDF_BRIEF",
          metadata: JSON.stringify(metadataObject),
          tier: asset.classification === "LEVEL 4" ? "directorate" : "standard",
          createdAt: new Date(),
        },
      });
      console.log(`✅ ALIGNED: ${asset.title} [${asset.id}]`);
    } catch (error) {
      console.error(`❌ ALIGNMENT_FAILURE for ${asset.title}:`, error);
    }
  }

  console.log("🎉 Database alignment complete. Sovereignty maintained.");
}

syncBriefsToDatabase()
  .catch((e) => {
    console.error("CRITICAL_SYNC_ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });