/**
 * tests/content/article-cover-refinement.test.ts
 *
 * P8 — Cover + spacing refinement tests across all three article families.
 *
 * Run: pnpm exec vitest run tests/content/article-cover-refinement.test.ts
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf-8");
}
function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

// ─── Classic blog ─────────────────────────────────────────────────────────────

describe("Classic blog — /blog/the-second-phone (P8.1-5)", () => {
  it("1. pages/blog/[...slug].tsx uses ClassicBlogReader", () => {
    expect(read("pages/blog/[...slug].tsx")).toMatch(/import ClassicBlogReader/);
  });

  it("2. ClassicBlogReader cover has constrained max-width per aspect", () => {
    const content = read("components/blog/ClassicBlogReader.tsx");
    // Should have at least two distinct maxWidth values for different aspects
    expect(content).toMatch(/maxWidth.*420px|maxWidth.*480px/);   // portrait
    expect(content).toMatch(/maxWidth.*760px|maxWidth.*820px/);   // landscape
  });

  it("3. Portrait/book cover uses object-contain, not cover", () => {
    const content = read("components/blog/ClassicBlogReader.tsx");
    // book aspect → fit: "contain"
    expect(content).toMatch(/book.*contain|isPortrait.*contain|fit.*contain/s);
  });

  it("4. ClassicBlogReader body grid has 88px desktop gap", () => {
    expect(read("components/blog/ClassicBlogReader.tsx")).toMatch(/gap-x-\[88px\]/);
  });

  it("5. Sidebar hidden below xl breakpoint (not squeezing body)", () => {
    expect(read("components/blog/ClassicBlogReader.tsx")).toMatch(/hidden xl:block/);
  });
});

// ─── Blog series ─────────────────────────────────────────────────────────────

describe("Blog series covers (P8.6-7)", () => {
  const PAGE = "pages/blog/series/[seriesSlug]/[partSlug].tsx";

  it("6. Blog-series route renders ArticleCoverImage when ogImage exists", () => {
    const content = read(PAGE);
    expect(content).toMatch(/import ArticleCoverImage/);
    expect(content).toMatch(/<ArticleCoverImage/);
    expect(content).toMatch(/ogImage\s*\?/);
  });

  it("7. Blog-series cover has restrained maxWidth (≤ 840px)", () => {
    const content = read(PAGE);
    // Must pass maxWidth prop
    expect(content).toMatch(/maxWidth="840px"|maxWidth="820px"|maxWidth="760px"/);
  });

  it("7b. Blog-series cover has maxHeight constraint", () => {
    expect(read(PAGE)).toMatch(/maxHeight="460px"|maxHeight="480px"/);
  });
});

// ─── Editorial series ─────────────────────────────────────────────────────────

describe("Editorial series covers (P8.8-12)", () => {
  const PAGE = "pages/editorials/series/[seriesSlug]/[partSlug].tsx";

  it("8. Editorial series route renders ArticleCoverImage when coverImage exists", () => {
    const content = read(PAGE);
    expect(content).toMatch(/import ArticleCoverImage/);
    expect(content).toMatch(/<ArticleCoverImage/);
    expect(content).toMatch(/coverImage\s*\?/);
  });

  it("9. Editorial series route does NOT import ClassicBlogReader", () => {
    expect(read(PAGE)).not.toMatch(/import ClassicBlogReader/);
  });

  it("10. Editorial series route does NOT import DirectorateOversight", () => {
    expect(read(PAGE)).not.toMatch(/import DirectorateOversight/);
  });

  it("11. Missing cover renders no broken image (null-guard)", () => {
    const content = read(PAGE);
    // coverImage is null when not in frontmatter — conditional render
    expect(content).toMatch(/coverImage\s*\?/);
    // The cover section is wrapped: {coverImage ? (<ArticleCoverImage ...) : null}
    expect(content).toMatch(/null/);
  });

  it("12. Cover appears before body in source order", () => {
    const content = read(PAGE);
    const coverIdx = content.indexOf("{coverImage ?");
    const bodyIdx  = content.indexOf("mind-clay-reader-body");
    expect(coverIdx).toBeGreaterThan(-1);
    expect(bodyIdx).toBeGreaterThan(-1);
    expect(coverIdx).toBeLessThan(bodyIdx);
  });

  it("Editorial series parts — all currently have no coverImage (intentional, no assets)", () => {
    // This is an informational assertion — no images exist, nothing is broken
    const seriesDir = path.join(ROOT, "content/editorial-series");
    let withCover = 0;
    if (fs.existsSync(seriesDir)) {
      for (const series of fs.readdirSync(seriesDir)) {
        const sDir = path.join(seriesDir, series);
        if (!fs.statSync(sDir).isDirectory()) continue;
        for (const f of fs.readdirSync(sDir)) {
          if (!/\.(md|mdx)$/i.test(f)) continue;
          const content = fs.readFileSync(path.join(sDir, f), "utf-8");
          if (/coverImage:|ogImage:/.test(content)) withCover++;
        }
      }
    }
    // When covers are eventually added, this test should be updated
    expect(withCover).toBe(0);
  });
});

// ─── Regression ───────────────────────────────────────────────────────────────

describe("Regression — untouched routes (P8.13-15)", () => {
  it("13. DirectorateOversight component unchanged (still used by books)", () => {
    const content = read("components/content/DirectorateOversight.tsx");
    expect(content).toMatch(/export default function DirectorateOversight/);
    expect(content).toMatch(/SmartHeroCover/);
  });

  it("14. Books route still uses DirectorateOversight", () => {
    if (!exists("pages/books/[slug].tsx")) return;
    expect(read("pages/books/[slug].tsx")).toMatch(/import DirectorateOversight/);
  });

  it("15. Blog index does not use ClassicBlogReader", () => {
    expect(read("pages/blog/index.tsx")).not.toMatch(/import ClassicBlogReader/);
  });
});

// ─── ArticleCoverImage props ──────────────────────────────────────────────────

describe("ArticleCoverImage — sizing props (P5)", () => {
  const COMP = "components/content/ArticleCoverImage.tsx";

  it("accepts maxWidth prop with default", () => {
    expect(read(COMP)).toMatch(/maxWidth.*=.*"720px"|maxWidth\?: string/);
  });

  it("accepts maxHeight prop", () => {
    expect(read(COMP)).toMatch(/maxHeight/);
  });

  it("accepts objectFit prop", () => {
    expect(read(COMP)).toMatch(/objectFit/);
  });

  it("applies maxWidth as centering container style", () => {
    // Should set maxWidth on the figure and mx auto
    expect(read(COMP)).toMatch(/marginLeft.*auto|ml-auto|mx-auto/);
  });
});

// ─── Audit scripts ────────────────────────────────────────────────────────────

describe("Audit scripts (P6/P7)", () => {
  it("audit-article-cover-images.mjs exists and distinguishes families", () => {
    const content = read("scripts/audit-article-cover-images.mjs");
    expect(content).toMatch(/classicBlog/);
    expect(content).toMatch(/blogSeries/);
    expect(content).toMatch(/editorialSeries/);
    expect(content).toMatch(/standaloneEditorial/);
  });

  it("audit-editorial-series-cover-layout.mjs exists", () => {
    expect(exists("scripts/audit-editorial-series-cover-layout.mjs")).toBe(true);
  });

  it("audit-classic-blog-reader-layout.mjs checks grid gap", () => {
    expect(read("scripts/audit-classic-blog-reader-layout.mjs")).toMatch(/88px|gap/);
  });
});
