/**
 * tests/content/classic-blog-reader.test.ts
 *
 * Verifies the classic blog reader layout contract.
 *
 * Run: pnpm exec vitest run tests/content/classic-blog-reader.test.ts
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

// ─── 1. Route uses ClassicBlogReader ─────────────────────────────────────────

describe("/blog/[...slug].tsx — renderer", () => {
  const PAGE = "pages/blog/[...slug].tsx";

  it("imports ClassicBlogReader", () => {
    expect(read(PAGE)).toMatch(/import ClassicBlogReader/);
  });

  it("does not import DirectorateOversight (replaced)", () => {
    expect(read(PAGE)).not.toMatch(/import DirectorateOversight/);
  });

  it("uses ClassicBlogReader in JSX", () => {
    expect(read(PAGE)).toMatch(/<ClassicBlogReader/);
  });

  it("passes cover prop to ClassicBlogReader", () => {
    expect(read(PAGE)).toMatch(/cover=\{cover\}/);
  });

  it("resolves cover as null when no frontmatter cover field set", () => {
    // rawCover check — must be null-guarded
    const content = read(PAGE);
    expect(content).toMatch(/rawCover/);
    expect(content).toMatch(/rawCover\s*\?\s*resolveDocCoverImage/);
  });
});

// ─── 2. ClassicBlogReader component ──────────────────────────────────────────

describe("ClassicBlogReader component", () => {
  const COMP = "components/blog/ClassicBlogReader.tsx";

  it("file exists", () => {
    expect(exists(COMP)).toBe(true);
  });

  it("exports default function ClassicBlogReader", () => {
    expect(read(COMP)).toMatch(/export default function ClassicBlogReader/);
  });

  it("renders cover AFTER header and BEFORE body (source order)", () => {
    const content = read(COMP);
    const coverIdx = content.indexOf("hasCover");
    const bodyIdx  = content.indexOf("classic-blog-body");
    expect(coverIdx).toBeGreaterThan(-1);
    expect(bodyIdx).toBeGreaterThan(-1);
    expect(coverIdx).toBeLessThan(bodyIdx);
  });

  it("does not render cover when no src provided (hasCover guard)", () => {
    expect(read(COMP)).toMatch(/hasCover.*&&|{hasCover\s*&&/s);
  });

  it("childrenBottom slot appears after essay body", () => {
    const content = read(COMP);
    const bodyIdx     = content.indexOf("classic-blog-body");
    const childrenIdx = content.lastIndexOf("childrenBottom");
    expect(childrenIdx).toBeGreaterThan(bodyIdx);
  });

  it("cover image is constrained — not full-bleed", () => {
    expect(read(COMP)).toMatch(/max-w-\[860px\]|max-w-3xl|max-w-4xl/);
  });

  it("uses next/image for cover", () => {
    expect(read(COMP)).toMatch(/import Image from ['"]next\/image['"]/);
  });

  it("has classic-blog-body class for typography scoping", () => {
    expect(read(COMP)).toMatch(/classic-blog-body/);
  });

  it("is mobile safe — has responsive sizes attribute", () => {
    expect(read(COMP)).toMatch(/max-width:\s*768px/);
  });

  it("has readable body column width (not full max-width)", () => {
    // Body column should be narrower than the page max
    expect(read(COMP)).toMatch(/lg:col-span-8|max-w-3xl|max-w-\[65ch\]/);
  });
});

// ─── 3. Editorial routes untouched ───────────────────────────────────────────

describe("Editorial routes — protected from classic blog reader", () => {
  it("editorials/series/[seriesSlug]/[partSlug].tsx does NOT import ClassicBlogReader", () => {
    const content = read("pages/editorials/series/[seriesSlug]/[partSlug].tsx");
    expect(content).not.toMatch(/import ClassicBlogReader/);
  });

  it("editorials/[slug].tsx does NOT import ClassicBlogReader", () => {
    const content = read("pages/editorials/[slug].tsx");
    expect(content).not.toMatch(/import ClassicBlogReader/);
  });

  it("editorials/series/[seriesSlug]/[partSlug].tsx still uses StaticMDXRenderer", () => {
    const content = read("pages/editorials/series/[seriesSlug]/[partSlug].tsx");
    expect(content).toMatch(/StaticMDXRenderer/);
  });

  it("editorials/[slug].tsx still uses StaticMDXRenderer", () => {
    const content = read("pages/editorials/[slug].tsx");
    expect(content).toMatch(/StaticMDXRenderer/);
  });
});

// ─── 4. The Second Phone content ─────────────────────────────────────────────

describe("the-second-phone frontmatter", () => {
  const MDX = "content/blog/the-second-phone.mdx";

  it("file exists", () => {
    expect(exists(MDX)).toBe(true);
  });

  it("has coverImage in frontmatter", () => {
    expect(read(MDX)).toMatch(/coverImage:/);
  });

  it("coverImage points to an existing file under /public", () => {
    const content = read(MDX);
    const match = content.match(/coverImage:\s*["']?([^\s"'\n]+)["']?/);
    expect(match).not.toBeNull();
    if (match) {
      const coverPath = match[1].replace(/["']/g, "");
      const onDisk = path.join(ROOT, "public", coverPath.replace(/^\//, ""));
      expect(fs.existsSync(onDisk)).toBe(true);
    }
  });

  it("is published (not draft)", () => {
    const content = read(MDX);
    expect(content).not.toMatch(/draft:\s*true/);
    expect(content).toMatch(/published:\s*true/);
  });
});

// ─── 5. Blog index unchanged ──────────────────────────────────────────────────

describe("Blog index page", () => {
  it("pages/blog/index.tsx exists", () => {
    expect(exists("pages/blog/index.tsx")).toBe(true);
  });

  it("does not import ClassicBlogReader (index uses its own layout)", () => {
    expect(read("pages/blog/index.tsx")).not.toMatch(/import ClassicBlogReader/);
  });
});

// ─── 6. No duplicate cover render ────────────────────────────────────────────

describe("No duplicate cover rendering", () => {
  it("ClassicBlogReader has exactly one BlogCoverImage definition", () => {
    const content = read("components/blog/ClassicBlogReader.tsx");
    const count = (content.match(/function BlogCoverImage/g) || []).length;
    expect(count).toBe(1);
  });

  it("ClassicBlogReader does not also import ArticleCoverImage", () => {
    expect(read("components/blog/ClassicBlogReader.tsx")).not.toMatch(/import ArticleCoverImage/);
  });
});

// ─── 7. Audit script ─────────────────────────────────────────────────────────

describe("Audit script", () => {
  it("audit-classic-blog-reader-layout.mjs exists", () => {
    expect(exists("scripts/audit-classic-blog-reader-layout.mjs")).toBe(true);
  });

  it("audit script references ClassicBlogReader", () => {
    expect(read("scripts/audit-classic-blog-reader-layout.mjs")).toMatch(/ClassicBlogReader/);
  });
});
