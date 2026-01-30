// scripts/validate-downloads.mjs - FIXED VERSION
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function isRemoteUrl(x) {
  if (!x || typeof x !== "string") return false;
  return /^https?:\/\//i.test(x.trim());
}

function stripLeadingSlash(p) {
  return String(p || "").replace(/^\/+/, "");
}

function basenameFromAny(p) {
  if (!p || typeof p !== "string") return null;
  const clean = p.split("?")[0].split("#")[0];
  return path.basename(clean);
}

function canonicalizeToAssetsDownloads(publicPathOrFile) {
  if (!publicPathOrFile || typeof publicPathOrFile !== "string") return null;

  const raw = publicPathOrFile.trim();
  if (isRemoteUrl(raw)) return raw;

  const base = basenameFromAny(raw);
  if (!base) return null;

  return `/assets/downloads/${base}`;
}

async function loadContentlayer() {
  const contentlayerPath = path.join(rootDir, ".contentlayer", "generated", "index.ts");

  // Check if Contentlayer is built
  if (!fs.existsSync(contentlayerPath)) {
    console.warn("⚠️  Contentlayer not found at:", contentlayerPath);
    console.warn("⚠️  Attempting to build Contentlayer first...\n");
    
    // Try to build Contentlayer
    const { execSync } = await import("child_process");
    try {
      execSync("pnpm run content:build", {
        cwd: rootDir,
        stdio: "inherit",
      });
      
      // Check again after building
      if (!fs.existsSync(contentlayerPath)) {
        throw new Error(
          "Contentlayer build completed but output not found. " +
          "This might indicate a configuration issue."
        );
      }
      
      console.log("✅ Contentlayer built successfully\n");
    } catch (buildError) {
      throw new Error(
        `Failed to build Contentlayer: ${buildError.message}\n` +
        "Please run 'pnpm run content:build' manually to diagnose the issue."
      );
    }
  }

  const contentlayerUrl = pathToFileURL(contentlayerPath).href;
  
  try {
    const contentlayerModule = await import(contentlayerUrl);
    return contentlayerModule.allDownloads || [];
  } catch (importError) {
    throw new Error(
      `Failed to import Contentlayer: ${importError.message}\n` +
      "The .contentlayer directory may be corrupted. Try rebuilding with 'pnpm run content:build'."
    );
  }
}

function getPdfRef(download) {
  // Priority order:
  // 1) pdfPath (preferred)
  // 2) downloadFile (legacy/alternate)
  // 3) file (filename-only)
  const pdfPath = download?.pdfPath;
  if (typeof pdfPath === "string" && pdfPath.trim()) return pdfPath.trim();

  const downloadFile = download?.downloadFile;
  if (typeof downloadFile === "string" && downloadFile.trim()) return downloadFile.trim();

  const file = download?.file;
  if (typeof file === "string" && file.trim()) return file.trim();

  return null;
}

function buildCandidateDiskPaths(pdfRef) {
  if (!pdfRef || isRemoteUrl(pdfRef)) return [];

  const raw = pdfRef.trim();
  const base = basenameFromAny(raw);
  if (!base) return [];

  const canonicalPublicHref = canonicalizeToAssetsDownloads(raw);

  const candidates = [];

  // 1) Direct path under public
  const direct = path.join(rootDir, "public", stripLeadingSlash(raw));
  candidates.push(direct);

  // 2) Canonical location: public/assets/downloads/<basename>
  candidates.push(path.join(rootDir, "public", "assets", "downloads", base));

  // 3) Legacy location: public/downloads/<basename>
  candidates.push(path.join(rootDir, "public", "downloads", base));

  // 4) Canonical public href
  if (canonicalPublicHref && !isRemoteUrl(canonicalPublicHref)) {
    candidates.push(path.join(rootDir, "public", stripLeadingSlash(canonicalPublicHref)));
  }

  // De-duplicate
  return Array.from(new Set(candidates));
}

function validateOneDownload(download) {
  const pdfRef = getPdfRef(download);
  if (!pdfRef) {
    // No PDF reference - might be intentional (e.g., external link only)
    return [];
  }

  // Remote URLs are allowed
  if (isRemoteUrl(pdfRef)) {
    console.log(`  ℹ️  Remote URL (skipping): ${download.slug} -> ${pdfRef}`);
    return [];
  }

  const expected = canonicalizeToAssetsDownloads(pdfRef) || pdfRef;
  const candidates = buildCandidateDiskPaths(pdfRef);
  
  // Check if file exists in any candidate location
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      console.log(`  ✓ ${download.slug}`);
      return [];
    }
  }

  // File not found in any location
  return [
    {
      slug: download.slug,
      title: download.title,
      expected,
      raw: pdfRef,
      checkedPaths: candidates,
    },
  ];
}

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Download PDF Validator");
  console.log("═══════════════════════════════════════════════════════\n");

  let downloads;
  
  try {
    downloads = await loadContentlayer();
  } catch (error) {
    console.error("❌ Failed to load Contentlayer data:\n");
    console.error(error.message);
    console.error("\nPlease ensure:");
    console.error("  1. Content files are present in your content directory");
    console.error("  2. Contentlayer config (contentlayer.config.ts) is valid");
    console.error("  3. Run 'pnpm run content:build' manually to diagnose\n");
    process.exit(1);
  }

  console.log(`Found ${downloads.length} download(s) to validate\n`);

  if (downloads.length === 0) {
    console.log("⚠️  No downloads found. Nothing to validate.\n");
    process.exit(0);
  }

  const allErrors = downloads.flatMap(validateOneDownload);

  console.log(); // Empty line after validation output

  if (allErrors.length > 0) {
    console.log("═══════════════════════════════════════════════════════");
    console.log("❌ Missing PDF Files");
    console.log("═══════════════════════════════════════════════════════\n");

    for (const err of allErrors) {
      console.log(`📄 ${err.slug}`);
      console.log(`   Title:    ${err.title}`);
      console.log(`   Raw ref:  ${err.raw}`);
      console.log(`   Expected: ${err.expected}`);
      console.log(`   Checked locations:`);
      err.checkedPaths.forEach((p) => console.log(`     • ${p}`));
      console.log();
    }

    console.log("═══════════════════════════════════════════════════════");
    console.log(`Summary: ${allErrors.length} missing file(s)`);
    console.log("═══════════════════════════════════════════════════════\n");
    
    console.log("To fix:");
    console.log("  1. Add the missing PDF files to public/assets/downloads/");
    console.log("  2. Or update the frontmatter to point to correct files");
    console.log("  3. Or add files to .gitignore exceptions if they're ignored\n");

    process.exit(1);
  }

  console.log("═══════════════════════════════════════════════════════");
  console.log("✅ All Download PDFs Validated Successfully!");
  console.log("═══════════════════════════════════════════════════════\n");
  process.exit(0);
}

main().catch((e) => {
  console.error("\n═══════════════════════════════════════════════════════");
  console.error("❌ Validator Failed with Unexpected Error");
  console.error("═══════════════════════════════════════════════════════\n");
  console.error(e);
  console.error();
  process.exit(1);
});
