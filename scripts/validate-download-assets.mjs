import fs from "node:fs";
import path from "node:path";

// Contentlayer generated output exists during build
import * as generated from "../contentlayer/generated/index.mjs";

function cleanStr(v) {
  return String(v ?? "").trim();
}

function ensureLeadingSlash(s) {
  return s.startsWith("/") ? s : `/${s}`;
}

function resolveDocDownloadUrl(doc) {
  const raw =
    cleanStr(doc?.downloadUrl) ||
    cleanStr(doc?.fileUrl) ||
    cleanStr(doc?.pdfPath) ||
    cleanStr(doc?.file) ||
    cleanStr(doc?.downloadFile);

  if (!raw) return null;

  const url = ensureLeadingSlash(raw);

  if (url.startsWith("/downloads/")) {
    return url.replace(/^\/downloads\//, "/assets/downloads/");
  }
  if (url.startsWith("/assets/downloads/")) return url;

  return url;
}

function publicUrlToFsPath(publicUrl) {
  if (!publicUrl || !publicUrl.startsWith("/")) return null;
  return path.join(process.cwd(), "public", publicUrl.replace(/^\/+/, ""));
}

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

const allDownloads = Array.isArray(generated.allDownloads) ? generated.allDownloads : [];

const errors = [];

for (const d of allDownloads) {
  const title = cleanStr(d?.title) || cleanStr(d?.slug) || "(untitled)";
  const url = resolveDocDownloadUrl(d);

  if (!url) {
    errors.push(`[Download] Missing download url fields for: ${title}`);
    continue;
  }

  // Only validate existence when it is under the known physical directory.
  if (url.startsWith("/assets/downloads/")) {
    const fsPath = publicUrlToFsPath(url);
    if (!fsPath || !exists(fsPath)) {
      errors.push(`[Download] File not found: ${url} (doc: ${title})`);
    }
  }
}

if (errors.length) {
  console.error("\n[validate-download-assets] FAILED\n");
  for (const e of errors) console.error(" - " + e);
  console.error("\nFix the file path or add the missing file under /public/assets/downloads.\n");
  process.exit(1);
}

console.log(`[validate-download-assets] OK — validated ${allDownloads.length} downloads`);