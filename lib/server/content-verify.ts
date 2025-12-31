/* lib/server/content-verify.ts */
import fs from "node:fs";
import path from "node:path";
import { getAllCanons, getAllDownloads } from "./content";

/**
 * ASSET INTEGRITY AUDIT
 * Validates that all referenced cover images and download files exist in /public.
 * Logic: Fails the build if institutional assets are missing.
 */
export function verifyInstitutionalAssets(): void {
  const missing: string[] = [];
  const publicDir = path.join(process.cwd(), "public");

  const checkAsset = (url: string | undefined | null, label: string) => {
    if (!url) return;
    // Only check local assets; skip external URLs
    if (url.startsWith("/")) {
      const fullPath = path.join(publicDir, url.split('?')[0]);
      if (!fs.existsSync(fullPath)) {
        missing.push(`${label} -> Missing file at: ${url}`);
      }
    }
  };

  // 1. Audit Canon Assets
  const canons = getAllCanons();
  canons.forEach(doc => {
    if ((doc as any).coverImage) {
      checkAsset((doc as any).coverImage, `Canon Cover [${doc.slug}]`);
    }
  });

  // 2. Audit Downloadable Frameworks
  const downloads = getAllDownloads();
  downloads.forEach(doc => {
    const fileUrl = (doc as any).downloadUrl || (doc as any).file;
    if (fileUrl) {
      checkAsset(fileUrl, `PDF Framework [${doc.slug}]`);
    }
    if ((doc as any).coverImage) {
      checkAsset((doc as any).coverImage, `Download Cover [${doc.slug}]`);
    }
  });

  // 3. Outcome focused response
  if (missing.length > 0) {
    console.error("\n❌ [INSTITUTIONAL ASSET ERROR] Build aborted due to missing resources:");
    missing.forEach(m => console.error(`  ${m}`));
    process.exit(1); // Block deployment to preserve brand integrity
  }

  console.log("✅ [ASSET_AUDIT] All institutional assets verified.");
}
