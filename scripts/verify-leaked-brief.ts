import { PrismaClient } from "@prisma/client";
import { buildFingerprintProfile } from "../lib/premium/fingerprint-profile";

const prisma = new PrismaClient();

/**
 * Verification Script: Forensic Attribution
 * Usage: npx ts-node scripts/verify-leaked-brief.ts <checksum>
 */
async function verifyLeakedBrief(checksum: string) {
  if (!checksum) {
    console.error("Error: Please provide a SHA256 checksum.");
    process.exit(1);
  }

  console.log(`\n[FORENSIC SEARCH] Initiating lookup for: ${checksum}\n`);

  try {
    // Search for the checksum in the metadata JSON column
    const matches = await prisma.premiumDownloadToken.findMany({
      where: {
        OR: [
          {
            metadata: {
              path: ["deliveredChecksum"],
              equals: checksum,
            },
          },
          {
            metadata: {
              path: ["sourceChecksum"],
              equals: checksum,
            },
          },
        ],
      },
      orderBy: { issuedAt: "desc" },
    });

    if (matches.length === 0) {
      console.log("[-] No matching delivery record found in the database.");
      return;
    }

    console.log(`[+] Found ${matches.length} matching event(s):\n`);

    for (const record of matches) {
      const meta = record.metadata as any;
      
      console.log("---------------------------------------------------------");
      console.log(`TOKEN ID:      ${record.tokenId}`);
      console.log(`CONTENT ID:    ${record.contentId}`);
      console.log(`RECIPIENT:     User: ${record.userId || "N/A"} | Session: ${record.sessionId || "N/A"}`);
      console.log(`DELIVERED AT:  ${meta.deliveredAt || record.issuedAt}`);
      console.log(`TIER:          ${record.tier || "N/A"}`);
      console.log(`WATERMARK ID:  ${meta.watermarkId || "N/A"}`);
      console.log(`TRACE ID:      ${meta.traceId || "N/A"}`);
      
      if (meta.fingerprint) {
        console.log(`\nFINGERPRINT PROFILE:`);
        console.log(JSON.stringify(meta.fingerprint, null, 2));
      }
      console.log("---------------------------------------------------------");
    }

  } catch (error) {
    console.error("[!] Forensic query failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execution
const targetChecksum = process.argv[2];
verifyLeakedBrief(targetChecksum);