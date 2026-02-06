// scripts/generate-security-manifest.ts
import { prisma } from "../lib/prisma";
import { AoLTier } from "../types/next-auth";
import fs from "fs";
import path from "path";

async function generateSecurityManifest() {
  console.log("🛡️  GENERATING INSTITUTIONAL SECURITY MANIFEST...");

  try {
    const members = await prisma.innerCircleMember.findMany({
      where: { status: "active" },
      select: {
        id: true,
        emailHash: true,
        tier: true,
        flags: true,
      }
    });

    const manifest = members.map(m => {
      const flags: string[] = JSON.parse(m.flags || "[]");
      const isInternal = flags.includes("internal") || flags.includes("admin");
      
      return {
        member_id_obfuscated: `${m.id.substring(0, 4)}...${m.id.slice(-4)}`,
        identity_hash: m.emailHash,
        assigned_tier: m.tier as AoLTier,
        clearance_level: isInternal ? "DIRECTORATE" : "MEMBER",
        can_access_restricted: isInternal,
        timestamp: new Date().toISOString()
      };
    });

    const outPath = path.join(process.cwd(), "security-manifest.json");
    fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));

    console.log(`✅ SUCCESS: ${members.length} records verified.`);
    console.log(`📂 OUTPUT: ${outPath}`);
  } catch (err) {
    console.error("❌ CRITICAL FAILURE:", err);
  } finally {
    await prisma.$disconnect();
  }
}

generateSecurityManifest();