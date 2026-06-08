/**
 * scripts/audit-editorial-series-cover-layout.mjs
 *
 * Verifies the editorial series reader layout:
 *
 *  1. Editorial series route supports coverImage (imports ArticleCoverImage)
 *  2. Editorial series route does NOT import ClassicBlogReader
 *  3. Editorial series route does NOT import DirectorateOversight
 *  4. Cover renders before body (source-order check)
 *  5. No fallback image forced when cover is absent (null-guard present)
 *  6. Props type includes coverImage field
 *  7. getStaticProps extracts coverImage from doc
 *  8. Editorial series parts — audit cover field presence by series
 *  9. ArticleCoverImage component exists and accepts maxWidth prop
 *
 * Exit codes:
 *   0 — PASS
 *   1 — FAIL
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED    = "\x1b[31m";
const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";
const DIM    = "\x1b[2m";

let failCount = 0;
let warnCount = 0;
let passCount = 0;

function pass(label) { passCount++; console.log(`  ${GREEN}PASS${RESET}  ${label}`); }
function warn(label) { warnCount++; console.log(`  ${YELLOW}WARN${RESET}  ${label}`); }
function fail(label) { failCount++; console.log(`  ${RED}FAIL${RESET}  ${label}`); }

function read(rel) {
  const full = path.join(ROOT, rel);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf-8") : null;
}
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }

console.log(`\n${BOLD}Abraham of London — Editorial Series Cover Layout Audit${RESET}\n`);

const PART_PAGE = "pages/editorials/series/[seriesSlug]/[partSlug].tsx";
const partSrc = read(PART_PAGE);

// ─── 1. Imports ArticleCoverImage ─────────────────────────────────────────────

if (!partSrc) {
  fail(`${PART_PAGE} not found`);
} else {
  if (/import ArticleCoverImage/.test(partSrc)) {
    pass("Editorial series part imports ArticleCoverImage");
  } else {
    fail("Editorial series part does NOT import ArticleCoverImage");
  }

  // ─── 2. Does NOT import ClassicBlogReader ──────────────────────────────

  if (/import ClassicBlogReader/.test(partSrc)) {
    fail("Editorial series part imports ClassicBlogReader (contamination)");
  } else {
    pass("Editorial series part does not import ClassicBlogReader");
  }

  // ─── 3. Does NOT import DirectorateOversight ───────────────────────────

  if (/import DirectorateOversight/.test(partSrc)) {
    fail("Editorial series part imports DirectorateOversight");
  } else {
    pass("Editorial series part does not import DirectorateOversight");
  }

  // ─── 4. Cover appears before body (source-order check) ────────────────

  const coverIdx = partSrc.indexOf("{coverImage ?");
  const bodyIdx  = partSrc.indexOf("mind-clay-reader-body");
  if (coverIdx !== -1 && bodyIdx !== -1) {
    if (coverIdx < bodyIdx) {
      pass("Cover rendered before body in editorial series part");
    } else {
      fail("Cover rendered AFTER body in editorial series part");
    }
  } else if (coverIdx === -1) {
    warn("No coverImage conditional render found in editorial series part (may render nothing — correct if all parts lack covers)");
  }

  // ─── 5. Null-guard — no forced fallback ───────────────────────────────

  if (/coverImage\s*\?/.test(partSrc)) {
    pass("Cover section is null-guarded (no fallback forced)");
  } else {
    fail("No null-guard on coverImage — may force fallback render");
  }

  // ─── 6. Props type includes coverImage ────────────────────────────────

  if (/coverImage:\s*string\s*\|\s*null/.test(partSrc)) {
    pass("Props type includes coverImage: string | null");
  } else {
    fail("Props type missing coverImage field");
  }

  // ─── 7. getStaticProps extracts coverImage ────────────────────────────

  if (/rawCoverImage/.test(partSrc)) {
    pass("getStaticProps extracts rawCoverImage from doc");
  } else {
    fail("getStaticProps does not extract coverImage");
  }
}

// ─── 8. Scan editorial-series parts — report coverage ────────────────────────

console.log(`\n${BOLD}Editorial series cover field audit:${RESET}`);

const EDITORIAL_SERIES_DIR = path.join(ROOT, "content/editorial-series");
const COVER_FIELDS = ["coverImage","ogImage","heroImage","thumbnail","cover","featuredImage"];

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim().replace(/#.*$/, "").trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    result[m[1].trim()] = val;
  }
  return result;
}

if (fs.existsSync(EDITORIAL_SERIES_DIR)) {
  const series = fs.readdirSync(EDITORIAL_SERIES_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  let totalParts = 0;
  let partsWithCover = 0;

  for (const s of series) {
    const sDir = path.join(EDITORIAL_SERIES_DIR, s);
    const mdxFiles = fs.readdirSync(sDir).filter(f => /\.(md|mdx)$/i.test(f));
    let seriesCover = 0;

    for (const f of mdxFiles) {
      const fm = parseFrontmatter(fs.readFileSync(path.join(sDir, f), "utf-8"));
      totalParts++;
      const hasCover = COVER_FIELDS.some(field => fm[field]?.trim());
      if (hasCover) { seriesCover++; partsWithCover++; }
    }

    const status = seriesCover > 0
      ? `${GREEN}${seriesCover}/${mdxFiles.length} have cover${RESET}`
      : `${DIM}0/${mdxFiles.length} — no cover images set (intentional)${RESET}`;
    console.log(`  ${s}: ${status}`);
  }

  const summary = partsWithCover === 0
    ? `${YELLOW}ℹ  All ${totalParts} editorial-series parts have no coverImage. No assets exist for these series. Renderer renders nothing — correct behavior.${RESET}`
    : `${GREEN}${partsWithCover}/${totalParts} parts have cover images${RESET}`;
  console.log(`\n  Summary: ${summary}\n`);
}

// ─── 9. ArticleCoverImage accepts maxWidth ────────────────────────────────────

const articleCoverSrc = read("components/content/ArticleCoverImage.tsx");
if (!articleCoverSrc) {
  fail("components/content/ArticleCoverImage.tsx not found");
} else {
  if (/maxWidth/.test(articleCoverSrc)) {
    pass("ArticleCoverImage accepts maxWidth prop");
  } else {
    fail("ArticleCoverImage does not have maxWidth prop");
  }
  if (/maxHeight/.test(articleCoverSrc)) {
    pass("ArticleCoverImage accepts maxHeight prop");
  } else {
    warn("ArticleCoverImage has no maxHeight prop");
  }
  if (/objectFit/.test(articleCoverSrc)) {
    pass("ArticleCoverImage accepts objectFit prop");
  } else {
    warn("ArticleCoverImage has no objectFit prop");
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

const total   = failCount + warnCount + passCount;
const verdict = failCount > 0 ? `${RED}${BOLD}FAIL${RESET}` : `${GREEN}${BOLD}PASS${RESET}`;
console.log(`Result: ${verdict}  (${failCount} fail, ${warnCount} warn, ${passCount} pass  /  ${total} checks)\n`);
process.exit(failCount > 0 ? 1 : 0);
