import { prisma } from "../lib/prisma";

async function generateKeys() {
  console.log("🔐 [KEY_GENERATOR]: Finalizing Security Locks...");

  try {
    const restrictedBriefs = await prisma.contentMetadata.findMany({
      where: {
        OR: [
          { classification: "inner-circle" },
          { classification: "private" },
          { classification: "restricted" }
        ]
      }
    });

    console.log(`📡 Found ${restrictedBriefs.length} assets requiring protection.`);

    // Define a perpetuity date (100 years into the future)
    const perpetuity = new Date();
    perpetuity.setFullYear(perpetuity.getFullYear() + 100);

    const lockOps = restrictedBriefs.map(brief => {
      return prisma.assetLock.upsert({
        where: {
          assetType_assetId: {
            assetType: "brief",
            assetId: brief.id
          }
        },
        update: {
          lockedAt: new Date(),
          metadata: JSON.stringify({ slug: brief.slug, level: brief.classification })
        },
        create: {
          assetType: "brief",
          assetId: brief.id,
          lockedBy: "SYSTEM_VAULT_SYNC",
          lockedAt: new Date(),
          expiresAt: perpetuity, // RESOLVES THE MISSING ARGUMENT ERROR
          purpose: `Institutional Security: ${brief.classification}`,
          metadata: JSON.stringify({ slug: brief.slug, level: brief.classification })
        }
      });
    });

    const results = await prisma.$transaction(lockOps);
    console.log(`✅ [SUCCESS]: ${results.length} AssetLocks are now active.`);

  } catch (error) {
    console.error("❌ [KEY_GEN_FAILURE]:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

generateKeys();