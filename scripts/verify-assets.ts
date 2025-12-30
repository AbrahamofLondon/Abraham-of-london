/* scripts/verify-assets.ts */
import fs from "fs";
import path from "path";
import { FRAMEWORKS } from "../lib/resources/strategic-frameworks";

/**
 * ARCHITECTURAL AUDIT:
 * Ensures the Framework Manifest and the Physical Assets are in sync.
 */
function verifyAssets() {
  console.log("🔍 Starting Strategic Asset Audit...");
  
  const publicDir = path.join(process.cwd(), "public");
  let missingCount = 0;
  let successCount = 0;

  FRAMEWORKS.forEach((f) => {
    if (!f.artifactHref) {
      console.warn(`⚠️  [MISSING HREF]: Framework "${f.title}" has no artifactHref defined.`);
      return;
    }

    // Convert URL path to Disk path
    const diskPath = path.join(publicDir, f.artifactHref);

    if (fs.existsSync(diskPath)) {
      const stats = fs.statSync(diskPath);
      const fileSizeKib = (stats.size / 1024).toFixed(2);
      console.log(`✅ [FOUND]: ${f.title} -> ${f.artifactHref} (${fileSizeKib} KiB)`);
      successCount++;
    } else {
      console.error(`❌ [404 ERROR]: ${f.title} expected at ${diskPath}`);
      missingCount++;
    }
  });

  console.log("\n--- Audit Summary ---");
  console.log(`Verified: ${successCount}`);
  console.log(`Failed:   ${missingCount}`);

  if (missingCount > 0) {
    console.error("\n🚨 AUDIT FAILED: Deployment integrity compromised.");
    process.exit(1);
  } else {
    console.log("\n✨ AUDIT PASSED: All strategic assets accounted for.");
  }
}

verifyAssets();