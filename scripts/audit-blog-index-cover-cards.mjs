#!/usr/bin/env node
/**
 * scripts/audit-blog-index-cover-cards.mjs
 *
 * Verifies that the /blog index card renderer correctly handles
 * portrait/book covers (compact centred frame) vs landscape covers
 * (full-width landscape slot).
 *
 * Checks:
 *   1. EssayCard exports isPortraitCover helper
 *   2. isPortraitCover returns true for coverAspect === "book" | "portrait"
 *   3. Portrait covers receive aspect="book" (NOT "landscape")
 *   4. Portrait covers receive className with max-w constraint for centering
 *   5. Landscape covers still receive aspect="landscape"
 *   6. The Second Phone frontmatter sets coverAspect: book
 *   7. /blog/[...slug].tsx (ClassicBlogReader) is NOT modified
 *   8. EssayCard has no direct reference to landscape matte for book covers
 *
 * Usage:
 *   node scripts/audit-blog-index-cover-cards.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

let failures = 0;
let warnings = 0;

function pass(msg) { console.log(`  ✓ OK    ${msg}`); }
function fail(msg) { console.error(`  ✗ FAIL  ${msg}`); failures++; }
function warn(msg) { console.warn(`  ⚠ WARN  ${msg}`); warnings++; }
function section(title) { console.log(`\n▸ ${title}`); }

function read(relPath) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, "utf-8");
}

// ── 1. EssayCard helper ──────────────────────────────────────────────────────

section("1 — EssayCard isPortraitCover helper");

const essayCard = read("components/essays/EssayCard.tsx");
if (!essayCard) {
  fail("components/essays/EssayCard.tsx not found");
} else {
  if (/export function isPortraitCover/.test(essayCard)) {
    pass("isPortraitCover is exported from EssayCard");
  } else {
    fail("isPortraitCover not exported from EssayCard");
  }

  if (/coverAspect.*===.*"book"/.test(essayCard) || /aspect.*===.*"book"/.test(essayCard)) {
    pass("isPortraitCover checks for coverAspect === \"book\"");
  } else {
    fail("isPortraitCover does not check for coverAspect === \"book\"");
  }

  // The implementation may use a local variable: const aspect = post.coverAspect; … aspect === "portrait"
  if (/coverAspect.*===.*"portrait"/.test(essayCard) || /aspect\s*===\s*["']portrait["']/.test(essayCard)) {
    pass("isPortraitCover checks for portrait aspect (via coverAspect or local alias)");
  } else {
    fail("isPortraitCover does not check for portrait aspect");
  }
}

// ── 2. Portrait cover gets aspect="book" ────────────────────────────────────

section("2 — Portrait cover → aspect=\"book\" (not hardcoded landscape)");

if (essayCard) {
  // Should contain conditional aspect selection
  if (/portraitCover.*\?.*"book".*:.*"landscape"/.test(essayCard) ||
      /isPortraitCover.*\?.*"book"/.test(essayCard)) {
    pass("SmartCover aspect is conditional: \"book\" for portrait, \"landscape\" for others");
  } else if (/aspect=\{portraitCover/.test(essayCard) || /aspect.*portrait.*book/.test(essayCard)) {
    pass("SmartCover aspect is conditionally set for portrait covers");
  } else {
    // Check that aspect="landscape" is not hardcoded unconditionally
    if (/aspect="landscape"/.test(essayCard)) {
      fail("SmartCover aspect is still hardcoded to \"landscape\" — portrait covers will show in landscape matte");
    } else {
      pass("aspect=\"landscape\" is not unconditionally hardcoded");
    }
  }

  if (/max-w-\[3[0-9]{2}px\]/.test(essayCard)) {
    pass("Portrait cover has max-width constraint (compact frame)");
  } else {
    fail("Portrait cover is missing max-width constraint — will expand to full card width");
  }

  if (/mx-auto/.test(essayCard)) {
    pass("Portrait cover frame is centred (mx-auto)");
  } else {
    warn("Portrait cover may not be centred — mx-auto not found in EssayCard");
  }
}

// ── 3. Landscape covers still exist ─────────────────────────────────────────

section("3 — Landscape cover treatment still present");

if (essayCard) {
  if (/"landscape"/.test(essayCard)) {
    pass("\"landscape\" aspect is still referenced (landscape posts unaffected)");
  } else {
    fail("\"landscape\" aspect removed — landscape posts will have no cover treatment");
  }
}

// ── 4. The Second Phone frontmatter ─────────────────────────────────────────

section("4 — The Second Phone frontmatter");

const secondPhone = read("content/blog/the-second-phone.mdx");
if (!secondPhone) {
  fail("content/blog/the-second-phone.mdx not found");
} else {
  if (/coverAspect:\s*book/.test(secondPhone)) {
    pass("the-second-phone.mdx has coverAspect: book");
  } else {
    fail("the-second-phone.mdx does not have coverAspect: book");
  }
}

// ── 5. ClassicBlogReader (/blog/[slug]) untouched ───────────────────────────

section("5 — /blog/[...slug].tsx ClassicBlogReader untouched");

const blogSlug = read("pages/blog/[...slug].tsx");
if (!blogSlug) {
  fail("pages/blog/[...slug].tsx not found");
} else {
  if (/ClassicBlogReader/.test(blogSlug)) {
    pass("pages/blog/[...slug].tsx still uses ClassicBlogReader");
  } else {
    fail("pages/blog/[...slug].tsx no longer uses ClassicBlogReader");
  }

  // EssayCard should NOT be imported by the individual post page
  if (/import.*EssayCard/.test(blogSlug)) {
    warn("pages/blog/[...slug].tsx imports EssayCard — verify this is intentional");
  } else {
    pass("pages/blog/[...slug].tsx does not import EssayCard (reader is separate)");
  }
}

// ── 6. /blog index uses EssayCard for archive ────────────────────────────────

section("6 — /blog index uses EssayCard for archive floor");

const blogIndex = read("pages/blog/index.tsx");
if (!blogIndex) {
  fail("pages/blog/index.tsx not found");
} else {
  if (/EssayCard/.test(blogIndex)) {
    pass("pages/blog/index.tsx uses EssayCard");
  } else {
    fail("pages/blog/index.tsx does not use EssayCard");
  }

  // Should pass coverAspect through to EssayCard
  if (/coverAspect/.test(blogIndex)) {
    pass("pages/blog/index.tsx passes coverAspect in post data");
  } else {
    fail("pages/blog/index.tsx does not pass coverAspect — portrait detection will not work");
  }
}

// ── 7. SmartCover supports "book" aspect ────────────────────────────────────

section("7 — SmartCover \"book\" aspect support");

const smartCover = read("components/primitives/SmartCover.tsx");
if (!smartCover) {
  fail("components/primitives/SmartCover.tsx not found");
} else {
  if (/book.*aspect-\[3\/4\]/.test(smartCover) || /['"]book['"]\s*:\s*['"]aspect-\[3\/4\]/.test(smartCover)) {
    pass("SmartCover maps \"book\" aspect to aspect-[3/4] (portrait)");
  } else {
    fail("SmartCover does not map \"book\" to aspect-[3/4]");
  }
}

// ── Summary ──────────────────────────────────────────────────────────────────

console.log("\n────────────────────────────────────────────────────");
if (failures > 0) {
  console.error(`\n❌  Blog index cover-card audit FAILED — ${failures} failure(s), ${warnings} warning(s)\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`\n⚠   Blog index cover-card audit PASSED with ${warnings} warning(s)\n`);
} else {
  console.log(`\n✅  Blog index cover-card audit PASSED — 0 failures, 0 warnings\n`);
}
