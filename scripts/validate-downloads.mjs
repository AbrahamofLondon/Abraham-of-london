// scripts/validate-downloads.mjs
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
  // Converts:
  // - "/downloads/x.pdf" -> "/assets/downloads/x.pdf"
  // - "downloads/x.pdf"  -> "/assets/downloads/x.pdf"
  // - "/assets/downloads/x.pdf" -> "/assets/downloads/x.pdf"
  // - "x.pdf" -> "/assets/downloads/x.pdf"
  if (!publicPathOrFile || typeof publicPathOrFile !== "string") return null;

  const raw = publicPathOrFile.trim();
  if (isRemoteUrl(raw)) return raw; // don't rewrite remote URLs

  const base = basenameFromAny(raw);
  if (!base) return null;

  return `/assets/downloads/${base}`;
}

async function loadContentlayer() {
  const contentlayerPath = path.join(rootDir, ".contentlayer", "generated", "index.mjs");

  if (!fs.existsSync(contentlayerPath)) {
    throw new Error("Contentlayer not built. Run pnpm run content:build first.");
  }

  const contentlayerUrl = pathToFileURL(contentlayerPath).href;
  const contentlayerModule = await import(contentlayerUrl);

  // Your schema exports allDownloads (as you already used)
  return contentlayerModule.allDownloads || [];
}

function getPdfRef(download) {
  // Priority order matches your MDX usage
  // 1) pdfPath (preferred)
  // 2) downloadFile (legacy/alternate)
  // 3) file (filename-only)
  //
  // NOTE: if file is just "x.pdf", we canonicalize to /assets/downloads/x.pdf
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

  // canonical public href we *expect* going forward
  const canonicalPublicHref = canonicalizeToAssetsDownloads(raw); // /assets/downloads/<base>.pdf

  const candidates = [];

  // 1) if pdfRef is a path-like thing (/assets/downloads/.. or /downloads/..),
  // check it directly under public
  // - If it is just "x.pdf", this becomes "public/x.pdf" which is not desired,
  //   but it’s harmless to check.
  const direct = path.join(rootDir, "public", stripLeadingSlash(raw));
  candidates.push(direct);

  // 2) always check canonical location: public/assets/downloads/<basename>
  candidates.push(path.join(rootDir, "public", "assets", "downloads", base));

  // 3) check legacy wrong location: public/downloads/<basename>
  candidates.push(path.join(rootDir, "public", "downloads", base));

  // 4) also check the canonicalPublicHref explicitly (in case raw was "x.pdf")
  if (canonicalPublicHref && !isRemoteUrl(canonicalPublicHref)) {
    candidates.push(path.join(rootDir, "public", stripLeadingSlash(canonicalPublicHref)));
  }

  // de-dupe
  return Array.from(new Set(candidates));
}

function validateOneDownload(download) {
  const pdfRef = getPdfRef(download);
  if (!pdfRef) return []; // nothing to validate

  // Remote URLs are allowed
  if (isRemoteUrl(pdfRef)) return [];

  // Normalize to canonical expected href (for reporting)
  const expected = canonicalizeToAssetsDownloads(pdfRef) || pdfRef;

  const candidates = buildCandidateDiskPaths(pdfRef);
  for (const p of candidates) {
    if (fs.existsSync(p)) return [];
  }

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
  console.log("Validating downloads (pdfPath / downloadFile / file)...\n");

  const downloads = await loadContentlayer();
  console.log("Found", downloads.length, "downloads\n");

  const allErrors = downloads.flatMap(validateOneDownload);

  if (allErrors.length > 0) {
    console.log("❌ Missing PDF files:\n");

    for (const err of allErrors) {
      console.log(" -", err.slug);
      console.log("   Title:   ", err.title);
      console.log("   Raw ref: ", err.raw);
      console.log("   Expected:", err.expected);
      console.log("   Checked:");
      err.checkedPaths.forEach((p) => console.log("    ", p));
      console.log();
    }

    process.exit(1);
  }

  console.log("✅ All download PDFs validated!\n");
}

main().catch((e) => {
  console.error("❌ Validator failed:", e);
  process.exit(1);
});