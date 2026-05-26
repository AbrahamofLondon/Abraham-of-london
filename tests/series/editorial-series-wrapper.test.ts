/**
 * tests/series/editorial-series-wrapper.test.ts
 *
 * Tests for the editorial series wrapper (lib/editorial/series.ts).
 * Verifies backward compatibility and correct delegation to the resolver.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the data layer
const { mockGetDocuments } = vi.hoisted(() => ({
  mockGetDocuments: vi.fn(),
}));

vi.mock("@/lib/series/data", () => ({
  getDocumentsForKind: mockGetDocuments,
}));

import {
  getEditorialSeriesCatalogue,
  getEditorialSeriesBySlug,
  getEditorialSeriesPart,
  getEditorialSeriesPartNeighbors,
  formatEditorialSeriesPartNumber,
} from "@/lib/editorial/series";

// Helper to create a mock editorial series part document
function mockEditorialPart(overrides: Record<string, unknown> = {}) {
  return {
    type: "EditorialSeriesPart",
    docKind: "editorial-series",
    title: "Test Editorial Part",
    description: "A test editorial part description",
    excerpt: "A test editorial excerpt",
    slug: "test-editorial-part",
    slugSafe: "test-editorial-part",
    date: "2026-03-01",
    draft: false,
    published: true,
    category: "Serial Works",
    tags: ["cognition"],
    readTime: "10 min read",
    readTimeSafe: "10 min read",
    series: "Test Editorial Series",
    seriesOrder: 1,
    seriesTitle: "Test Editorial Series",
    seriesDescription: "A test editorial series description",
    accessLevel: "public",
    _id: "test-editorial-1",
    _raw: {
      flattenedPath: "editorial-series/test-editorial-series/test-editorial-part",
      sourceFilePath: "editorial-series/test-editorial-series/test-editorial-part.mdx",
      sourceFileName: "test-editorial-part.mdx",
    },
    ...overrides,
  };
}

describe("Editorial Series Wrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only editorial series", () => {
    mockGetDocuments.mockReturnValue([
      mockEditorialPart({
        series: "Editorial Series One",
        seriesTitle: "Editorial Series One",
        seriesOrder: 1,
        slug: "part-1",
      }),
    ]);

    const result = getEditorialSeriesCatalogue();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("editorial-series-one");
  });

  it("getEditorialSeriesBySlug returns correct series", () => {
    mockGetDocuments.mockReturnValue([
      mockEditorialPart({
        series: "Target Series",
        seriesTitle: "Target Series",
        seriesOrder: 1,
        slug: "part-1",
      }),
    ]);

    const result = getEditorialSeriesBySlug("target-series");
    expect(result).toBeDefined();
    expect(result!.title).toBe("Target Series");
  });

  it("getEditorialSeriesPart returns correct part", () => {
    mockGetDocuments.mockReturnValue([
      mockEditorialPart({
        series: "Test Series",
        seriesOrder: 1,
        slug: "part-1",
        title: "Part One",
      }),
      mockEditorialPart({
        series: "Test Series",
        seriesOrder: 2,
        slug: "part-2",
        title: "Part Two",
      }),
    ]);

    const series = getEditorialSeriesBySlug("test-series");
    expect(series).toBeDefined();

    const part = getEditorialSeriesPart(series!, "part-2");
    expect(part).toBeDefined();
    expect(part!.title).toBe("Part Two");
    expect(part!.order).toBe(2);
  });

  it("formatEditorialSeriesPartNumber formats correctly", () => {
    expect(formatEditorialSeriesPartNumber(0)).toBe("Zero");
    expect(formatEditorialSeriesPartNumber(1)).toBe("One");
    expect(formatEditorialSeriesPartNumber(5)).toBe("Five");
    expect(formatEditorialSeriesPartNumber(10)).toBe("10");
  });

  it("EditorialSeries type has mdxSlug field", () => {
    mockGetDocuments.mockReturnValue([
      mockEditorialPart({
        series: "Test Series",
        seriesOrder: 1,
        slug: "part-1",
      }),
    ]);

    const series = getEditorialSeriesBySlug("test-series");
    expect(series).toBeDefined();
    expect(series!.parts[0].mdxSlug).toBeDefined();
    expect(series!.parts[0].mdxSlug).toBe("part-1");
  });

  it("The Mind's Clay still resolves", () => {
    // The Mind's Clay uses series: "The Mind's Clay" (display name, not slug)
    mockGetDocuments.mockReturnValue([
      mockEditorialPart({
        series: "The Mind's Clay",
        seriesTitle: "The Mind's Clay",
        seriesOrder: 1,
        slug: "the-vessel-and-the-voice",
        date: "2026-05-22",
      }),
      mockEditorialPart({
        series: "The Mind's Clay",
        seriesTitle: "The Mind's Clay",
        seriesOrder: 2,
        slug: "the-first-external-hard-drive",
        date: "2026-05-22",
      }),
    ]);

    // The slug is normalised from "The Mind's Clay" to "the-minds-clay"
    const result = getEditorialSeriesBySlug("the-minds-clay");
    expect(result).toBeDefined();
    expect(result!.title).toBe("The Mind's Clay");
    expect(result!.parts.length).toBe(2);
    expect(result!.parts[0].mdxSlug).toBe("the-vessel-and-the-voice");
  });

  it("page-facing fields are backward compatible", () => {
    mockGetDocuments.mockReturnValue([
      mockEditorialPart({
        series: "Backward Compat Series",
        seriesTitle: "Backward Compat Series",
        seriesOrder: 1,
        slug: "part-1",
        title: "Part One",
        excerpt: "Excerpt for part one",
        readTime: "5 min read",
      }),
    ]);

    const result = getEditorialSeriesBySlug("backward-compat-series");
    expect(result).toBeDefined();

    // Check EditorialSeries-specific fields
    expect(result!.id).toBe("editorial-series-backward-compat-series");
    expect(result!.slug).toBe("backward-compat-series");
    expect(result!.title).toBe("Backward Compat Series");
    expect(result!.descriptor).toBe("A test editorial series description");
    expect(result!.partCount).toBe(1);
    expect(result!.status).toBe("PUBLISHED");

    // Check part fields
    expect(result!.parts[0].title).toBe("Part One");
    expect(result!.parts[0].excerpt).toBe("Excerpt for part one");
    expect(result!.parts[0].readTime).toBe("5 min read");
    expect(result!.parts[0].order).toBe(1);
    expect(result!.parts[0].status).toBe("PUBLISHED");
    expect(result!.parts[0].mdxSlug).toBe("part-1");
  });
});