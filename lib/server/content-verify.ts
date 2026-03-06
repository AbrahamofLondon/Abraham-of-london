// lib/server/content-verify.ts
import fs from "fs";
import path from "path";
import { getAllCanons, getAllDownloads } from "@/lib/content/server";

/**
 * ASSET INTEGRITY AUDIT
 * Validates that all referenced cover images and download files exist in /public.
 * Logic: Fails the build if institutional assets are missing.
 */
export function verifyInstitutionalAssets(): void {
  // Skip audit in development if explicitly requested
  if (process.env.NODE_ENV === "development" && process.env.SKIP_ASSET_AUDIT === "true") {
    return;
  }

  const missing: string[] = [];
  const publicDir = path.join(process.cwd(), "public");

  const checkAsset = (url: string | undefined | null, label: string) => {
    if (!url) return;

    // Only check local assets; skip external URLs
    if (url.startsWith("/")) {
      const cleanUrl = url.split("?")[0] || "";
      if (!cleanUrl) return;

      const fullPath = path.join(publicDir, cleanUrl);

      if (!fs.existsSync(fullPath)) {
        missing.push(`${label} -> Missing file at: ${url}`);
      }
    }
  };

  try {
    // 1) Audit Canon Assets
    const canons = getAllCanons();
    canons.forEach((doc: any) => {
      if (doc.coverImage) checkAsset(doc.coverImage, `Canon Cover [${doc.slug}]`);
    });

    // 2) Audit Downloadable Frameworks
    const downloads = getAllDownloads();
    downloads.forEach((doc: any) => {
      const fileUrl = doc.downloadUrl || doc.file;
      if (fileUrl) checkAsset(fileUrl, `PDF Framework [${doc.slug}]`);
      if (doc.coverImage) checkAsset(doc.coverImage, `Download Cover [${doc.slug}]`);
    });

    // 3) Outcome
    if (missing.length > 0) {
      console.error("\n❌ [INSTITUTIONAL ASSET ERROR] Build aborted due to missing resources:");
      missing.forEach((m) => console.error(`  ${m}`));
      process.exit(1);
    }

    console.log("✅ [ASSET_AUDIT] All institutional assets verified.");
  } catch (error) {
    // Fail soft if Contentlayer isn't fully built yet (e.g. initial bootstrap)
    console.warn("⚠️ [ASSET_AUDIT] Skipped due to content loading error:", error);
  }
}