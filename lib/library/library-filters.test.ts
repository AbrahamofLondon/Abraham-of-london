/**
 * lib/library/library-filters.test.ts
 *
 * Pure-function tests for the exported library filter helpers.
 * Covers: applyFilters, ctaLabel, hasActiveFilters, EMPTY_FILTERS.
 * No React, no jsdom — runs in vitest node environment.
 */

import { describe, it, expect } from "vitest";
import {
  applyFilters,
  ctaLabel,
  hasActiveFilters,
  EMPTY_FILTERS,
} from "@/pages/library/index";
import type { Filters } from "@/pages/library/index";
import type { LibraryIndexItem } from "@/lib/library/library-index";

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<LibraryIndexItem> = {}): LibraryIndexItem {
  return {
    id: "test-item",
    title: "Test Item",
    summary: "A test summary.",
    description: null,
    type: "essay",
    section: "essays_analysis",
    href: "/essays/test-item",
    access: "public",
    format: "article",
    status: "published",
    date: "2026-01-15",
    tags: [],
    category: null,
    featured: false,
    sourceType: "contentlayer",
    sourcePath: "content/posts/test-item.md",
    ...overrides,
  };
}

const publicItem     = makeItem({ id: "pub",  access: "public",     title: "Public Essay" });
const memberItem     = makeItem({ id: "mem",  access: "member",     title: "Member Essay",     section: "essays_analysis" });
const restrictedItem = makeItem({ id: "res",  access: "restricted", title: "Restricted Essay", type: "vault", section: "vault" });
const paidItem       = makeItem({ id: "paid", access: "paid",       title: "Paid Item",        type: "premium", section: "downloads_resources" });

const FIXTURE_ITEMS = [publicItem, memberItem, restrictedItem, paidItem];

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY_FILTERS
// ─────────────────────────────────────────────────────────────────────────────

describe("EMPTY_FILTERS", () => {
  it("has all fields empty or default", () => {
    expect(EMPTY_FILTERS.query).toBe("");
    expect(EMPTY_FILTERS.section).toBe("");
    expect(EMPTY_FILTERS.type).toBe("");
    expect(EMPTY_FILTERS.access).toBe("");
    expect(EMPTY_FILTERS.format).toBe("");
    expect(EMPTY_FILTERS.sort).toBe("recommended");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// hasActiveFilters
// ─────────────────────────────────────────────────────────────────────────────

describe("hasActiveFilters", () => {
  it("returns false for EMPTY_FILTERS", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });

  it("returns false when only sort differs (sort is not a filter dimension)", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, sort: "az" })).toBe(false);
  });

  it("returns true when query is set", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, query: "doctrine" })).toBe(true);
  });

  it("returns true when section is set", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, section: "canon_lexicon" })).toBe(true);
  });

  it("returns true when type is set", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, type: "framework" })).toBe(true);
  });

  it("returns true when access is set", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, access: "restricted" })).toBe(true);
  });

  it("returns true when format is set", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, format: "pdf" })).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyFilters — access chip logic
// ─────────────────────────────────────────────────────────────────────────────

