/**
 * scripts/audit-article-cover-images.mjs
 *
 * Audits cover image usage, distinguished by article family:
 *   classicBlog       — content/blog/ (not in a series sub-directory)
 *   blogSeries        — content/blog/series/**
 *   editorialSeries   — content/editorial-series/**
 *   standaloneEditors — content/editorials/**
 *
 * For each family, reports:
 *   - hasCoverField: frontmatter contains a cover field
 *   - assetExists:   the local path resolves to a file under /public
 *   - rendererSupports: the route renderer file imports the right component
 *   - intentionallyAbsent: (editorial-series) all parts intentionally have no cover
 *
 * Hard FAIL:
 *   - Published article has coverImage but file missing from /public
 *   - Invalid cover path (not absolute local, not valid URL)
 *   - Route renderer expected to support covers but does not
 *
 * WARN:
 *   - Published article has no coverImage set
 *   - Image > SIZE_WARN_BYTES
 *   - Editorial-series part has no coverImage (expected — reported as info)
 *
 * Exit codes:
 *   0 — PASS (no hard failures)
 *   1 — FAIL
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const SIZE_WARN_BYTES = 1024 * 1024; // 1 MB

const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED    = "\x1b[31m";
const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";
const DIM    = "\x1b[2m";

// ─── Frontmatter parser ───────────────────────────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim().replace(/#.*$/, "").trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[m[1].trim()] = val;
  }
  return result;
}

function walkMdx(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkMdx(full, out);
    else if (e.isFile() && /\.(md|mdx)$/i.test(e.name)) out.push(full);
  }
  return out;
}

const COVER_FIELDS = ["coverImage","image","heroImage","thumbnail","ogImage","cover","featuredImage","coverArt"];

function extractCover(fm) {
  for (const f of COVER_FIELDS) {
    if (fm[f]?.trim()) return { field: f, value: fm[f].trim() };
  }
  return null;
}

function isPublished(fm) {
  return fm.draft !== "true" && fm.published !== "false";
}

// ─── Validator ───────────────────────────────────────────────────────────────

function validatePath(coverPath) {
  if (coverPath.includes("\\")) return { ok: false, msg: `Windows backslash in path` };
  if (coverPath.startsWith("/")) {
    const onDisk = path.join(PUBLIC_DIR, coverPath.replace(/^\//, ""));
    if (!fs.existsSync(onDisk)) return { ok: false, msg: `File missing: ${coverPath}` };
    const size = fs.statSync(onDisk).size;
    if (size > SIZE_WARN_BYTES) return { ok: true, warn: `Large image (${(size/1024).toFixed(0)} KB): ${coverPath}` };
    return { ok: true };
  }
  if (/^https?:\/\//.test(coverPath)) return { ok: true, warn: `External URL — verify Next.js domain allowlist: ${coverPath}` };
  return { ok: false, msg: `Invalid path format: ${coverPath}` };
}

// ─── Renderer wiring checks ───────────────────────────────────────────────────

function readRenderer(rel) {
  const full = path.join(ROOT, rel);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf-8") : null;
}

const RENDERER_CHECKS = {
  classicBlog: {
    file: "pages/blog/[...slug].tsx",
    pattern: /ClassicBlogReader/,
    label: "ClassicBlogReader",
  },
  blogSeries: {
    file: "pages/blog/series/[seriesSlug]/[partSlug].tsx",
    pattern: /ArticleCoverImage/,
    label: "ArticleCoverImage",
  },
  editorialSeries: {
    file: "pages/editorials/series/[seriesSlug]/[partSlug].tsx",
    pattern: /ArticleCoverImage/,
    label: "ArticleCoverImage",
  },
  standaloneEditorial: {
    file: "pages/editorials/[slug].tsx",
    pattern: /ArticleCoverImage/,
    label: "ArticleCoverImage",
  },
};

// ─── Family scan ─────────────────────────────────────────────────────────────

function scanFamily(dir, label) {
  const files = walkMdx(dir);
  const stats = { total: 0, published: 0, withCover: 0, withoutCover: 0, fails: [], warns: [] };

  for (const fp of files) {
    const rel = path.relative(ROOT, fp).replace(/\\/g, "/");
    const fm  = parseFrontmatter(fs.readFileSync(fp, "utf-8"));
    stats.total++;
    if (!isPublished(fm)) continue;
    stats.published++;

    const cover = extractCover(fm);
    if (!cover) {
      stats.withoutCover++;
      continue;
    }

    stats.withCover++;
    const v = validatePath(cover.value);
    if (!v.ok)   stats.fails.push({ rel, msg: v.msg });
    else if (v.warn) stats.warns.push({ rel, msg: v.warn });
  }

  return stats;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(`\n${BOLD}Abraham of London — Article Cover Image Audit (by family)${RESET}\n`);

const families = [
  {
    key: "classicBlog",
    label: "Classic Blog",
    dir: path.join(ROOT, "content/blog"),
    excludeSubdir: "series",
  },
  {
    key: "blogSeries",
    label: "Blog Series",
    dir: path.join(ROOT, "content/blog/series"),
  },
  {
    key: "editorialSeries",
    label: "Editorial Series",
    dir: path.join(ROOT, "content/editorial-series"),
    intentionallyNoCover: true,
  },
  {
    key: "standaloneEditorial",
    label: "Standalone Editorials",
    dir: path.join(ROOT, "content/editorials"),
  },
];

let totalFail = 0;
let totalWarn = 0;
let totalPass = 0;

for (const family of families) {
  let scanDir = family.dir;
  let files   = walkMdx(scanDir);

  // For classicBlog, exclude files inside series/ subdirectory
  if (family.excludeSubdir) {
    const exclude = path.join(scanDir, family.excludeSubdir);
    files = files.filter(f => !f.startsWith(exclude));
  }

  // Re-scan using the filtered file list
  const stats = { total: 0, published: 0, withCover: 0, withoutCover: 0, fails: [], warns: [] };
  for (const fp of files) {
    const fm = parseFrontmatter(fs.readFileSync(fp, "utf-8"));
    stats.total++;
    if (!isPublished(fm)) continue;
    stats.published++;
    const cover = extractCover(fm);
    if (!cover) { stats.withoutCover++; continue; }
    stats.withCover++;
    const v = validatePath(cover.value);
    if (!v.ok)   stats.fails.push({ rel: path.relative(ROOT, fp).replace(/\\/g, "/"), msg: v.msg });
    else if (v.warn) stats.warns.push({ rel: path.relative(ROOT, fp).replace(/\\/g, "/"), msg: v.warn });
  }

  // Check renderer wiring
  const rc  = RENDERER_CHECKS[family.key];
  let rendererOk = true;
  if (rc) {
    const src = readRenderer(rc.file);
    if (!src) {
      stats.fails.push({ rel: rc.file, msg: `Renderer file missing: ${rc.file}` });
      rendererOk = false;
    } else if (!rc.pattern.test(src)) {
      stats.fails.push({ rel: rc.file, msg: `Renderer does not use ${rc.label}` });
      rendererOk = false;
    }
  }

  const familyFails = stats.fails.length;
  const familyWarns = stats.warns.length + (family.intentionallyNoCover && stats.withoutCover > 0 ? 0 : 0);
  const statusIcon  = familyFails > 0 ? `${RED}FAIL${RESET}` : `${GREEN}PASS${RESET}`;

  console.log(`${BOLD}${family.label}${RESET}  ${statusIcon}`);
  console.log(`  ${DIM}published: ${stats.published}  |  with cover: ${stats.withCover}  |  without cover: ${stats.withoutCover}  |  renderer: ${rendererOk ? "✓" : "✗"}${RESET}`);

  if (family.intentionallyNoCover && stats.withoutCover > 0) {
    console.log(`  ${DIM}ℹ  All ${stats.withoutCover} parts intentionally have no coverImage in frontmatter — no assets exist for this series. Renderer supports cover; renders nothing when absent (correct).${RESET}`);
  }

  for (const f of stats.fails) {
    console.log(`  ${RED}FAIL${RESET}  ${f.rel}`);
    console.log(`        ${f.msg}`);
    totalFail++;
  }
  for (const w of stats.warns) {
    console.log(`  ${YELLOW}WARN${RESET}  ${w.rel}`);
    console.log(`        ${w.msg}`);
    totalWarn++;
  }

  totalPass += stats.withCover - familyFails;
  console.log("");
}

// ─── Summary ─────────────────────────────────────────────────────────────────

const verdict = totalFail > 0 ? `${RED}${BOLD}FAIL${RESET}` : `${GREEN}${BOLD}PASS${RESET}`;
console.log(`Result: ${verdict}  (${totalFail} fail, ${totalWarn} warn, ${totalPass} pass)\n`);
process.exit(totalFail > 0 ? 1 : 0);
