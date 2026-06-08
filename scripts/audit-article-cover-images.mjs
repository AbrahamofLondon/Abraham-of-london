/**
 * scripts/audit-article-cover-images.mjs
 *
 * Audits cover image usage across blog posts and editorial series parts.
 *
 * Checks:
 *   1. Published Post with coverImage has a file under /public
 *   2. Published EditorialSeriesPart with coverImage has a file under /public
 *   3. No cover path uses Windows backslashes
 *   4. No cover path is an external URL outside the allowed domain list
 *   5. No image over SIZE_WARN_BYTES (1 MB by default)
 *   6. Individual article has valid coverImage but renderer path supports it (route exists)
 *
 * Exit codes:
 *   0 — PASS (all checks pass, warns are allowed)
 *   1 — FAIL (at least one hard failure)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const CONTENT_DIR = path.join(ROOT, "content");
const SIZE_WARN_BYTES = 1024 * 1024; // 1 MB

const ALLOWED_REMOTE_PREFIXES = [
  "https://images.unsplash.com",
  "https://assets.vercel.com",
];

const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED    = "\x1b[31m";
const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";

// ─── Frontmatter parser (no external deps) ──────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const yaml = match[1];
  const result = {};
  for (const line of yaml.split(/\r?\n/)) {
    const m = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();
    // Strip inline comments and quotes
    val = val.replace(/#.*$/, "").trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

// ─── File walker ─────────────────────────────────────────────────────────────

function walkMdx(dir, collected = []) {
  if (!fs.existsSync(dir)) return collected;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMdx(full, collected);
    } else if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) {
      collected.push(full);
    }
  }
  return collected;
}

// ─── Cover field candidates (mirrors lib/image-resolver.ts) ─────────────────

const COVER_FIELDS = ["coverImage", "image", "heroImage", "thumbnail", "ogImage", "cover", "featuredImage", "coverArt"];

function extractCoverField(fm) {
  for (const field of COVER_FIELDS) {
    if (fm[field] && typeof fm[field] === "string" && fm[field].trim()) {
      return { field, value: fm[field].trim() };
    }
  }
  return null;
}

function isPublished(fm) {
  if (fm.draft === "true" || fm.draft === true) return false;
  if (fm.published === "false" || fm.published === false) return false;
  return true;
}

// ─── Validators ──────────────────────────────────────────────────────────────

function validateCoverPath(coverPath, filePath) {
  const issues = [];

  // Backslash check
  if (coverPath.includes("\\")) {
    issues.push({ level: "FAIL", msg: `Windows backslash in cover path: "${coverPath}"` });
  }

  if (coverPath.startsWith("/")) {
    // Local path — check file exists on disk
    const onDisk = path.join(PUBLIC_DIR, coverPath.replace(/^\//, ""));
    if (!fs.existsSync(onDisk)) {
      issues.push({ level: "FAIL", msg: `Missing file on disk: ${coverPath} (expected at ${path.relative(ROOT, onDisk)})` });
    } else {
      const stat = fs.statSync(onDisk);
      if (stat.size > SIZE_WARN_BYTES) {
        issues.push({ level: "WARN", msg: `Large image (${(stat.size / 1024).toFixed(0)} KB): ${coverPath}` });
      }
    }
  } else if (coverPath.startsWith("http://") || coverPath.startsWith("https://")) {
    // Remote — check against allowed list
    const allowed = ALLOWED_REMOTE_PREFIXES.some((prefix) => coverPath.startsWith(prefix));
    if (!allowed) {
      issues.push({ level: "WARN", msg: `External cover URL may not be in Next.js image domain list: "${coverPath}"` });
    }
  } else {
    issues.push({ level: "FAIL", msg: `Invalid cover path (not absolute local or remote): "${coverPath}"` });
  }

  return issues;
}

// ─── Main audit ──────────────────────────────────────────────────────────────

const results = {
  pass: 0,
  warn: 0,
  fail: 0,
  items: [],
};

function record(level, source, msg) {
  results.items.push({ level, source, msg });
  if (level === "FAIL") results.fail++;
  else if (level === "WARN") results.warn++;
  else results.pass++;
}

function auditDirectory(dir, label) {
  const files = walkMdx(dir);
  let withCover = 0;
  let withoutCover = 0;
  let missingAsset = 0;

  for (const filePath of files) {
    const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
    const content = fs.readFileSync(filePath, "utf-8");
    const fm = parseFrontmatter(content);

    if (!isPublished(fm)) continue;

    const cover = extractCoverField(fm);
    if (!cover) {
      withoutCover++;
      continue;
    }

    withCover++;
    const issues = validateCoverPath(cover.value, filePath);
    if (issues.length === 0) {
      record("PASS", rel, `${cover.field}: ${cover.value}`);
    } else {
      for (const issue of issues) {
        if (issue.level === "FAIL") missingAsset++;
        record(issue.level, rel, issue.msg);
      }
    }
  }

  return { total: files.length, withCover, withoutCover, missingAsset };
}

console.log(`\n${BOLD}Abraham of London — Article Cover Image Audit${RESET}\n`);
console.log(`Root: ${ROOT}\n`);

const blogStats = auditDirectory(path.join(CONTENT_DIR, "blog"), "Post (blog)");
const editorialSeriesStats = auditDirectory(path.join(CONTENT_DIR, "editorial-series"), "EditorialSeriesPart");
const editorialStats = auditDirectory(path.join(CONTENT_DIR, "editorials"), "Editorial");

// ─── Check renderer routes exist for individual articles ─────────────────────

const REQUIRED_ROUTES = [
  "pages/blog/[...slug].tsx",
  "pages/blog/series/[seriesSlug]/[partSlug].tsx",
  "pages/editorials/[slug].tsx",
  "pages/editorials/series/[seriesSlug]/[partSlug].tsx",
];

for (const route of REQUIRED_ROUTES) {
  const full = path.join(ROOT, route);
  if (!fs.existsSync(full)) {
    record("FAIL", route, `Required renderer route file missing: ${route}`);
  }
}

// ─── Check ArticleCoverImage component exists ─────────────────────────────────

const COMPONENT_PATH = "components/content/ArticleCoverImage.tsx";
if (!fs.existsSync(path.join(ROOT, COMPONENT_PATH))) {
  record("FAIL", COMPONENT_PATH, "ArticleCoverImage component file missing");
}

// ─── Verify wiring in renderer routes ─────────────────────────────────────────

const WIRING_CHECKS = [
  {
    route: "pages/blog/series/[seriesSlug]/[partSlug].tsx",
    pattern: /ArticleCoverImage/,
    label: "Blog series part renders ArticleCoverImage",
  },
  {
    route: "pages/editorials/[slug].tsx",
    pattern: /ArticleCoverImage/,
    label: "Standalone editorial renders ArticleCoverImage",
  },
  {
    route: "pages/editorials/series/[seriesSlug]/[partSlug].tsx",
    pattern: /ArticleCoverImage/,
    label: "Editorial series part renders ArticleCoverImage",
  },
];

for (const check of WIRING_CHECKS) {
  const full = path.join(ROOT, check.route);
  if (!fs.existsSync(full)) continue; // already reported above
  const content = fs.readFileSync(full, "utf-8");
  if (!check.pattern.test(content)) {
    record("FAIL", check.route, `${check.label} — ArticleCoverImage not found in renderer`);
  } else {
    record("PASS", check.route, check.label);
  }
}

// ─── Report ──────────────────────────────────────────────────────────────────

console.log("Content directories scanned:");
console.log(`  blog/            → ${blogStats.withCover} with cover, ${blogStats.withoutCover} without`);
console.log(`  editorial-series/→ ${editorialSeriesStats.withCover} with cover, ${editorialSeriesStats.withoutCover} without`);
console.log(`  editorials/      → ${editorialStats.withCover} with cover, ${editorialStats.withoutCover} without\n`);

const failures = results.items.filter((i) => i.level === "FAIL");
const warnings = results.items.filter((i) => i.level === "WARN");

if (failures.length) {
  console.log(`${RED}${BOLD}FAILURES (${failures.length}):${RESET}`);
  for (const f of failures) {
    console.log(`  ${RED}FAIL${RESET}  ${f.source}`);
    console.log(`        ${f.msg}`);
  }
  console.log("");
}

if (warnings.length) {
  console.log(`${YELLOW}${BOLD}WARNINGS (${warnings.length}):${RESET}`);
  for (const w of warnings) {
    console.log(`  ${YELLOW}WARN${RESET}  ${w.source}`);
    console.log(`        ${w.msg}`);
  }
  console.log("");
}

const total = results.fail + results.warn + results.pass;
const verdict = results.fail > 0 ? `${RED}${BOLD}FAIL${RESET}` : `${GREEN}${BOLD}PASS${RESET}`;
console.log(`Result: ${verdict}  (${results.fail} fail, ${results.warn} warn, ${results.pass} pass  /  ${total} checks)\n`);

process.exit(results.fail > 0 ? 1 : 0);
