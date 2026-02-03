/* ============================================================================
 * VAULT INTEGRITY VERIFIER (SOVEREIGN EDITION - V2)
 * Corrects the argument mapping to match lib/security.ts
 * ============================================================================ */
import { PrismaClient } from "@prisma/client";
import { decryptDocument } from "../lib/security"; 
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function verify() {
  console.log("🔍 INITIATING VAULT INTEGRITY CHECK...");

  const sample = await prisma.contentMetadata.findFirst({
    where: { metadata: { not: null } }
  });

  if (!sample || !sample.metadata) {
    console.error("❌ VAULT EMPTY: No records found.");
    return;
  }

  try {
    // 1. Parse the JSON envelope stored in the metadata column
    const security = JSON.parse(sample.metadata);
    
    // 2. Map the JSON properties to the positional arguments expected by lib/security.ts
    // Looking at the security.ts signature: (encryptedData, iv, authTag)
    const decrypted = decryptDocument(
      security.content, // This maps to encryptedData
      security.iv, 
      security.authTag
    );
    
    console.log(`✅ INTEGRITY CONFIRMED`);
    console.log(`Target: [${sample.slug}]`);
    console.log(`Output: ${decrypted.slice(0, 60)}...`);
  } catch (e) {
    console.error("❌ DECRYPTION FAILURE: Argument mismatch or Key error.");
    console.error(e);
  }
}

verify().finally(() => prisma.$disconnect());