/**
 * scripts/audit-classic-blog-reader-layout.mjs
 *
 * Audits that the classic blog post reader (/blog/[slug]) uses the correct
 * article-first layout and that editorial series routes are untouched.
 *
 * Checks:
 *  1. blog/[...slug].tsx uses ClassicBlogReader (not DirectorateOversight)
 *  2. ClassicBlogReader component file exists
 *  3. ClassicBlogReader renders cover AFTER header, BEFORE body
 *  4. ClassicBlogReader renders body BEFORE childrenBottom (related/CTA)
 *  5. Cover is constrained to max-width (not full-bleed class)
 *  6. Editorial series part route does NOT import ClassicBlogReader
 *  7. Standalone editorial route does NOT import ClassicBlogReader
 *  8. /blog/the-second-phone frontmatter cover image resolves to an existing file
 *  9. blog/[...slug].tsx does NOT import DirectorateOversight
 * 10. ClassicBlogReader does NOT force a fallback cover (suppresses when no cover set)
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

let failCount = 0;
let warnCount = 0;
let passCount = 0;

function pass(label) {
  passCount++;
  console.log(`  ${GREEN}PASS${RESET}  ${label}`);
}

function warn(label) {
  warnCount++;
  console.log(`  ${YELLOW}WARN${RESET}  ${label}`);
}

function fail(label) {
  failCount++;
  console.log(`  ${RED}FAIL${RESET}  ${label}`);
}

function read(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf-8");
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

console.log(`\n${BOLD}Abraham of London — Classic Blog Reader Layout Audit${RESET}\n`);

// ─── 1. blog/[...slug].tsx uses ClassicBlogReader ─────────────────────────

const blogSlug = read("pages/blog/[...slug].tsx");
if (!blogSlug) {
  fail("pages/blog/[...slug].tsx not found");
} else {
  if (/import ClassicBlogReader/.test(blogSlug)) {
    pass("blog/[...slug].tsx imports ClassicBlogReader");
  } else {
    fail("blog/[...slug].tsx does NOT import ClassicBlogReader");
  }

  // ─── 9. Must NOT import DirectorateOversight ──────────────────────────

  if (/import DirectorateOversight/.test(blogSlug)) {
    fail("blog/[...slug].tsx still imports DirectorateOversight (should be removed)");
  } else {
    pass("blog/[...slug].tsx does not import DirectorateOversight");
  }
}

// ─── 2. ClassicBlogReader component exists ─────────────────────────────────

const classicReader = read("components/blog/ClassicBlogReader.tsx");
if (!classicReader) {
  fail("components/blog/ClassicBlogReader.tsx not found");
} else {
  pass("components/blog/ClassicBlogReader.tsx exists");

  // ─── 3. Cover rendered after header, before body ──────────────────────
  // Heuristic: hasCover / cover section appears before classic-blog-body

  const coverIdx  = classicReader.indexOf("hasCover");
  const bodyIdx   = classicReader.indexOf("classic-blog-body");
  if (coverIdx !== -1 && bodyIdx !== -1 && coverIdx < bodyIdx) {
    pass("Cover section is defined before essay body in ClassicBlogReader");
  } else if (coverIdx === -1) {
    fail("ClassicBlogReader has no hasCover guard — cover is unconditional");
  } else {
    fail("Cover section appears AFTER essay body in ClassicBlogReader");
  }

  // ─── 4. childrenBottom appears after body ─────────────────────────────
  const childrenIdx = classicReader.lastIndexOf("childrenBottom");
  if (childrenIdx > bodyIdx) {
    pass("childrenBottom slot is after essay body");
  } else {
    fail("childrenBottom slot appears BEFORE essay body in ClassicBlogReader");
  }

  // ─── 5. Cover is max-width constrained, not full-bleed ────────────────
  if (/max-w-\[860px\]|max-w-\[760px\]|max-w-3xl|max-w-4xl/.test(classicReader)) {
    pass("Cover has constrained max-width in ClassicBlogReader");
  } else {
    warn("No explicit max-width constraint found on cover in ClassicBlogReader");
  }

  // ─── 10. Does not force fallback — cover=null suppresses render ────────
  if (/if.*cover.*return null|!.*cover.*null|hasCover.*&&|cover &&/.test(classicReader)) {
    pass("ClassicBlogReader suppresses cover section when no cover is provided");
  } else {
    warn("ClassicBlogReader cover suppression guard not clearly identified");
  }
}

// ─── 6. Editorial series part does NOT import ClassicBlogReader ───────────

const editSeriesPart = read("pages/editorials/series/[seriesSlug]/[partSlug].tsx");
if (editSeriesPart && /import ClassicBlogReader/.test(editSeriesPart)) {
  fail("editorials/series/[seriesSlug]/[partSlug].tsx imports ClassicBlogReader (editorial contamination)");
} else {
  pass("editorials/series/[seriesSlug]/[partSlug].tsx is untouched by ClassicBlogReader");
}

// ─── 7. Standalone editorial does NOT import ClassicBlogReader ────────────

const editSlug = read("pages/editorials/[slug].tsx");
if (editSlug && /import ClassicBlogReader/.test(editSlug)) {
  fail("editorials/[slug].tsx imports ClassicBlogReader (editorial contamination)");
} else {
  pass("editorials/[slug].tsx is untouched by ClassicBlogReader");
}

// ─── 8. /blog/the-second-phone cover resolves to existing file ────────────

const secondPhoneMdx = read("content/blog/the-second-phone.mdx");
if (!secondPhoneMdx) {
  warn("content/blog/the-second-phone.mdx not found — skipping cover path check");
} else {
  const match = secondPhoneMdx.match(/coverImage:\s*["']?([^\s"'\n]+)["']?/);
  if (!match) {
    warn("the-second-phone.mdx has no coverImage in frontmatter");
  } else {
    const coverPath = match[1].trim().replace(/["']/g, "");
    const onDisk = path.join(ROOT, "public", coverPath.replace(/^\//, ""));
    if (fs.existsSync(onDisk)) {
      pass(`the-second-phone cover exists on disk: ${coverPath}`);
    } else {
      fail(`the-second-phone cover MISSING on disk: ${coverPath}`);
    }
  }
}

// ─── Report ───────────────────────────────────────────────────────────────

const total = passCount + warnCount + failCount;
const verdict = failCount > 0 ? `${RED}${BOLD}FAIL${RESET}` : `${GREEN}${BOLD}PASS${RESET}`;
console.log(`\nResult: ${verdict}  (${failCount} fail, ${warnCount} warn, ${passCount} pass  /  ${total} checks)\n`);

process.exit(failCount > 0 ? 1 : 0);
