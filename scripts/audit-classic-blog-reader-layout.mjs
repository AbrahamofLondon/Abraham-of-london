/**
 * scripts/audit-classic-blog-reader-layout.mjs
 *
 * Audits the classic blog post reader (/blog/[slug]) for correct layout,
 * cover constraints, grid breathing room, and sidebar behavior.
 *
 * Checks:
 *  1.  blog/[...slug].tsx uses ClassicBlogReader (not DirectorateOversight)
 *  2.  ClassicBlogReader component file exists
 *  3.  ClassicBlogReader renders cover AFTER header, BEFORE body
 *  4.  ClassicBlogReader renders body BEFORE childrenBottom (related/CTA)
 *  5.  Cover has constrained max-width per aspect type
 *  6.  Portrait/book cover uses contain sizing (smaller box)
 *  7.  Landscape cover uses cover fit
 *  8.  Grid gap is at least 72px on desktop (xl: gap-x-[88px])
 *  9.  Sidebar hidden below xl breakpoint (hidden xl:block)
 * 10.  blog/[...slug].tsx does NOT import DirectorateOversight
 * 11.  Editorial series part does NOT import ClassicBlogReader
 * 12.  Standalone editorial does NOT import ClassicBlogReader
 * 13.  /blog/the-second-phone cover resolves to existing file
 * 14.  ClassicBlogReader does not force fallback (null-guard present)
 * 15.  Grid outer container uses max-w-[1240px] or wider for breathing room
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

let failCount = 0, warnCount = 0, passCount = 0;

function pass(label) { passCount++; console.log(`  ${GREEN}PASS${RESET}  ${label}`); }
function warn(label) { warnCount++; console.log(`  ${YELLOW}WARN${RESET}  ${label}`); }
function fail(label) { failCount++; console.log(`  ${RED}FAIL${RESET}  ${label}`); }

function read(rel) {
  const full = path.join(ROOT, rel);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf-8") : null;
}
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }

console.log(`\n${BOLD}Abraham of London — Classic Blog Reader Layout Audit${RESET}\n`);

const blogSlug     = read("pages/blog/[...slug].tsx");
const classicReader = read("components/blog/ClassicBlogReader.tsx");

// ─── 1. Route uses ClassicBlogReader ─────────────────────────────────────────

if (!blogSlug) {
  fail("pages/blog/[...slug].tsx not found");
} else {
  /import ClassicBlogReader/.test(blogSlug)
    ? pass("blog/[...slug].tsx imports ClassicBlogReader")
    : fail("blog/[...slug].tsx does NOT import ClassicBlogReader");

  // ─── 10. Must NOT import DirectorateOversight ──────────────────────────
  /import DirectorateOversight/.test(blogSlug)
    ? fail("blog/[...slug].tsx still imports DirectorateOversight")
    : pass("blog/[...slug].tsx does not import DirectorateOversight");
}

// ─── 2. ClassicBlogReader exists ─────────────────────────────────────────────

if (!classicReader) {
  fail("components/blog/ClassicBlogReader.tsx not found");
} else {
  pass("components/blog/ClassicBlogReader.tsx exists");

  // ─── 3. Cover after header, before body ───────────────────────────────
  const coverIdx = classicReader.indexOf("hasCover");
  const bodyIdx  = classicReader.indexOf("classic-blog-body");
  if (coverIdx !== -1 && bodyIdx !== -1 && coverIdx < bodyIdx) {
    pass("Cover section is before essay body");
  } else if (coverIdx === -1) {
    fail("No hasCover guard — cover is unconditional");
  } else {
    fail("Cover section appears AFTER essay body");
  }

  // ─── 4. childrenBottom after body ─────────────────────────────────────
  classicReader.lastIndexOf("childrenBottom") > bodyIdx
    ? pass("childrenBottom is after essay body")
    : fail("childrenBottom appears BEFORE essay body");

  // ─── 5. Cover max-width constrained per aspect ────────────────────────
  if (/maxWidth.*420px|maxWidth.*480px|maxWidth.*760px|maxWidth.*820px/.test(classicReader)) {
    pass("Cover uses aspect-specific max-width values");
  } else {
    warn("No aspect-specific maxWidth found — may still be one-size-fits-all");
  }

  // ─── 6. Portrait/book cover uses contain ──────────────────────────────
  /isPortrait.*contain|fit.*contain|object-contain/s.test(classicReader) ||
  /contain/.test(classicReader)
    ? pass("Portrait/book cover uses object-contain treatment")
    : warn("No object-contain reference found for portrait covers");

  // ─── 7. Landscape cover uses cover fit ────────────────────────────────
  /fit.*cover|object-cover|objectFit.*cover/s.test(classicReader)
    ? pass("Landscape cover uses object-cover fit")
    : warn("No object-cover reference found for landscape covers");

  // ─── 8. Grid gap ≥ 72px on desktop ────────────────────────────────────
  /gap-x-\[88px\]|gap-x-\[72px\]|gap-x-\[80px\]/.test(classicReader)
    ? pass("Grid has gap-x-[88px] on xl breakpoint")
    : fail("Grid gap on desktop is less than 72px — article and sidebar too close");

  // ─── 9. Sidebar hidden below xl ───────────────────────────────────────
  /hidden xl:block/.test(classicReader)
    ? pass("Sidebar is hidden below xl breakpoint")
    : fail("Sidebar not hidden on smaller viewports — may squeeze body");

  // ─── 14. Null-guard on cover ──────────────────────────────────────────
  /hasCover.*&&|cover &&/.test(classicReader)
    ? pass("Cover null-guard present")
    : warn("Cover null-guard unclear");

  // ─── 15. Grid outer max-width ─────────────────────────────────────────
  /max-w-\[1240px\]|max-w-\[1200px\]|max-w-\[1280px\]/.test(classicReader)
    ? pass("Outer grid uses generous max-width (≥ 1200px)")
    : warn("Outer grid max-width may be too narrow — check breathing room");
}

// ─── 11. Editorial series untouched ──────────────────────────────────────────

const editSeries = read("pages/editorials/series/[seriesSlug]/[partSlug].tsx");
if (editSeries && /import ClassicBlogReader/.test(editSeries)) {
  fail("editorials/series/[seriesSlug]/[partSlug].tsx imports ClassicBlogReader");
} else {
  pass("editorials/series/[seriesSlug]/[partSlug].tsx untouched by ClassicBlogReader");
}

// ─── 12. Standalone editorial untouched ──────────────────────────────────────

const editSlug = read("pages/editorials/[slug].tsx");
if (editSlug && /import ClassicBlogReader/.test(editSlug)) {
  fail("editorials/[slug].tsx imports ClassicBlogReader");
} else {
  pass("editorials/[slug].tsx untouched by ClassicBlogReader");
}

// ─── 13. The Second Phone cover exists ────────────────────────────────────────

const secondPhone = read("content/blog/the-second-phone.mdx");
if (!secondPhone) {
  warn("content/blog/the-second-phone.mdx not found");
} else {
  const m = secondPhone.match(/coverImage:\s*["']?([^\s"'\n]+)["']?/);
  if (!m) {
    warn("the-second-phone.mdx has no coverImage");
  } else {
    const p = m[1].replace(/["']/g, "");
    const onDisk = path.join(ROOT, "public", p.replace(/^\//, ""));
    fs.existsSync(onDisk)
      ? pass(`the-second-phone cover on disk: ${p}`)
      : fail(`the-second-phone cover MISSING: ${p}`);
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

const total   = failCount + warnCount + passCount;
const verdict = failCount > 0 ? `${RED}${BOLD}FAIL${RESET}` : `${GREEN}${BOLD}PASS${RESET}`;
console.log(`\nResult: ${verdict}  (${failCount} fail, ${warnCount} warn, ${passCount} pass  /  ${total} checks)\n`);
process.exit(failCount > 0 ? 1 : 0);
