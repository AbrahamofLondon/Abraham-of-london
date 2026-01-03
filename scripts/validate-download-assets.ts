// scripts/validate-download-assets.mjs
// Validates that all referenced download assets actually exist in /public.
// Hardened to NEVER scandir files (e.g., .zip) and to survive Windows EPERM quirks.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const CONTENT_DIRS = [
  path.join(rootDir, "content", "downloads"),
  path.join(rootDir, "content", "resources"),
  path.join(rootDir, "content", "books"),
  path.join(rootDir, "content", "canon"),
];

const PUBLIC_DIR = path.join(rootDir, "public");

// Fields we consider “download asset pointers”
const DOWNLOAD_FIELD_PATTERNS = [
  /canonicalPdfHref:\s*["']([^"']+)["']/g,
  /downloadUrl:\s*["']([^"']+)["']/g,
  /fileUrl:\s*["']([^"']+)["']/g,
  /pdfPath:\s*["']([^"']+)["']/g,
  /^\s*file:\s*["']([^"']+)["']/gm,
  /downloadFile:\s*["']([^"']+)["']/g,
];

// Also catch bare string refs like "/assets/downloads/foo.pdf"
const BARE_DOWNLOAD_REF = /["'](\/(?:assets\/)?downloads\/[^"']+)["']/g;

function isMdxOrMd(p) {
  return p.endsWith(".mdx") || p.endsWith(".md");
}

function normalizeRefToPublicPath(ref) {
  if (!ref || typeof ref !== "string") return null;

  // ignore remote links
  if (/^https?:\/\//i.test(ref)) return null;

  // strip query/hash
  const clean = ref.split("#")[0].split("?")[0];

  // only care about downloads-ish paths
  if (!clean.startsWith("/downloads/") && !clean.startsWith("/assets/downloads/")) return null;

  // normalize legacy /downloads -> /assets/downloads
  const normalized = clean.startsWith("/downloads/")
    ? clean.replace(/^\/downloads\//, "/assets/downloads/")
    : clean;

  // turn "/assets/downloads/x.pdf" into "<repo>/public/assets/downloads/x.pdf"
  return path.join(PUBLIC_DIR, normalized.replace(/^\//, ""));
}

function safeStat(p) {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
}

function safeReadDir(dir) {
  try {
    const st = safeStat(dir);
    if (!st || !st.isDirectory()) return [];
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    // swallow EPERM/ENOTDIR/etc
    return [];
  }
}

function walk(dir, out = []) {
  const entries = safeReadDir(dir);
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(full, out);
    } else if (ent.isFile() && (full.endsWith(".mdx") || full.endsWith(".md"))) {
      out.push(full);
    }
  }
  return out;
}

function extractRefsFromFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const refs = new Set();

  for (const re of DOWNLOAD_FIELD_PATTERNS) {
    let m;
    while ((m = re.exec(content)) !== null) {
      if (m[1]) refs.add(m[1]);
    }
  }

  let b;
  while ((b = BARE_DOWNLOAD_REF.exec(content)) !== null) {
    if (b[1]) refs.add(b[1]);
  }

  return Array.from(refs);
}

function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Validate Download Assets");
  console.log("═══════════════════════════════════════════════════════");

  const files = CONTENT_DIRS.flatMap((d) => (fs.existsSync(d) ? walk(d) : []));
  console.log(`Scanning content files: ${files.length}`);

  const missing = [];
  const checked = new Set();

  for (const f of files) {
    if (!isMdxOrMd(f)) continue;

    const refs = extractRefsFromFile(f);
    for (const ref of refs) {
      const publicPath = normalizeRefToPublicPath(ref);
      if (!publicPath) continue;

      // de-dupe checks
      if (checked.has(publicPath)) continue;
      checked.add(publicPath);

      const st = safeStat(publicPath);
      if (!st || !st.isFile()) {
        missing.push({ ref, publicPath, from: path.relative(rootDir, f) });
      }
    }
  }

  if (missing.length) {
    console.log("\n❌ Missing download assets:");
    for (const m of missing.slice(0, 50)) {
      console.log(`- ref: ${m.ref}`);
      console.log(`  expected: ${m.publicPath}`);
      console.log(`  from: ${m.from}\n`);
    }
    if (missing.length > 50) {
      console.log(`...and ${missing.length - 50} more`);
    }
    process.exit(1);
  }

  console.log("\n✅ All referenced download assets exist.");
  console.log("═══════════════════════════════════════════════════════\n");
}

main();
