/**
 * tests/series/truth-in-the-frame-frontmatter.test.ts
 *
 * Real MDX frontmatter contract test for The Truth in the Frame.
 *
 * Reads the actual MDX files from the filesystem and verifies their
 * frontmatter metadata is correct and consistent.
 *
 * This test does NOT depend on Contentlayer or the resolver.
 * It uses Node.js filesystem APIs and a simple frontmatter parser.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// ─── Frontmatter parser ──────────────────────────────────────────────────────

function parseFrontmatter(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, "utf8");
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fm: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const [k, ...v] = line.split(":");
    if (k && v.length) {
      fm[k.trim()] = v.join(":").trim().replace(/^"|"$/g, "");
    }
  }
  return fm;
}

// ─── Expected data ───────────────────────────────────────────────────────────

const SERIES_DIR = "content/blog/series/the-truth-in-the-frame";

const EXPECTED_PARTS = [
  { order: 1, slug: "before-the-word-what-the-cave-walls-remember", date: "2026-07-07" },
  { order: 2, slug: "the-kings-shadow", date: "2026-07-14" },
  { order: 3, slug: "the-emperors-canvas", date: "2026-07-21" },
  { order: 4, slug: "the-empire-in-the-frame", date: "2026-07-28" },
  { order: 5, slug: "the-grain-is-abundant", date: "2026-08-04" },
  { order: 6, slug: "the-camera-never-lies", date: "2026-08-11" },
  { order: 7, slug: "the-algorithms-gallery", date: "2026-08-18" },
  { order: 8, slug: "the-synthetic-truth", date: "2026-08-25" },
  { order: 9, slug: "what-deserves-to-survive", date: "2026-09-01" },
];

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("The Truth in the Frame — real MDX frontmatter contract", () => {
  const dir = path.resolve(process.cwd(), SERIES_DIR);
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => path.join(dir, f));

  it("has exactly nine primary MDX files", () => {
    expect(files).toHaveLength(9);
  });

  it("all files parse valid frontmatter", () => {
    for (const file of files) {
      const fm = parseFrontmatter(file);
      expect(fm.title).toBeTruthy();
      expect(fm.series).toBe("the-truth-in-the-frame");
    }
  });

  it("has unique seriesOrder values 1 through 9", () => {
    const orders = files.map((f) => {
      const fm = parseFrontmatter(f);
      return parseInt(fm.seriesOrder, 10);
    });
    expect(orders.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("all files use consistent series: the-truth-in-the-frame", () => {
    for (const file of files) {
      const fm = parseFrontmatter(file);
      expect(fm.series).toBe("the-truth-in-the-frame");
    }
  });

  it("all files use consistent seriesTitle", () => {
    const titles = files.map((f) => parseFrontmatter(f).seriesTitle);
    const unique = new Set(titles);
    expect(unique.size).toBe(1);
    expect(unique.has("The Truth in the Frame")).toBe(true);
  });

  it("all files use consistent seriesDescription", () => {
    const descriptions = files.map((f) => parseFrontmatter(f).seriesDescription);
    const unique = new Set(descriptions);
    expect(unique.size).toBe(1);
    expect(unique.has("From cave paintings to deepfakes — who controls the record, and what does it cost?")).toBe(true);
  });

  it("publication dates match expected schedule", () => {
    const fmBySlug: Record<string, Record<string, string>> = {};
    for (const file of files) {
      const fm = parseFrontmatter(file);
      fmBySlug[fm.slug] = fm;
    }

    for (const expected of EXPECTED_PARTS) {
      const fm = fmBySlug[expected.slug];
      expect(fm).toBeDefined();
      expect(fm.date).toBe(expected.date);
      expect(parseInt(fm.seriesOrder, 10)).toBe(expected.order);
    }
  });

  it("all nine parts are public scheduled content: draft=false, published=true, accessLevel=public", () => {
    const fmBySlug: Record<string, Record<string, string>> = {};
    for (const file of files) {
      const fm = parseFrontmatter(file);
      fmBySlug[fm.slug] = fm;
    }

    for (const expected of EXPECTED_PARTS) {
      const fm = fmBySlug[expected.slug];
      expect(fm).toBeDefined();
      expect(fm.draft).toBe("false");
      expect(fm.published).toBe("true");
      expect(fm.accessLevel).toBe("public");
      expect(fm.date).toBe(expected.date);
      expect(parseInt(fm.seriesOrder, 10)).toBe(expected.order);
    }
  });

  it("no outbound or source-material files are counted", () => {
    const allFiles = fs.readdirSync(dir);
    const mdxFiles = allFiles.filter((f) => f.endsWith(".mdx"));
    expect(mdxFiles).toHaveLength(9);

    for (const f of mdxFiles) {
      expect(f).not.toMatch(/^(facebook|linkedin|x|social|outbound)/i);
    }
  });
});