describe("applyFilters — access chip", () => {
  it("returns all items when no filters active", () => {
    const result = applyFilters(FIXTURE_ITEMS, EMPTY_FILTERS);
    expect(result).toHaveLength(FIXTURE_ITEMS.length);
  });

  it("filters to public only when access=public", () => {
    const result = applyFilters(FIXTURE_ITEMS, { ...EMPTY_FILTERS, access: "public" });
    expect(result).toHaveLength(1);
    expect(result.at(0)!.access).toBe("public");
  });

  it("filters to member only when access=member", () => {
    const result = applyFilters(FIXTURE_ITEMS, { ...EMPTY_FILTERS, access: "member" });
    expect(result.every((i) => i.access === "member")).toBe(true);
  });

  it("filters to restricted only when access=restricted", () => {
    const result = applyFilters(FIXTURE_ITEMS, { ...EMPTY_FILTERS, access: "restricted" });
    expect(result.every((i) => i.access === "restricted")).toBe(true);
  });

  it("filters to paid only when access=paid", () => {
    const result = applyFilters(FIXTURE_ITEMS, { ...EMPTY_FILTERS, access: "paid" });
    expect(result.every((i) => i.access === "paid")).toBe(true);
  });

  it("returns empty when access filter matches nothing", () => {
    const items = [publicItem];
    const result = applyFilters(items, { ...EMPTY_FILTERS, access: "restricted" });
    expect(result).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyFilters — section pathway filter
// ─────────────────────────────────────────────────────────────────────────────

describe("applyFilters — section pathway", () => {
  const canonItem     = makeItem({ id: "c1", section: "canon_lexicon",       type: "canon",     title: "Canon Item" });
  const frameworkItem = makeItem({ id: "f1", section: "frameworks_playbooks", type: "framework", title: "Framework Item" });
  const essayItem     = makeItem({ id: "e1", section: "essays_analysis",      type: "essay",     title: "Essay Item" });
  const MIXED = [canonItem, frameworkItem, essayItem];

  it("filters to canon_lexicon section when section pathway clicked", () => {
    const result = applyFilters(MIXED, { ...EMPTY_FILTERS, section: "canon_lexicon" });
    expect(result).toHaveLength(1);
    expect(result.at(0)!.section).toBe("canon_lexicon");
  });

  it("filters to frameworks_playbooks section", () => {
    const result = applyFilters(MIXED, { ...EMPTY_FILTERS, section: "frameworks_playbooks" });
    expect(result).toHaveLength(1);
    expect(result.at(0)!.section).toBe("frameworks_playbooks");
  });

  it("returns all items after section cleared (section='')", () => {
    const result = applyFilters(MIXED, { ...EMPTY_FILTERS, section: "" });
    expect(result).toHaveLength(MIXED.length);
  });

  it("combines section and access filters correctly", () => {
    const pubCanon = makeItem({ id: "pc", section: "canon_lexicon",  type: "canon", access: "public" });
    const memCanon = makeItem({ id: "mc", section: "canon_lexicon",  type: "canon", access: "member" });
    const pubEssay = makeItem({ id: "pe", section: "essays_analysis", type: "essay", access: "public" });
    const items = [pubCanon, memCanon, pubEssay];

    const result = applyFilters(items, { ...EMPTY_FILTERS, section: "canon_lexicon", access: "public" });
    expect(result).toHaveLength(1);
    expect(result.at(0)!.id).toBe("pc");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyFilters — search query
// ─────────────────────────────────────────────────────────────────────────────

describe("applyFilters — search query", () => {
  it("returns empty array when query matches nothing", () => {
    const result = applyFilters(FIXTURE_ITEMS, { ...EMPTY_FILTERS, query: "zzzzzzzzzzz" });
    expect(result).toHaveLength(0);
  });

  it("matches on title (case-insensitive)", () => {
    const result = applyFilters(FIXTURE_ITEMS, { ...EMPTY_FILTERS, query: "public" });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((i) => i.title.toLowerCase().includes("public"))).toBe(true);
  });

  it("matches on summary", () => {
    const items = [makeItem({ summary: "This is about doctrine and frameworks.", title: "X" })];
    const result = applyFilters(items, { ...EMPTY_FILTERS, query: "doctrine" });
    expect(result).toHaveLength(1);
  });

  it("matches on tags", () => {
    const items = [makeItem({ tags: ["strategy", "canon"], title: "Y" })];
    const result = applyFilters(items, { ...EMPTY_FILTERS, query: "strategy" });
    expect(result).toHaveLength(1);
  });

  it("trims whitespace from query before matching", () => {
    const result = applyFilters(FIXTURE_ITEMS, { ...EMPTY_FILTERS, query: "   " });
    expect(result).toHaveLength(FIXTURE_ITEMS.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyFilters — sort orders
// ─────────────────────────────────────────────────────────────────────────────

describe("applyFilters — sort", () => {
  const jan  = makeItem({ id: "jan", title: "Zebra", date: "2026-01-01" });
  const mar  = makeItem({ id: "mar", title: "Apple", date: "2026-03-01" });
  const may  = makeItem({ id: "may", title: "Mango", date: "2026-05-01" });
  const DATED = [jan, may, mar];

  it("newest sort puts most recent first", () => {
    const result = applyFilters(DATED, { ...EMPTY_FILTERS, sort: "newest" });
    expect(result.at(0)!.date).toBe("2026-05-01");
    expect(result.at(-1)!.date).toBe("2026-01-01");
  });

  it("az sort is alphabetical by title", () => {
    const result = applyFilters(DATED, { ...EMPTY_FILTERS, sort: "az" });
    expect(result.at(0)?.title).toBe("Apple");
    expect(result.at(-1)?.title).toBe("Zebra");
  });

  it("restricted_first puts restricted and paid before public", () => {
    const result = applyFilters(FIXTURE_ITEMS, { ...EMPTY_FILTERS, sort: "restricted_first" });
    const accessOrder = result.map((i) => i.access);
    const restrictedIdx = accessOrder.indexOf("restricted");
    const paidIdx       = accessOrder.indexOf("paid");
    const publicIdx     = accessOrder.indexOf("public");
    expect(restrictedIdx).toBeLessThan(publicIdx);
    expect(paidIdx).toBeLessThan(publicIdx);
  });

  it("recommended sort does not throw and returns all items", () => {
    const result = applyFilters(FIXTURE_ITEMS, { ...EMPTY_FILTERS, sort: "recommended" });
    expect(result).toHaveLength(FIXTURE_ITEMS.length);
  });

  it("does not mutate the input array", () => {
    const before = DATED.map((i) => i.id);
    applyFilters(DATED, { ...EMPTY_FILTERS, sort: "newest" });
    expect(DATED.map((i) => i.id)).toEqual(before);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ctaLabel — access-aware CTA labels
// ─────────────────────────────────────────────────────────────────────────────

describe("ctaLabel", () => {
  it("returns 'Purchase / Unlock' for paid items", () => {
    expect(ctaLabel(makeItem({ access: "paid", href: "/premium/item" }))).toBe("Purchase / Unlock");
  });

  it("returns 'View access requirements' for restricted items", () => {
    expect(ctaLabel(makeItem({ access: "restricted", href: "/vault/item" }))).toBe("View access requirements");
  });

  it("returns brief-specific labels for public and restricted briefs", () => {
    expect(ctaLabel(makeItem({ type: "brief", access: "public", href: "/briefs/public" }))).toBe("Read brief");
    expect(ctaLabel(makeItem({ type: "brief", access: "restricted", href: "/briefs/restricted" }))).toBe("View metadata / Request access");
  });

  it("returns 'Member access' for member items", () => {
    expect(ctaLabel(makeItem({ access: "member", href: "/essays/member-essay" }))).toBe("Member access");
  });

  it("returns 'View metadata' for vault type (public/member)", () => {
    expect(ctaLabel(makeItem({ type: "vault", access: "public", href: "/vault/index" }))).toBe("View metadata");
  });

  it("returns 'View event' for event type", () => {
    expect(ctaLabel(makeItem({ type: "event", access: "public", href: "/events/thing", section: "events" }))).toBe("View event");
  });

  it("returns 'Download' for /assets/ hrefs", () => {
    expect(ctaLabel(makeItem({ href: "/assets/downloads/file.pdf", access: "public" }))).toBe("Download");
  });

  it("returns 'Download' for http external hrefs", () => {
    expect(ctaLabel(makeItem({ href: "https://external.example.com/file.pdf", access: "public" }))).toBe("Download");
  });

  it("returns 'Download' for pdf format", () => {
    expect(ctaLabel(makeItem({ format: "pdf", access: "public", href: "/downloads/doc" }))).toBe("Download");
  });

  it("returns 'Download' for epub format", () => {
    expect(ctaLabel(makeItem({ format: "epub", access: "public", href: "/downloads/book" }))).toBe("Download");
  });

  it("returns 'Read' for regular public article", () => {
    expect(ctaLabel(makeItem({ access: "public", href: "/essays/some-essay", format: "article" }))).toBe("Read");
  });

  it("returns 'Access route pending' when href is '#'", () => {
    expect(ctaLabel(makeItem({ href: "#" }))).toBe("Access route pending");
  });

  it("paid access takes priority over vault type", () => {
    expect(ctaLabel(makeItem({ access: "paid", type: "vault", href: "/vault/paid-item" }))).toBe("Purchase / Unlock");
  });

  it("restricted access takes priority over download format", () => {
    expect(ctaLabel(makeItem({ access: "restricted", format: "pdf", href: "/restricted/file.pdf" }))).toBe("View access requirements");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Clear filters: EMPTY_FILTERS resets all fields
// ─────────────────────────────────────────────────────────────────────────────

describe("clear filters behaviour", () => {
  it("spreading EMPTY_FILTERS over active filters resets everything", () => {
    const active: Filters = {
      query: "doctrine",
      section: "canon_lexicon",
      type: "framework",
      access: "restricted",
      format: "pdf",
      sort: "az",
    };
    const cleared = { ...active, ...EMPTY_FILTERS };
    expect(hasActiveFilters(cleared)).toBe(false);
    expect(cleared.sort).toBe("recommended");
  });

  it("clearing filters returns all items", () => {
    const filtered = applyFilters(FIXTURE_ITEMS, { ...EMPTY_FILTERS, access: "restricted" });
    expect(filtered.length).toBeLessThan(FIXTURE_ITEMS.length);

    const cleared = applyFilters(FIXTURE_ITEMS, EMPTY_FILTERS);
    expect(cleared).toHaveLength(FIXTURE_ITEMS.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// No body/content leakage in filter output
// ─────────────────────────────────────────────────────────────────────────────

describe("no body content leakage", () => {
  it("applyFilters output items have no body field", () => {
    const result = applyFilters(FIXTURE_ITEMS, EMPTY_FILTERS);
    for (const item of result) {
      const r = item as unknown as Record<string, unknown>;
      expect(r.body).toBeUndefined();
      expect(r.bodyCode).toBeUndefined();
      expect(r.content).toBeUndefined();
      expect(r.raw).toBeUndefined();
    }
  });

  it("restricted items in filter output have no body field", () => {
    const result = applyFilters(FIXTURE_ITEMS, { ...EMPTY_FILTERS, access: "restricted" });
    for (const item of result) {
      const r = item as unknown as Record<string, unknown>;
      expect(r.body).toBeUndefined();
      expect(r.content).toBeUndefined();
    }
  });
});
