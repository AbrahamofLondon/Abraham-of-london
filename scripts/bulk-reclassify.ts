import { PrismaClient } from "@prisma/client";

async function reclassify() {
  // 1. Manual Credential Extraction
  const dbUrl = process.env.DATABASE_URL;

  console.log("🛡️ INITIATING SYSTEM-WIDE RE-CLASSIFICATION...");
  
  if (!dbUrl) {
    console.error("❌ CRITICAL: DATABASE_URL is missing from the environment.");
    return;
  }

  // 2. Direct Client Injection
  const prisma = new PrismaClient({
    datasources: {
      db: { url: dbUrl }
    }
  });

  try {
    const restrictedClassifications = ['RESTRICTED', 'INNER-CIRCLE', 'PRIVATE', 'LOCKED', 'SECRET'];

    console.log("📡 Connecting to Neon Instance...");

    const result = await prisma.contentMetadata.updateMany({
      where: {
        AND: [
          { classification: { notIn: restrictedClassifications } },
          { classification: { not: 'PUBLIC' } }
        ]
      },
      data: { classification: 'PUBLIC' }
    });

    console.log(`✅ SUCCESS: ${result.count} assets standardized to PUBLIC.`);

    // 3. Status Report
    const total = await prisma.contentMetadata.count();
    console.log(`📊 Current Archive State: ${total} Total Documents.`);

  } catch (error: any) {
    console.error("❌ DATABASE REJECTION:");
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

reclassify();