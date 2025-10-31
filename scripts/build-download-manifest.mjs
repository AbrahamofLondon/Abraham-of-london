// scripts/build-download-manifest.mjs
// Robust, JSON-safe manifest builder for /public/downloads
// Node ESM version (.mjs). Works whether or not "type":"module" is set.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// -------------------------------------------------------------------------------------
// Setup
// -------------------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = process.cwd();
const downloadsDir = path.join(projectRoot, "public", "downloads");
const manifestPath = path.join(downloadsDir, "manifest.json");

// Allowed file extensions to include in the manifest
const ALLOWED_EXTS = new Set([
  ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx",
  ".txt", ".md", ".zip", ".rar", ".7z",
  ".jpg", ".jpeg", ".png", ".webp", ".svg"
]);

// -------------------------------------------------------------------------------------
// Utilities
// -------------------------------------------------------------------------------------
const sanitize = (s) =>
  String(s ?? "")
    .replace(/\r/g, "")
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u001F]/g, " ") // control chars → space
    .trim();

const slugify = (s) =>
  sanitize(s)
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")      // drop extension at end
    .replace(/[_\s]+/g, "-")           // underscores/spaces -> dash
    .replace(/[^a-z0-9-]+/g, "-")      // non-word -> dash
    .replace(/-+/g, "-")               // collapse dashes
    .replace(/^-|-$/g, "");            // trim leading/trailing dash

const titleize = (s) => {
  const base = sanitize(s).replace(/\.[a-z0-9]+$/i, "");
  return base
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0] ? w[0].toUpperCase() + w.slice(1) : w)
    .join(" ");
};

function safeEntry(entry) {
  // Ensure every string field is clean; keep only expected keys
  return {
    title: sanitize(entry.title),
    slug: sanitize(entry.slug),
    filename: sanitize(entry.filename),
    url: sanitize(entry.url),
    ext: sanitize(entry.ext),
    sizeBytes: Number.isFinite(entry.sizeBytes) ? entry.sizeBytes : undefined,
    mtime: sanitize(entry.mtime),
    category: sanitize(entry.category || ""), // optional
    type: sanitize(entry.type || ""),         // optional
    author: sanitize(entry.author || ""),     // optional
    date: sanitize(entry.date || ""),         // optional (ISO string)
  };
}

// Walk a single directory (non-recursive by default)
function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => path.join(dir, d.name));
}

// Optional: make this recursive if you keep subfolders under /downloads
function listFilesRecursive(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

// -------------------------------------------------------------------------------------
// Build manifest
// -------------------------------------------------------------------------------------
(function main() {
  if (!fs.existsSync(downloadsDir)) {
    console.error(`[manifest] ERROR: Directory not found: ${downloadsDir}`);
    process.exit(1);
  }

  // Choose one: flat or recursive. Most repos just need flat:
  // const files = listFiles(downloadsDir);
  const files = listFilesRecursive(downloadsDir);

  const items = [];
  for (const absPath of files) {
    const rel = path.relative(downloadsDir, absPath).replaceAll("\\", "/"); // windows safe
    // Skip manifest.json itself
    if (rel.toLowerCase() === "manifest.json") continue;

    const ext = path.extname(absPath).toLowerCase();
    if (!ALLOWED_EXTS.has(ext)) continue;

    const stat = fs.statSync(absPath);
    const filename = path.basename(absPath);
    const slug = slugify(filename);
    const title = titleize(filename);

    // URL as served by Next.js (everything in /public is web-root)
    const url = "/downloads/" + rel;

    items.push({
      title,
      slug,
      filename,
      url,
      ext,
      sizeBytes: stat.size,
      mtime: new Date(stat.mtime).toISOString(),
      // You can add any project-specific defaults here:
      author: "Abraham of London",
      // category: "Downloads",
      // type: "Download",
      // date: new Date().toISOString().slice(0,10),
    });
  }

  const manifest = items.map(safeEntry);

  // Write JSON safely
  const out = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(manifestPath, out, "utf8");

  // Validate we wrote proper JSON
  try {
    JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (e) {
    console.error("[manifest] Wrote invalid JSON. Error:", e.message);
    process.exit(1);
  }

  console.log(`[manifest] wrote ${manifestPath} (${manifest.length} items)`);
})();
