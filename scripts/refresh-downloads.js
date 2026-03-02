/* eslint-disable no-console */
// scripts/refresh-downloads.js — Institutional Link & Asset Audit (Final, no collateral)
// Run: pnpm build:downloads (or tsx scripts/refresh-downloads.js)

import fs from "fs";
import path from "path";

/* ------------------------------------------------------------
   CONFIG
------------------------------------------------------------ */

const REPO_ROOT = process.cwd();
const CONTENT_DIR = path.join(REPO_ROOT, "content");
const PUBLIC_DIR = path.join(REPO_ROOT, "public");

// What routes are allowed to appear in MD/MDX links.
// Keep this aligned with your Next pages/routes and content types.
const AUTHORIZED_PREFIXES = [
  "/", // allow site root
  "/blog",
  "/shorts",
  "/books",
  "/canon",
  "/briefs",
  "/intelligence",
  "/dispatches",
  "/downloads",
  "/events",
  "/prints",
  "/resources",
  "/strategy",
  "/lexicon",
  "/vault",
  "/consulting",
  "/board",
  "/admin",
  "/legal",
  "/privacy",
  "/terms",
  "/sitemap",
  "/robots.txt",
  "/favicon.ico",
  "/assets", // public assets (images, pdfs, etc.)
  "/contact",
  "/contact-us",
  "/subscribe",
  "/newsletter",
  "/about",
  "/insights",
  "/inner-circle",           // ADDED
  "/diagrams",               // ADDED
  "/diagrams/",              // ADDED
  "/vault/downloads",        // ADDED
  "/vault/assets",           // ADDED
  "/vault/assets/downloads", // ADDED
];

// Allowed non-route schemes (always pass)
const ALLOWED_SCHEMES = [
  "http:",
  "https:",
  "mailto:",
  "tel:",
  "sms:",
  "data:",
];

// Asset path resolver candidates for "/assets/..." etc.
const PUBLIC_ASSET_ROOTS = [
  PUBLIC_DIR, // /<anything in public> maps to site root
  path.join(PUBLIC_DIR, "assets"),
  path.join(PUBLIC_DIR, "assets", "downloads"),
  path.join(PUBLIC_DIR, "downloads"),
];

/* ------------------------------------------------------------
   HELPERS
------------------------------------------------------------ */

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function walk(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) {
        const base = e.name.toLowerCase();
        if (
          base === "node_modules" ||
          base === ".git" ||
          base === ".next" ||
          base === ".contentlayer" ||
          base === "dist" ||
          base === "out" ||
          base === "tmp" ||
          base === "temp"
        ) continue;
        stack.push(full);
      } else if (e.isFile()) {
        out.push(full);
      }
    }
  }
  return out;
}

function relFromContent(absPath) {
  return absPath
    .replace(CONTENT_DIR, "")
    .replace(/^[\\/]+/, "")
    .replace(/\\/g, "/");
}

function normalizeHref(raw) {
  if (!raw) return "";

  const s = String(raw).trim();

  if (!s || s === "#" || s.startsWith("#")) return "";

  try {
    const u = new URL(s);
    if (ALLOWED_SCHEMES.includes(u.protocol)) return s;
  } catch {
    // not an absolute URL — continue
  }

  const noHash = s.split("#")[0];
  const noQuery = noHash.split("?")[0];

  let p = noQuery.trim();
  if (!p.startsWith("/")) p = "/" + p;

  p = p.replace(/\/{2,}/g, "/");

  if (p.length > 1) p = p.replace(/\/+$/g, "");

  return p;
}

function isAuthorizedInternalPath(p) {
  if (!p) return true;
  if (p === "/") return true;

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(p)) return true;

  if (p.startsWith("/assets")) return true;

  return AUTHORIZED_PREFIXES.some((pre) => {
    if (pre === "/") return p === "/";
    return p === pre || p.startsWith(pre + "/");
  });
}

function extractLinks(fileText) {
  const links = [];

  const mdLinkRe = /\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = mdLinkRe.exec(fileText))) {
    links.push(m[1]);
  }

  const hrefRe = /\bhref\s*=\s*(?:"([^"]+)"|'([^']+)')/g;
  while ((m = hrefRe.exec(fileText))) {
    links.push(m[1] || m[2]);
  }

  const srcRe = /\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')/g;
  while ((m = srcRe.exec(fileText))) {
    links.push(m[1] || m[2]);
  }

  return links;
}

function resolvePublicFileFromHref(href) {
  const p = href.startsWith("/") ? href.slice(1) : href;

  const direct = path.join(PUBLIC_DIR, p);
  if (isFile(direct)) return direct;

  for (const root of PUBLIC_ASSET_ROOTS) {
    const candidate = path.join(root, p.replace(/^assets[\\/]/, ""));
    if (isFile(candidate)) return candidate;
  }

  return null;
}

/* ------------------------------------------------------------
   MAIN
------------------------------------------------------------ */

console.log("\n🛡️  [ABRAHAM-OF-LONDON]: Institutional Integrity Audit\n");

const all = walk(CONTENT_DIR).filter((f) => /\.(md|mdx)$/i.test(f));
let filesScanned = 0;

const regressions = [];
const missingAssets = [];

for (const f of all) {
  filesScanned++;
  let text = "";
  try {
    text = fs.readFileSync(f, "utf8");
  } catch {
    continue;
  }

  const rel = relFromContent(f);
  const rawLinks = extractLinks(text);

  for (const raw of rawLinks) {
    const normalized = normalizeHref(raw);

    if (!normalized) continue;
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(normalized)) continue;

    if (!isAuthorizedInternalPath(normalized)) {
      regressions.push({
        file: rel,
        raw,
        normalized,
      });
      continue;
    }

    const looksLikeAsset =
      normalized.startsWith("/assets/") ||
      /\.(pdf|png|jpg|jpeg|webp|svg|gif|mp4|mp3|zip)$/i.test(normalized);

    if (looksLikeAsset) {
      const resolved = resolvePublicFileFromHref(normalized);
      if (!resolved) {
        missingAssets.push({
          file: rel,
          ref: normalized,
        });
      }
    }
  }
}

/* ------------------------------------------------------------
   REPORT
------------------------------------------------------------ */

for (const r of regressions) {
  console.error(
    `❌ [LINK_REGRESSION] ${r.file}: "${r.raw}" is unauthorized.\n   Normalized as: ${r.normalized}`
  );
}

for (const m of missingAssets) {
  console.warn(`⚠️  [MISSING_ASSET] ${m.file} -> Reference: ${m.ref}`);
}

console.log("\n--- 📊 AUDIT REPORT ---");
console.log(`Files Scanned: ${filesScanned} | Link Regressions: ${regressions.length} | Missing Assets: ${missingAssets.length}`);

if (regressions.length > 0) {
  console.log(`\n🚨 REJECTED: ${regressions.length} Link Regressions found.`);
  console.log("Fix the unauthorized prefixes (or add them to AUTHORIZED_PREFIXES if they are truly valid routes).");
  process.exit(1);
}

console.log("\n✅ ACCEPTED: No link regressions detected.");
console.log("— Audit complete.\n");
process.exit(0);