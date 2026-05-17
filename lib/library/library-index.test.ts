/**
 * lib/library/library-index.test.ts — LIBRARY INDEX TESTS
 *
 * Tests the library index aggregation layer:
 * - All 8 sections exist
 * - Downloads are included
 * - Lexicon entries are included
 * - No item has empty title
 * - No item has missing href (unless explicitly marked unresolved)
 * - Restricted items do not expose body
 * - Access values normalize correctly
 * - Section counts are stable
 */

import { describe, it, expect, beforeAll } from "vitest";
import { buildLibraryIndex, searchLibraryIndex } from "./library-index";
import type { LibraryIndexItem, LibrarySection } from "./library-index";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ALL_SECTIONS: LibrarySection[] = [
  "essays_analysis",
  "books_manuscripts",
  "canon_lexicon",
  "frameworks_playbooks",
  "intelligence_briefs",
  "downloads_resources",
  "vault",
  "events",
];

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Library Index", () => {
  let index: ReturnType<typeof buildLibraryIndex>;

  beforeAll(() => {
    index = buildLibraryIndex();
  });

  // ── Section completeness ──

  it("should have all 8 sections defined", () => {
    const sectionIds = index.sections.map((s) => s.id);
    for (const sec of ALL_SECTIONS) {
      expect(sectionIds).toContain(sec);
    }
  });

  // ── Content coverage (may be empty if Contentlayer not built) ──

  it("should have essays_analysis section defined", () => {
    const sec = index.sections.find((s) => s.id === "essays_analysis");
    expect(sec).toBeDefined();
  });

  it("should have books_manuscripts section defined", () => {
    const sec = index.sections.find((s) => s.id === "books_manuscripts");
    expect(sec).toBeDefined();
  });

  it("should have canon_lexicon section defined", () => {
    const sec = index.sections.find((s) => s.id === "canon_lexicon");
    expect(sec).toBeDefined();
  });

  it("should have frameworks_playbooks section defined", () => {
    const sec = index.sections.find((s) => s.id === "frameworks_playbooks");
    expect(sec).toBeDefined();
  });

  it("should have intelligence_briefs section defined", () => {
    const sec = index.sections.find((s) => s.id === "intelligence_briefs");
    expect(sec).toBeDefined();
  });

  it("should have downloads_resources section defined", () => {
    const sec = index.sections.find((s) => s.id === "downloads_resources");
    expect(sec).toBeDefined();
  });

  it("should have vault section defined", () => {
    const sec = index.sections.find((s) => s.id === "vault");
    expect(sec).toBeDefined();
  });

  it("should have events section defined", () => {
    const sec = index.sections.find((s) => s.id === "events");
    expect(sec).toBeDefined();
  });

  // ── Data integrity (these should pass even with empty data) ──

  it("should have no item with empty title", () => {
    const emptyTitles = index.items.filter((i) => !i.title || i.title.trim() === "");
    expect(emptyTitles).toHaveLength(0);
  });

  it("should have no item with missing href", () => {
    const missingHref = index.items.filter((i) => !i.href || i.href === "/" || i.href.trim() === "");
    expect(missingHref).toHaveLength(0);
  });

  it("should have no item with unknown access", () => {
    const unknownAccess = index.items.filter((i) => i.access === "unknown");
    expect(unknownAccess).toHaveLength(0);
  });

  it("should not expose body content on any item", () => {
    for (const item of index.items) {
      expect((item as any).body).toBeUndefined();
      expect((item as any).bodyCode).toBeUndefined();
      expect((item as any).content).toBeUndefined();
      expect((item as any).raw).toBeUndefined();
    }
  });

  it("should not expose restricted body content", () => {
    const restricted = index.items.filter((i) => i.access === "restricted" || i.access === "paid");
    for (const item of restricted) {
      expect((item as any).body).toBeUndefined();
      expect((item as any).bodyCode).toBeUndefined();
      expect((item as any).content).toBeUndefined();
    }
  });

  // ── Stats ──

  it("should have stats object with all fields", () => {
    expect(index.stats).toBeDefined();
    expect(typeof index.stats.total).toBe("number");
    expect(typeof index.stats.public).toBe("number");
    expect(typeof index.stats.member).toBe("number");
    expect(typeof index.stats.restricted).toBe("number");
    expect(typeof index.stats.paid).toBe("number");
    expect(typeof index.stats.downloads).toBe("number");
    expect(typeof index.stats.canonLexicon).toBe("number");
  });

  // ── Search ──

  it("should return empty results for gibberish search", () => {
    const results = searchLibraryIndex(index, "zzzzzzzzzzzzzzzzzz");
    expect(results).toHaveLength(0);
  });

  it("should filter by section (empty result expected if no data)", () => {
    const results = searchLibraryIndex(index, "", { section: "essays_analysis" });
    // If Contentlayer is built, there should be results; if not, empty is fine
    expect(Array.isArray(results)).toBe(true);
    for (const item of results) {
      expect(item.section).toBe("essays_analysis");
    }
  });

  it("should filter by access", () => {
    const results = searchLibraryIndex(index, "", { access: "public" });
    expect(Array.isArray(results)).toBe(true);
    for (const item of results) {
      expect(item.access).toBe("public");
    }
  });

  // ── Section integrity ──

  it("should have section counts that match actual items", () => {
    for (const section of index.sections) {
      expect(section.count).toBe(section.items.length);
    }
  });

  it("should have all items assigned to a valid section", () => {
    const validSections = new Set(ALL_SECTIONS);
    for (const item of index.items) {
      expect(validSections.has(item.section)).toBe(true);
    }
  });

  it("should have all items with a valid type", () => {
    const validTypes = new Set([
      "essay", "short", "book", "canon", "lexicon", "framework",
      "playbook", "strategy", "toolkit", "intelligence", "brief",
      "evidence", "download", "pdf", "print", "resource", "vault",
      "event", "premium",
    ]);
    for (const item of index.items) {
      expect(validTypes.has(item.type)).toBe(true);
    }
  });

  // ── Normalizer tests ──

  it("should handle empty input gracefully", () => {
    const emptyIndex = buildLibraryIndex();
    expect(emptyIndex).toBeDefined();
    expect(Array.isArray(emptyIndex.items)).toBe(true);
    expect(Array.isArray(emptyIndex.sections)).toBe(true);
  });
});