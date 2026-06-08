/**
 * tests/content/article-cover-images.test.ts
 *
 * Verifies the cover image rendering pipeline:
 *  1. Blog series part page imports and renders ArticleCoverImage
 *  2. Editorial series part page imports and renders ArticleCoverImage
 *  3. Standalone editorial page imports and renders ArticleCoverImage
 *  4. Missing/null src produces no render (null-safe guard)
 *  5. Alt text fallback is correct
 *  6. Blog index and series hub pages do NOT import ArticleCoverImage (listing pages stay text-led)
 *  7. ArticleCoverImage component file exists and exports a default function
 *  8. Blog series part getStaticProps extracts ogImage/coverImage from doc
 *  9. Editorial series part getStaticProps extracts coverImage
 * 10. Audit script exists and is runnable (file exists, not empty)
 *
 * Run: pnpm exec vitest run tests/content/article-cover-images.test.ts
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

// ─── 1. Blog series part renders ArticleCoverImage ───────────────────────────

describe("Blog series part page", () => {
  const PAGE = "pages/blog/series/[seriesSlug]/[partSlug].tsx";

  it("imports ArticleCoverImage", () => {
    expect(read(PAGE)).toMatch(/import ArticleCoverImage/);
  });

  it("renders ArticleCoverImage in JSX", () => {
    expect(read(PAGE)).toMatch(/<ArticleCoverImage/);
  });

  it("renders cover conditionally — only when ogImage is present", () => {
    const content = read(PAGE);
    // The render must be guarded by a non-empty check
    expect(content).toMatch(/ogImage\s*\?/);
  });

  it("passes title prop for alt fallback", () => {
    expect(read(PAGE)).toMatch(/title=\{part\.title\}/);
  });

  it("getStaticProps extracts ogImage from doc", () => {
    const content = read(PAGE);
    expect(content).toMatch(/ogImage.*coverImage|coverImage.*ogImage/s);
  });
});

// ─── 2. Editorial series part page renders ArticleCoverImage ─────────────────

describe("Editorial series part page", () => {
  const PAGE = "pages/editorials/series/[seriesSlug]/[partSlug].tsx";

  it("imports ArticleCoverImage", () => {
    expect(read(PAGE)).toMatch(/import ArticleCoverImage/);
  });

  it("renders ArticleCoverImage in JSX", () => {
    expect(read(PAGE)).toMatch(/<ArticleCoverImage/);
  });

  it("renders cover conditionally — only when coverImage is present", () => {
    expect(read(PAGE)).toMatch(/coverImage\s*\?/);
  });

  it("passes title prop for alt fallback", () => {
    expect(read(PAGE)).toMatch(/title=\{part\.title\}/);
  });

  it("Props type includes coverImage field", () => {
    expect(read(PAGE)).toMatch(/coverImage:\s*string\s*\|\s*null/);
  });

  it("getStaticProps extracts coverImage from doc", () => {
    const content = read(PAGE);
    expect(content).toMatch(/rawCoverImage/);
  });
});

// ─── 3. Standalone editorial page renders ArticleCoverImage ──────────────────

describe("Standalone editorial page", () => {
  const PAGE = "pages/editorials/[slug].tsx";

  it("imports ArticleCoverImage", () => {
    expect(read(PAGE)).toMatch(/import ArticleCoverImage/);
  });

  it("renders ArticleCoverImage in JSX", () => {
    expect(read(PAGE)).toMatch(/<ArticleCoverImage/);
  });

  it("renders cover conditionally — only when item.coverImage exists", () => {
    expect(read(PAGE)).toMatch(/item\.coverImage\s*\?/);
  });

  it("passes item.coverImage as src", () => {
    expect(read(PAGE)).toMatch(/src=\{item\.coverImage\}/);
  });
});

// ─── 4. ArticleCoverImage returns null when no src ───────────────────────────

describe("ArticleCoverImage component", () => {
  const COMPONENT = "components/content/ArticleCoverImage.tsx";

  it("file exists", () => {
    expect(exists(COMPONENT)).toBe(true);
  });

  it("exports a default function", () => {
    expect(read(COMPONENT)).toMatch(/export default function ArticleCoverImage/);
  });

  it("returns null when src is falsy", () => {
    expect(read(COMPONENT)).toMatch(/if\s*\(!src\)\s*return\s*null/);
  });

  it("has alt fallback using title", () => {
    expect(read(COMPONENT)).toMatch(/Cover image for \$\{title\}/);
  });

  it("uses next/image", () => {
    expect(read(COMPONENT)).toMatch(/import Image from ['"]next\/image['"]/);
  });

  it("accepts priority prop", () => {
    expect(read(COMPONENT)).toMatch(/priority/);
  });

  it("accepts caption prop and renders figcaption", () => {
    const content = read(COMPONENT);
    expect(content).toMatch(/caption/);
    expect(content).toMatch(/figcaption/);
  });

  it("is mobile-safe — uses responsive sizes attribute", () => {
    expect(read(COMPONENT)).toMatch(/max-width:\s*768px/);
  });
});

// ─── 5. Listing pages remain text-led ────────────────────────────────────────

describe("Listing pages do not use ArticleCoverImage", () => {
  const LISTING_PAGES = [
    "pages/blog/index.tsx",
    "pages/blog/series/[seriesSlug]/index.tsx",
    "pages/editorials/index.tsx",
    "pages/editorials/series/[seriesSlug]/index.tsx",
  ];

  for (const page of LISTING_PAGES) {
    it(`${page} does not import ArticleCoverImage`, () => {
      if (!exists(page)) return; // page not yet created — skip gracefully
      expect(read(page)).not.toMatch(/import ArticleCoverImage/);
    });
  }
});

// ─── 6. Audit script exists ──────────────────────────────────────────────────

describe("Audit script", () => {
  it("audit-article-cover-images.mjs exists", () => {
    expect(exists("scripts/audit-article-cover-images.mjs")).toBe(true);
  });

  it("audit script is non-empty", () => {
    const content = read("scripts/audit-article-cover-images.mjs");
    expect(content.length).toBeGreaterThan(500);
  });

  it("audit script checks for FAIL exit on missing asset", () => {
    expect(read("scripts/audit-article-cover-images.mjs")).toMatch(/process\.exit\(.*1.*\)/);
  });
});

// ─── 7. Cover image path stability ───────────────────────────────────────────

describe("Cover image path conventions", () => {
  it("ArticleCoverImage never transforms the src path (trusts resolver output)", () => {
    // The component should not do any path manipulation — it accepts what it receives
    const content = read("components/content/ArticleCoverImage.tsx");
    expect(content).not.toMatch(/\.replace\(.*\/.*\/\)/);
    expect(content).not.toMatch(/path\.join/);
  });
});
