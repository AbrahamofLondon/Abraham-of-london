// scripts/validate-downloads.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

async function loadContentlayer() {
  const generatedPath = path.join(
    ROOT,
    ".contentlayer",
    "generated",
    "index.mjs",
  );

  if (!fs.existsSync(generatedPath)) {
    throw new Error(
      `Contentlayer output not found at ${generatedPath}. ` +
        `Run "pnpm run content:build" before downloads:validate.`,
    );
  }

  const moduleUrl = pathToFileURL(generatedPath).href;
  const mod = await import(moduleUrl);
  if (!mod.allDownloads) {
    throw new Error(
      "Contentlayer generated index does not export allDownloads. " +
        "Check contentlayer.config.mjs and rebuild.",
    );
  }
  return mod.allDownloads;
}

function collectPdfFiles(downloadsRoot, publicRoot) {
  const pdfFiles = [];
  if (!fs.existsSync(downloadsRoot)) return pdfFiles;

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && full.toLowerCase().endsWith(".pdf")) {
        // normalise to absolute path
        pdfFiles.push(path.resolve(full));
      }
    }
  };

  walk(downloadsRoot);
  return pdfFiles;
}

async function main() {
  const allDownloads = await loadContentlayer();

  const publicRoot = path.join(ROOT, "public");
  const downloadsRoot = path.join(publicRoot, "downloads");

  const missingFiles = [];
  const unreferencedPdfs = [];

  // 1) For each Download, ensure its downloadHref exists if it points to /downloads
  for (const doc of allDownloads) {
    const href =
      doc.downloadHref ||
      doc.downloadUrl ||
      doc.fileUrl ||
      "";

    if (!href) continue;

    // only enforce for local /downloads URLs
    if (!href.startsWith("/downloads/")) continue;

    const rel = href.replace(/^\/+/, ""); // strip leading slash
    const diskPath = path.resolve(path.join(publicRoot, rel));

    if (!fs.existsSync(diskPath)) {
      missingFiles.push({
        slug: doc.slug,
        title: doc.title,
        href,
        diskPath,
      });
    }
  }

  // 2) For each .pdf in public/downloads, ensure it is referenced
  const pdfFiles = collectPdfFiles(downloadsRoot, publicRoot);

  const usedPaths = new Set(
    allDownloads
      .map(
        (doc) =>
          doc.downloadHref ||
          doc.downloadUrl ||
          doc.fileUrl ||
          "",
      )
      .filter((href) => href.startsWith("/downloads/"))
      .map((href) =>
        path.resolve(
          path.join(publicRoot, href.replace(/^\/+/, "")),
        ),
      ),
  );

  for (const pdfPath of pdfFiles) {
    if (!usedPaths.has(pdfPath)) {
      unreferencedPdfs.push(pdfPath);
    }
  }

  // 3) Report and exit code
  if (missingFiles.length || unreferencedPdfs.length) {
    console.error("❌ Download validation failed.\n");

    if (missingFiles.length) {
      console.error("Missing files (referenced in MDX but not found on disk):");
      for (const m of missingFiles) {
        console.error(
          ` - slug=${m.slug} | title="${m.title}" | href=${m.href} -> expected at ${m.diskPath}`,
        );
      }
      console.error("");
    }

    if (unreferencedPdfs.length) {
      console.error("Unreferenced PDFs in public/downloads:");
      for (const p of unreferencedPdfs) {
        console.error(` - ${p}`);
      }
      console.error("");
    }

    process.exit(1);
  } else {
    console.log(
      "✅ Downloads validation passed: all Contentlayer links and public/downloads files are consistent.",
    );
  }
}

main().catch((err) => {
  console.error("Error while validating downloads:", err);
  process.exit(1);
});