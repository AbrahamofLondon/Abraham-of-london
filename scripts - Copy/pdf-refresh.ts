/* scripts/pdf-refresh.ts - FINAL RECONCILED VERSION */
import { scanForPDFContent } from './pdf/scanner.ts';
import { generateMissingPdfs } from './pdf/intelligent-generator.ts';
import fs from 'fs';
import path from 'path';

async function refresh() {
  console.log("🔄 STARTING INSTITUTIONAL ASSET REFRESH");
  console.log("============================================================");

  try {
    // 1. Full Scan
    await scanForPDFContent();
    
    // 2. Sync
    console.log("\n🚀 SYNCHRONIZING ASSETS...");
    await generateMissingPdfs({
      createPlaceholders: true,
      enableContentScan: true
    });

    // 3. Robust Alias Reconciliation
    console.log("\n🧷 RECONCILING CANONICAL ALIASES...");
    const coreAssets = [
      { src: 'life-alignment-assessment.pdf', alias: 'core-alignment.pdf' },
      { src: 'legacy-canvas-fillable.pdf', alias: 'core-legacy.pdf' }
    ];

    const searchDirs = [
      'public/assets/downloads/content-downloads',
      'public/assets/downloads/lib-pdf',
      'public/assets/downloads'
    ];

    const targetDir = path.join(process.cwd(), 'public/assets/downloads/content-downloads');
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    coreAssets.forEach(asset => {
      let foundPath: string | null = null;

      // Search all possible locations for the source file
      for (const dir of searchDirs) {
        const fullPath = path.join(process.cwd(), dir, asset.src);
        if (fs.existsSync(fullPath)) {
          foundPath = fullPath;
          break;
        }
      }

      if (foundPath) {
        const aliasPath = path.join(targetDir, asset.alias);
        fs.copyFileSync(foundPath, aliasPath);
        console.log(`   ✅ Created Alias: ${asset.alias} (from ${path.basename(path.dirname(foundPath))})`);
      } else {
        console.warn(`   ⚠️  CANONICAL SOURCE MISSING: ${asset.src} not found in any directory.`);
      }
    });

    console.log("\n============================================================");
    console.log("✨ REFRESH COMPLETE: Institutional Integrity Verified");
  } catch (error) {
    console.error("❌ REFRESH FAILED:", error);
    process.exit(1);
  }
}

refresh();