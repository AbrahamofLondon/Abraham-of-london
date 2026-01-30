// scripts/validate-downloads.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function existsFileSafe(fullPath) {
  try {
    const st = fs.statSync(fullPath);
    return st.isFile();
  } catch {
    return false;
  }
}

function normalizeRef(ref) {
  if (!ref || typeof ref !== "string") return null;

  // ignore remote refs
  if (/^https?:\/\//i.test(ref)) return null;

  // strip query/hash
  const clean = ref.split("#")[0].split("?")[0].trim();
  if (!clean) return null;

  // normalize slashes
  const normalized = clean.replace(/\\/g, "/");

  // normalize legacy "/downloads/..." -> "/assets/downloads/..."
  if (normalized.startsWith("/downloads/")) {
    return normalized.replace(/^\/downloads\//, "/assets/downloads/");
  }

  // keep "/assets/downloads/..." and other internal refs as-is
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function toPublicPath(internalPath) {
  // internalPath starts with "/"
  return path.join(rootDir, "public", internalPath.replace(/^\//, ""));
}

function candidatePathsFromInternal(internalPath) {
  const candidates = [];
  const p = normalizeRef(internalPath);
  if (!p) return candidates;

  // only validate local downloads-ish paths
  // (you can widen this later if needed)
  const isDownloads =
    p.startsWith("/assets/downloads/") || p.startsWith("/downloads/") || p.includes("/downloads/");

  if (!isDownloads) return candidates;

  const basename = path.basename(p);

  // 1) exact as referenced
  candidates.push(toPublicPath(p));

  // 2) legacy location by basename
  candidates.push(path.join(rootDir, "public", "downloads", basename));

  // 3) current standard by basename
  candidates.push(path.join(rootDir, "public", "assets", "downloads", basename));

  // de-dupe
  return Array.from(new Set(candidates));
}

async function loadContentlayerDownloads() {
  const contentlayerPath = path.join(rootDir, ".contentlayer", "generated", "index.mjs");

  if (!fs.existsSync(contentlayerPath)) {
    throw new Error(
      `Contentlayer output not found at ${contentlayerPath}. Run "pnpm run content:build" before downloads:validate.`
    );
  }

  // Use file:// URL to avoid weird Windows path edge cases
  const mod = await import(pathToFileURL(contentlayerPath).href);

  // Most Contentlayer2 setups export these
  const allDownloads = mod.allDownloads || mod.allDocuments || [];
  if (!Array.isArray(allDownloads)) return [];

  // If allDocuments is used, filter to download-like docs
  if (mod.allDownloads) return allDownloads;

  return allDownloads.filter((d) => {
    const t = String(d?._type || d?.type || d?.documentType || "").toLowerCase();
    return t === "download";
  });
}

function collectRefs(download) {
  // Pull from all common fields you use across the repo
  const refs = [];

  const fields = [
    "downloadFile",
    "file",
    "fileUrl",
    "downloadUrl",
    "pdfPath",
    "canonicalPdfHref",
  ];

  for (const f of fields) {
    const v = download?.[f];
    if (typeof v === "string" && v.trim()) {
      refs.push({ field: f, value: v.trim() });
    }
  }

  return refs;
}

function validateOne(download) {
  const slug = String(download?.slug || download?._raw?.flattenedPath || "").trim() || "(no-slug)";
  const title = String(download?.title || "").trim() || "(no-title)";

  const refs = collectRefs(download);

  // If no refs, nothing to validate
  if (!refs.length) return [];

  const errors = [];

  for (const { field, value } of refs) {
    const normalized = normalizeRef(value);

    // remote ref -> skip
    if (normalized === null) continue;

    const candidates = candidatePathsFromInternal(normalized);

    // If it isn't a downloads-ish path, skip quietly (keeps the validator narrow and stable)
    if (!candidates.length) continue;

    const found = candidates.some((p) => existsFileSafe(p));

    if (!found) {
      errors.push({
        slug,
        title,
        field,
        ref: value,
        normalized,
        checkedPaths: candidates,
      });
    }
  }

  return errors;
}

async function main() {
  console.log("Validating download files...\n");

  try {
    const downloads = await loadContentlayerDownloads();
    console.log(`Found ${downloads.length} downloads to validate\n`);

    const allErrors = [];

    for (const d of downloads) {
      allErrors.push(...validateOne(d));
    }

    if (allErrors.length > 0) {
      console.log("❌ Download validation failed.\n");
      console.log(`Missing assets: ${allErrors.length}\n`);

      for (const e of allErrors) {
        console.log(`- ${e.slug}`);
        console.log(`  Title: "${e.title}"`);
        console.log(`  Field: ${e.field}`);
        console.log(`  Ref:   ${e.ref}`);
        console.log(`  Norm:  ${e.normalized}`);
        console.log(`  Checked:`);
        e.checkedPaths.forEach((p) => console.log(`    - ${p}`));
        console.log();
      }

      process.exit(1);
    }

    console.log("✅ All download files validated successfully!\n");
  } catch (err) {
    console.error("Error while validating downloads:", err);
    process.exit(1);
  }
}

main();