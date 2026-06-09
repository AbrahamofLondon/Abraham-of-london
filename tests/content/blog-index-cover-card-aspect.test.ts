/**
 * tests/content/blog-index-cover-card-aspect.test.ts
 *
 * Regression tests for portrait/book cover treatment on the /blog index.
 *
 * Spec:
 *   - Portrait covers (coverAspect: book | portrait) get a compact centred
 *     portrait frame instead of the wide landscape matte.
 *   - Landscape covers are unchanged.
 *   - /blog/[slug] ClassicBlogReader is NOT touched.
 *   - Editorial routes are NOT touched.
 *   - DirectorateOversight is NOT touched.
 *
 * Run: pnpm exec vitest run tests/content/blog-index-cover-card-aspect.test.ts
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");

function read(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), "utf-8");
}

function exists(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT, relPath));
}

// ── 1. /blog index renders EssayCard for archive posts ───────────────────────

describe("/blog index — archive card rendering", () => {
  const INDEX = "pages/blog/index.tsx";

  it("pages/blog/index.tsx exists", () => {
    expect(exists(INDEX)).toBe(true);
  });

  it("uses EssayCard for archive floor posts", () => {
    expect(read(INDEX)).toMatch(/EssayCard/);
  });

  it("passes coverAspect from contentlayer doc to post item", () => {
    expect(read(INDEX)).toMatch(/coverAspect/);
  });

  it("does not hardcode a fixed aspect for all cards", () => {
    // Previously this page rendered all cards as landscape regardless of coverAspect.
    // There should be no unconditional aspect="landscape" forced on the EssayCard call.
    const src = read(INDEX);
    // If EssayCard is called via `<EssayCard post={...} />` the aspect logic
    // lives inside EssayCard — the index page must not override it.
    expect(src).not.toMatch(/EssayCard[^>]+aspect\s*=\s*["']landscape["']/);
  });
});

// ── 2. The Second Phone card uses portrait/book cover treatment ───────────────

describe("EssayCard — isPortraitCover helper", () => {
  const CARD = "components/essays/EssayCard.tsx";

  it("EssayCard.tsx exists", () => {
    expect(exists(CARD)).toBe(true);
  });

  it("exports isPortraitCover function", () => {
    expect(read(CARD)).toMatch(/export function isPortraitCover/);
  });

  it("isPortraitCover returns true for coverAspect === \"book\"", () => {
    const src = read(CARD);
    // Must check for the literal string "book" in the portrait detection
    expect(src).toMatch(/=== ["']book["']/);
  });

  it("isPortraitCover returns true for coverAspect === \"portrait\"", () => {
    expect(read(CARD)).toMatch(/=== ["']portrait["']/);
  });

  it("isPortraitCover handles ratio strings (3/4, 4/5, 3:4, 4:5)", () => {
    // Regex or explicit check for portrait-ratio frontmatter strings
    expect(read(CARD)).toMatch(/\[34\]\[\/:\]\[45\]|\[3\/4\]|\[4\/5\]|3\/4.*4\/5/);
  });
});

// ── 3. Portrait/book cover does NOT use full landscape hero treatment ─────────

describe("EssayCard default variant — portrait cover frame", () => {
  const CARD = "components/essays/EssayCard.tsx";

  it("portrait branch is separate from landscape — if (portraitCover) guard exists", () => {
    const src = read(CARD);
    // The portrait path is a distinct branch, not a ternary mixing both into SmartCover.
    // Pattern: if (portraitCover) { return ... }
    expect(src).toMatch(/if\s*\(\s*portraitCover\s*\)/);
  });

  it("portrait cover uses aspect=\"book\" or a fixed-width column (not full-card-width)", () => {
    const src = read(CARD);
    // Either aspect="book" OR the side-by-side column approach (w-[160px]/w-[220px]/w-[240px])
    // Both prevent the full-width landscape matte.
    expect(src).toMatch(/["']book["']|w-\[\d{3}px\]/);
  });

  it("portrait cover prevents full-card-width expansion — fixed column or max-width", () => {
    const src = read(CARD);
    // Side-by-side layout: fixed-width left column (w-[Xpx]) constrains the cover width.
    // Or legacy max-w approach. Either prevents the wide dark matte.
    expect(src).toMatch(/w-\[\d{3}px\]|max-w-\[\d{3}px\]/);
  });

  it("portrait cover layout does not make the image fill a wide card container", () => {
    const src = read(CARD);
    // The portrait branch must NOT have SmartCover with landscape aspect
    // as its only image approach — that's the broken state.
    expect(src).not.toMatch(/portraitCover.*aspect=["']landscape["']/);
  });

  it("portrait cover uses fit=\"cover\" (fills frame, no letterboxing)", () => {
    // The fit prop for portrait covers must be "cover", not "contain"
    // (contain would produce the dark matte problem we are fixing)
    const src = read(CARD);
    // fit={portraitCover ? "cover" : ...} pattern
    expect(src).toMatch(/portraitCover.*cover|fit.*cover/);
    // Must NOT hardcode fit="contain" for portrait covers
    expect(src).not.toMatch(/portraitCover.*contain/);
  });
});

// ── 4. Landscape posts still use landscape treatment ─────────────────────────

describe("EssayCard default variant — landscape cover frame", () => {
  const CARD = "components/essays/EssayCard.tsx";

  it("landscape aspect is still referenced in EssayCard", () => {
    expect(read(CARD)).toMatch(/["']landscape["']/);
  });

  it("non-portrait posts use landscape aspect in the landscape branch", () => {
    // The landscape branch (after portrait early-return) uses aspect="landscape" directly.
    expect(read(CARD)).toMatch(/aspect=["']landscape["']/);
  });
});

// ── 5. The Second Phone frontmatter wires up portrait treatment ───────────────

describe("the-second-phone.mdx — frontmatter", () => {
  const MDX = "content/blog/the-second-phone.mdx";

  it("file exists", () => {
    expect(exists(MDX)).toBe(true);
  });

  it("has coverAspect: book (triggers portrait treatment in EssayCard)", () => {
    expect(read(MDX)).toMatch(/coverAspect:\s*book/);
  });

  it("has coverFit: cover (fills portrait frame without letterboxing)", () => {
    expect(read(MDX)).toMatch(/coverFit:\s*cover/);
  });

  it("has coverImage in frontmatter", () => {
    expect(read(MDX)).toMatch(/coverImage:/);
  });

  it("is published (visible on /blog index)", () => {
    const src = read(MDX);
    expect(src).not.toMatch(/draft:\s*true/);
    expect(src).toMatch(/published:\s*true/);
  });
});

// ── 6. /blog/the-second-phone individual page remains ClassicBlogReader ───────

describe("/blog/[...slug].tsx — individual post page unchanged", () => {
  const PAGE = "pages/blog/[...slug].tsx";

  it("still uses ClassicBlogReader for rendering", () => {
    expect(read(PAGE)).toMatch(/ClassicBlogReader/);
    expect(read(PAGE)).toMatch(/<ClassicBlogReader/);
  });

  it("does NOT import EssayCard (reader and index card are separate concerns)", () => {
    // This guards against accidentally importing the index card component
    // into the individual post reader.
    expect(read(PAGE)).not.toMatch(/import EssayCard/);
  });

  it("does NOT import isPortraitCover (portrait detection is an EssayCard concern)", () => {
    expect(read(PAGE)).not.toMatch(/import.*isPortraitCover/);
  });
});

// ── 7. Editorial routes are untouched ────────────────────────────────────────

describe("Editorial routes — not affected by portrait cover change", () => {
  it("editorials/[slug].tsx does NOT import EssayCard", () => {
    expect(read("pages/editorials/[slug].tsx")).not.toMatch(/import EssayCard/);
  });

  it("editorials/[slug].tsx does NOT import isPortraitCover", () => {
    expect(read("pages/editorials/[slug].tsx")).not.toMatch(/import.*isPortraitCover/);
  });

  it("editorials/series/[seriesSlug]/[partSlug].tsx does NOT import EssayCard", () => {
    expect(read("pages/editorials/series/[seriesSlug]/[partSlug].tsx")).not.toMatch(/import EssayCard/);
  });

  it("editorials/series still uses StaticMDXRenderer", () => {
    expect(read("pages/editorials/series/[seriesSlug]/[partSlug].tsx")).toMatch(/StaticMDXRenderer/);
  });
});

// ── Bonus: SmartCover "book" aspect support ───────────────────────────────────

describe("SmartCover primitive — \"book\" aspect support", () => {
  const SMART = "components/primitives/SmartCover.tsx";

  it("SmartCover.tsx exists", () => {
    expect(exists(SMART)).toBe(true);
  });

  it("SmartCover maps \"book\" aspect to a 3/4 portrait ratio class", () => {
    const src = read(SMART);
    // Either "book": "aspect-[3/4]" in a map, or a switch/if branch
    expect(src).toMatch(/book.*aspect-\[3\/4\]|['"]book['"].*['"]aspect-\[3\/4\]['"]/);
  });
});
