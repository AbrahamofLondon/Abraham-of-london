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

  it("SmartCover aspect is conditional — not hardcoded to \"landscape\"", () => {
    const src = read(CARD);
    // The aspect prop must be a conditional expression, not a static string
    // Pattern: aspect={portraitCover ? "book" : "landscape"} or equivalent
    expect(src).not.toMatch(/aspect=["']landscape["']/);
  });

  it("portrait cover uses aspect=\"book\" (3/4 portrait frame)", () => {
    expect(read(CARD)).toMatch(/["']book["']/);
  });

  it("portrait cover has max-width constraint preventing full-card-width expansion", () => {
    // max-w-[280px] through max-w-[340px] is acceptable per spec
    expect(read(CARD)).toMatch(/max-w-\[2[89][0-9]px\]|max-w-\[3[0-3][0-9]px\]|max-w-\[300px\]/);
  });

  it("portrait cover frame is centred with mx-auto", () => {
    expect(read(CARD)).toMatch(/mx-auto/);
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

  it("non-portrait posts fall back to landscape aspect", () => {
    // The conditional must have a : "landscape" branch
    expect(read(CARD)).toMatch(/:\s*["']landscape["']/);
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
