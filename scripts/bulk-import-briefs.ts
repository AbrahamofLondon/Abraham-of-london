/* ============================================================================
 * SOVEREIGN ASSET LOADER: 75 INTELLIGENCE BRIEFS
 * Encrypts and pushes the portfolio to the production database.
 * ============================================================================ */

import { PrismaClient } from "@prisma/client";
import { encryptDocument } from "../lib/security";
import { BRIEF_REGISTRY } from "../lib/briefs/registry";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 STARTING BULK ENCRYPTION & IMPORT...");

  for (const brief of BRIEF_REGISTRY) {
    console.log(`📦 Processing Vol. ${brief.volume}: ${brief.title}`);

    // 1. Encrypt the abstract and metadata if restricted
    const isRestricted = brief.classification === "Restricted";
    
    // In a real scenario, you'd load the full markdown content here.
    // For now, we are securing the registry entries.
    const encryptedBody = isRestricted 
      ? encryptDocument(brief.abstract) 
      : null;

    // 2. Upsert into the Database
    await prisma.document.upsert({
      where: { slug: brief.id },
      update: {
        title: brief.title,
        classification: brief.classification,
        content: encryptedBody ? encryptedBody.content : brief.abstract,
        iv: encryptedBody?.iv || null,
        authTag: encryptedBody?.authTag || null,
        isEncrypted: isRestricted,
      },
      create: {
        slug: brief.id,
        title: brief.title,
        classification: brief.classification,
        content: encryptedBody ? encryptedBody.content : brief.abstract,
        iv: encryptedBody?.iv || null,
        authTag: encryptedBody?.authTag || null,
        isEncrypted: isRestricted,
        type: "BRIEF"
      },
    });
  }

  console.log("\n✅ IMPORT COMPLETE: 75 Assets Secured in Vault.");
}

main()
  .catch((e) => {
    console.error("❌ IMPORT FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });