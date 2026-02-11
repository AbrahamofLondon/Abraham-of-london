// scripts/pdf/check-portfolio.ts
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const DOWNLOADS_DIR = path.join(process.cwd(), "public/assets/downloads");

async function checkPortfolio() {
  console.log("\x1b[36m\n📊 ABRAHAM OF LONDON — PORTFOLIO INTEGRITY REPORT\x1b[0m");
  console.log("\x1b[90m────────────────────────────────────────────────────────────\x1b[0m");

  try {
    // 1. Fetch all Briefing metadata from DB
    const dbBriefs = await prisma.contentMetadata.findMany({
      where: { contentType: "Briefing" }
    });

    // 2. Scan physical files
    const physicalFiles = fs.existsSync(DOWNLOADS_DIR) 
      ? fs.readdirSync(DOWNLOADS_DIR).filter(f => f.endsWith(".pdf"))
      : [];

    const stats = {
      totalInDb: dbBriefs.length,
      totalOnDisk: physicalFiles.length,
      missingFiles: [] as string[],
      corrupted: [] as string[],
    };

    console.log(`📂 Physical Assets Found: ${stats.totalOnDisk}`);
    console.log(`🗄️  Database Records:      ${stats.totalInDb}`);

    for (const brief of dbBriefs) {
      const fileName = `${brief.slug}.pdf`;
      const fullPath = path.join(DOWNLOADS_DIR, fileName);

      if (!fs.existsSync(fullPath)) {
        stats.missingFiles.push(brief.slug);
      } else {
        const size = fs.statSync(fullPath).size;
        if (size < 8000) stats.corrupted.push(brief.slug);
      }
    }

    // 3. Output Findings
    if (stats.missingFiles.length > 0) {
      console.log("\x1b[31m\n❌ MISSING ASSETS (In DB but no PDF):\x1b[0m");
      stats.missingFiles.forEach(s => console.log(`   - ${s}`));
    }

    if (stats.corrupted.length > 0) {
      console.log("\x1b[33m\n⚠️  CORRUPTED ASSETS (Below 8KB threshold):\x1b[0m");
      stats.corrupted.forEach(s => console.log(`   - ${s}`));
    }

    if (stats.missingFiles.length === 0 && stats.corrupted.length === 0 && stats.totalInDb > 0) {
      console.log("\x1b[32m\n✅ ALL SYSTEMS NOMINAL: Portfolio is synchronized and valid.\x1b[0m");
    }

  } catch (err: any) {
    console.error("\x1b[31mCritical Reporting Failure:\x1b[0m", err.message);
  } finally {
    await prisma.$disconnect();
    console.log("\x1b[90m────────────────────────────────────────────────────────────\x1b[0m\n");
  }
}

checkPortfolio();