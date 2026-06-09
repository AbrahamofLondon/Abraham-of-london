/**
 * tests/content/library-index-lite-serializer.test.ts
 *
 * Regression tests for the /library page-data reduction (P1 performance pass).
 *
 * Spec:
 *   1. /library props use the LiteItem serializer (toLibraryLiteItem)
 *   2. LiteItem does not include sourcePath, sourceType, description, status, category
 *   3. Summary is capped at 100 chars
 *   4. Tags are capped at 3
 *   5. Section metadata does not contain item arrays
 *   6. Full index accessible via public/system/library-index-lite.json
 *   7. Page-data audit script exists
 *   8. No behavioural change to visible library route (/library/index.tsx still exports
 *      applyFilters, ctaLabel, hasActiveFilters, EMPTY_FILTERS)
 *   9. /library page-data budget enforcement (if build output available)
 *
 * Run: pnpm exec vitest run tests/content/library-index-lite-serializer.test.ts
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { toLibraryLiteItem } from "../../lib/library/library-lite";
import type { LiteItem } from "../../lib/library/library-lite";
import type { LibraryIndexItem } from "../../lib/library/library-index";

const ROOT = path.resolve(__dirname, "../..");

function exists(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT, relPath));
}

function read(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), "utf-8");
}

// ─────────────────────────────────────────────────────────────────────────────
// Fixture factory
// ─────────────────────────────────────────────────────────────────────────────

function makeFullItem(overrides: Partial<LibraryIndexItem> = {}): LibraryIndexItem {
  return {
    id: "blog/test-essay.mdx",
    title: "A Test Essay About Strategic Decision-Making",
    summary: "A".repeat(200),            // 200 chars — above all caps
    description: "Full long description that should never be shipped.",
    type: "essay",
    section: "essays_analysis",
    href: "/blog/test-essay",
    access: "public",
    format: "article",
    status: "published",
    date: "2025-06-01T12:00:00.000Z",   // full ISO — should be trimmed
    tags: ["strategy", "doctrine", "frameworks", "decision", "canon"],  // 5 tags
    category: "Essay",
    featured: false,
    sourceType: "contentlayer",
    sourcePath: "content/blog/test-essay.mdx",
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. toLibraryLiteItem — serializer contract
// ─────────────────────────────────────────────────────────────────────────────

describe("toLibraryLiteItem — serializer", () => {
  it("exported from lib/library/library-lite", () => {
    expect(typeof toLibraryLiteItem).toBe("function");
  });

  it("returns the required fields", () => {
    const lite = toLibraryLiteItem(makeFullItem());
    expect(lite).toHaveProperty("id");
    expect(lite).toHaveProperty("title");
    expect(lite).toHaveProperty("href");
    expect(lite).toHaveProperty("type");
    expect(lite).toHaveProperty("access");
    expect(lite).toHaveProperty("section");
    expect(lite).toHaveProperty("tags");
    expect(lite).toHaveProperty("featured");
    expect(lite).toHaveProperty("format");
  });

  it("preserves essential fields correctly", () => {
    const full = makeFullItem();
    const lite = toLibraryLiteItem(full);
    expect(lite.id).toBe(full.id);
    expect(lite.title).toBe(full.title);
    expect(lite.href).toBe(full.href);
    expect(lite.type).toBe(full.type);
    expect(lite.access).toBe(full.access);
    expect(lite.section).toBe(full.section);
    expect(lite.featured).toBe(full.featured);
    expect(lite.format).toBe(full.format);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Forbidden fields absent from LiteItem
// ─────────────────────────────────────────────────────────────────────────────

describe("toLibraryLiteItem — forbidden fields", () => {
  it("does not include sourcePath", () => {
    const lite = toLibraryLiteItem(makeFullItem()) as unknown as Record<string, unknown>;
    expect(lite.sourcePath).toBeUndefined();
  });

  it("does not include sourceType", () => {
    const lite = toLibraryLiteItem(makeFullItem()) as unknown as Record<string, unknown>;
    expect(lite.sourceType).toBeUndefined();
  });

  it("does not include description", () => {
    const lite = toLibraryLiteItem(makeFullItem()) as unknown as Record<string, unknown>;
    expect(lite.description).toBeUndefined();
  });

  it("does not include status (all items are published; field is redundant)", () => {
    const lite = toLibraryLiteItem(makeFullItem()) as unknown as Record<string, unknown>;
    expect(lite.status).toBeUndefined();
  });

  it("does not include category (searchable via TYPE_LABELS[type])", () => {
    const lite = toLibraryLiteItem(makeFullItem()) as unknown as Record<string, unknown>;
    expect(lite.category).toBeUndefined();
  });

  it("does not include body/content/raw", () => {
    const lite = toLibraryLiteItem(makeFullItem()) as unknown as Record<string, unknown>;
    expect(lite.body).toBeUndefined();
    expect(lite.content).toBeUndefined();
    expect(lite.raw).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Summary capped at 100 chars
// ─────────────────────────────────────────────────────────────────────────────

describe("toLibraryLiteItem — summary cap", () => {
  it("caps summary at 100 chars", () => {
    const lite = toLibraryLiteItem(makeFullItem({ summary: "X".repeat(200) }));
    expect(lite.summary).toHaveLength(100);
  });

  it("preserves summaries shorter than 100 chars", () => {
    const short = "Short summary";
    const lite = toLibraryLiteItem(makeFullItem({ summary: short }));
    expect(lite.summary).toBe(short);
  });

  it("handles null summary", () => {
    const lite = toLibraryLiteItem(makeFullItem({ summary: null }));
    expect(lite.summary).toBeNull();
  });

  it("handles empty string summary as null equivalent", () => {
    const lite = toLibraryLiteItem(makeFullItem({ summary: "" }));
    // Empty string is falsy — should be treated as null
    expect(lite.summary === null || lite.summary === "").toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Tags capped at 3
// ─────────────────────────────────────────────────────────────────────────────

describe("toLibraryLiteItem — tags cap", () => {
  it("caps tags at 3 items", () => {
    const lite = toLibraryLiteItem(makeFullItem({ tags: ["a", "b", "c", "d", "e"] }));
    expect(lite.tags).toHaveLength(3);
    expect(lite.tags).toEqual(["a", "b", "c"]);
  });

  it("preserves tag arrays with fewer than 3 items", () => {
    const lite = toLibraryLiteItem(makeFullItem({ tags: ["strategy", "doctrine"] }));
    expect(lite.tags).toEqual(["strategy", "doctrine"]);
  });

  it("handles empty tag array", () => {
    const lite = toLibraryLiteItem(makeFullItem({ tags: [] }));
    expect(lite.tags).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Date trimmed to YYYY-MM-DD
// ─────────────────────────────────────────────────────────────────────────────

describe("toLibraryLiteItem — date format", () => {
  it("trims full ISO date to YYYY-MM-DD", () => {
    const lite = toLibraryLiteItem(makeFullItem({ date: "2025-06-01T12:00:00.000Z" }));
    expect(lite.date).toBe("2025-06-01");
    expect(lite.date!.length).toBe(10);
  });

  it("handles null date", () => {
    const lite = toLibraryLiteItem(makeFullItem({ date: null }));
    expect(lite.date).toBeNull();
  });

  it("preserves already-short dates", () => {
    const lite = toLibraryLiteItem(makeFullItem({ date: "2025-06-01" }));
    expect(lite.date).toBe("2025-06-01");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5b. Section metadata does not contain item arrays
// ─────────────────────────────────────────────────────────────────────────────

describe("pages/library/index.tsx — section metadata", () => {
  it("getStaticProps does not ship section item arrays (items derived client-side)", () => {
    const src = read("pages/library/index.tsx");
    // SectionMeta type must NOT have an 'items' field
    expect(src).not.toMatch(/sectionMeta.*items.*\[\]/);
    // The sectionMetas.map must not spread s.items
    expect(src).not.toMatch(/items:\s*s\.items/);
  });

  it("SectionBlock derives items from allItems client-side", () => {
    const src = read("pages/library/index.tsx");
    expect(src).toMatch(/allItems\.filter/);
    expect(src).toMatch(/i\.section === sectionMeta\.id/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Full index accessible via public/system/library-index-lite.json
// ─────────────────────────────────────────────────────────────────────────────

describe("public/system/library-index-lite.json", () => {
  it("exists after generate-library-index-lite.ts runs", () => {
    // This check succeeds after running: pnpm exec tsx scripts/generate-library-index-lite.ts
    // or after any successful build.
    expect(exists("public/system/library-index-lite.json")).toBe(true);
  });

  it("is valid JSON and an array of items", () => {
    if (!exists("public/system/library-index-lite.json")) return; // skip if not built
    const raw = read("public/system/library-index-lite.json");
    const items = JSON.parse(raw);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it("items in the JSON have no forbidden fields", () => {
    if (!exists("public/system/library-index-lite.json")) return;
    const items = JSON.parse(read("public/system/library-index-lite.json"));
    const sample = items.slice(0, 20);
    const forbidden = ["status", "category", "description", "sourceType", "sourcePath"];
    for (const field of forbidden) {
      const hasField = sample.some((item: Record<string, unknown>) => field in item);
      expect(hasField, `forbidden field "${field}" found in index`).toBe(false);
    }
  });

  it("all summaries in the JSON are ≤ 100 chars", () => {
    if (!exists("public/system/library-index-lite.json")) return;
    const items = JSON.parse(read("public/system/library-index-lite.json")) as LiteItem[];
    const violators = items.filter(i => i.summary && i.summary.length > 100);
    expect(violators).toHaveLength(0);
  });

  it("all tag arrays in the JSON have ≤ 3 items", () => {
    if (!exists("public/system/library-index-lite.json")) return;
    const items = JSON.parse(read("public/system/library-index-lite.json")) as LiteItem[];
    const violators = items.filter(i => i.tags.length > 3);
    expect(violators).toHaveLength(0);
  });

  it("all dates in the JSON are YYYY-MM-DD or null", () => {
    if (!exists("public/system/library-index-lite.json")) return;
    const items = JSON.parse(read("public/system/library-index-lite.json")) as LiteItem[];
    const violators = items.filter(i => i.date && i.date.length > 10);
    expect(violators).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Audit script exists
// ─────────────────────────────────────────────────────────────────────────────

describe("audit scripts", () => {
  it("scripts/audit-library-page-data.mjs exists", () => {
    expect(exists("scripts/audit-library-page-data.mjs")).toBe(true);
  });

  it("scripts/generate-library-index-lite.ts exists", () => {
    expect(exists("scripts/generate-library-index-lite.ts")).toBe(true);
  });

  it("audit script checks for forbidden fields", () => {
    const src = read("scripts/audit-library-page-data.mjs");
    expect(src).toMatch(/status.*category.*description|FORBIDDEN/);
  });

  it("audit script has 128 kB threshold check", () => {
    const src = read("scripts/audit-library-page-data.mjs");
    expect(src).toMatch(/128/);
  });

  it("package.json has audit:library-page-data script", () => {
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.scripts["audit:library-page-data"]).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. No behavioural regression — exported helpers still present
// ─────────────────────────────────────────────────────────────────────────────

describe("pages/library/index.tsx — public API preserved", () => {
  const SRC = "pages/library/index.tsx";

  it("still exports applyFilters", () => {
    expect(read(SRC)).toMatch(/export function applyFilters/);
  });

  it("still exports ctaLabel", () => {
    expect(read(SRC)).toMatch(/export function ctaLabel/);
  });

  it("still exports hasActiveFilters", () => {
    expect(read(SRC)).toMatch(/export function hasActiveFilters/);
  });

  it("still exports EMPTY_FILTERS", () => {
    expect(read(SRC)).toMatch(/export const EMPTY_FILTERS/);
  });

  it("getStaticProps returns initialItems (not items) — confirms split approach", () => {
    expect(read(SRC)).toMatch(/initialItems/);
  });

  it("page fetches /system/library-index-lite.json client-side", () => {
    expect(read(SRC)).toMatch(/library-index-lite\.json/);
  });

  it("does not ship status field in initial props (redundant — all items published)", () => {
    // getStaticProps should not include status in the serialized items
    const src = read(SRC);
    // The toLibraryLiteItem import confirms we use the shared serializer
    expect(src).toMatch(/toLibraryLiteItem/);
    // Should NOT have status: item.status in getStaticProps
    expect(src).not.toMatch(/status:\s*item\.status/);
  });

  it("does not ship category field in initial props", () => {
    expect(read(SRC)).not.toMatch(/category:\s*item\.category/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Page-data budget enforcement (post-build)
// ─────────────────────────────────────────────────────────────────────────────

describe("/library page-data size budget (post-build check)", () => {
  it("page-data JSON is below 128 kB after next build", () => {
    const pageDataPath = path.join(ROOT, ".next/server/pages/library.json");
    if (!fs.existsSync(pageDataPath)) {
      // Skip if build hasn't run yet — this check is run after P7 validation
      console.info("    [skip] .next/server/pages/library.json not found — run next build first");
      return;
    }
    const sizeKb = fs.statSync(pageDataPath).size / 1024;
    expect(sizeKb).toBeLessThan(128);
  });
});
