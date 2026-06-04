/**
 * tests/content/editorials-series.test.ts
 *
 * Regression tests for the Editorial Series section on /editorials.
 *
 * Root cause of prior regression:
 *   The editorial series was loaded via getEditorialSeriesCatalogue() which
 *   reads .contentlayer/generated/EditorialSeriesPart/_index.json from disk.
 *   During Vercel ISR revalidation, .contentlayer/ is unavailable, so
 *   resolveAllSeries() returned [] and the section disappeared.
 *
 * Fix: CURATED_EDITORIAL_SERIES hardcodes the three series in the page.
 *   This test asserts that fix holds.
 *
 * Run: pnpm exec vitest run tests/content/editorials-series.test.ts
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");
const EDITORIALS_PAGE = path.join(ROOT, "pages", "editorials", "index.tsx");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readPage(): string {
  return fs.readFileSync(EDITORIALS_PAGE, "utf-8");
}

// ─── Regression: Editorial Series no longer uses runtime filesystem reads ─────

describe("Editorial Series — ISR regression prevention", () => {
  it("page does not import getEditorialSeriesCatalogue (runtime filesystem dependency)", () => {
    const content = readPage();
    // Must not have an active import — comments are allowed as documentation
    expect(content).not.toMatch(/import\s*\{[^}]*getEditorialSeriesCatalogue/);
  });

  it("page does not use the dynamic series prop in JSX", () => {
    const content = readPage();
    // The old pattern {series.length > 0 ? ... : null} must not exist
    expect(content).not.toMatch(/series\.length/);
  });

  it("page uses CURATED_EDITORIAL_SERIES constant (runtime-safe)", () => {
    expect(readPage()).toMatch(/CURATED_EDITORIAL_SERIES/);
  });

  it("CURATED_EDITORIAL_SERIES is rendered unconditionally (no conditional guard)", () => {
    const content = readPage();
    // The constant must be referenced in .map() without a truthy guard
    expect(content).toMatch(/CURATED_EDITORIAL_SERIES\.map/);
    // Must NOT be behind a ternary/conditional
    expect(content).not.toMatch(/CURATED_EDITORIAL_SERIES\.length.*\?/);
  });

  it("getStaticProps does not pass series to props", () => {
    const content = readPage();
    // series should not be in the returned props object
    expect(content).not.toMatch(/return \{ props: \{[^}]*series/);
  });
});

// ─── All three editorial series present ───────────────────────────────────────

describe("Editorial Series — three series always present", () => {
  it("The Mind's Clay is in CURATED_EDITORIAL_SERIES", () => {
    expect(readPage()).toMatch(/The Mind's Clay/);
  });

  it("Outsourcing Our Sense of Meaning and Belonging is present", () => {
    expect(readPage()).toMatch(/Outsourcing Our Sense of Meaning and Belonging/);
  });

  it("The Mind's Clay — Series 2 is present", () => {
    expect(readPage()).toMatch(/The Mind's Clay.*Series 2/);
  });

  it("all three series have correct part counts", () => {
    const content = readPage();
    expect(content).toMatch(/partCount: 9/);  // Mind's Clay
    expect(content).toMatch(/partCount: 6/);  // Outsourcing
    expect(content).toMatch(/partCount: 7/);  // Mind's Clay 2
  });

  it("all three series have displayStatus set", () => {
    const content = readPage();
    expect(content).toMatch(/displayStatus: "Complete"/);
    expect(content).toMatch(/displayStatus: "In progress"/);
    expect(content).toMatch(/displayStatus: "Scheduled"/);
  });

  it("all three series have correct slugs for routing", () => {
    const content = readPage();
    expect(content).toMatch(/slug: "the-minds-clay"/);
    expect(content).toMatch(/slug: "outsourcing-our-sense-of-meaning-and-belonging"/);
    expect(content).toMatch(/slug: "the-minds-clay-2"/);
  });
});

// ─── Applied Essay Series still present ───────────────────────────────────────

describe("Applied Essay Series — not removed", () => {
  it("APPLIED_SERIES constant still exists", () => {
    expect(readPage()).toMatch(/APPLIED_SERIES/);
  });

  it("The Burden Changes Hands is still present", () => {
    expect(readPage()).toMatch(/The Burden Changes Hands/);
  });

  it("The Science of Inherited Selves is still present", () => {
    expect(readPage()).toMatch(/The Science of Inherited Selves/);
  });
});

// ─── Content files exist for all three curated series ─────────────────────────

describe("Editorial Series — source content files exist", () => {
  const SERIES_DIR = path.join(ROOT, "content", "editorial-series");

  it("content/editorial-series/the-minds-clay/ exists with parts", () => {
    const dir = path.join(SERIES_DIR, "the-minds-clay");
    expect(fs.existsSync(dir)).toBe(true);
    const parts = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
    expect(parts.length).toBe(9);
  });

  it("content/editorial-series/outsourcing-our-sense-of-meaning-and-belonging/ exists with parts", () => {
    const dir = path.join(SERIES_DIR, "outsourcing-our-sense-of-meaning-and-belonging");
    expect(fs.existsSync(dir)).toBe(true);
    const parts = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
    expect(parts.length).toBe(6);
  });

  it("content/editorial-series/the-minds-clay-2/ exists with parts", () => {
    const dir = path.join(SERIES_DIR, "the-minds-clay-2");
    expect(fs.existsSync(dir)).toBe(true);
    const parts = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
    expect(parts.length).toBe(7);
  });
});
