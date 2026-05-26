/**
 * tests/series/blog-series-wrapper.test.ts
 *
 * Tests for the blog series wrapper (lib/blog/series.ts).
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
  getBlogSeriesCatalogue,
  getBlogSeriesBySlug,
  getBlogSeriesPart,
  getBlogSeriesPartNeighbors,
  formatBlogSeriesPartNumber,
} from "@/lib/blog/series";

// Helper to create a mock blog post document
function mockBlogPost(overrides: Record<string, unknown> = {}) {
  return {
    type: "Post",
    docKind: "blog",
    title: "Test Post",
    description: "A test post description",
    excerpt: "A test excerpt",
    slug: "test-post",
    slugSafe: "test-post",
    date: "2026-01-15",
    draft: false,
    published: true,
    category: "Essays",
    tags: ["test"],
    readTime: "5 min read",
    readTimeSafe: "5 min read",
    series: "test-series",
    seriesOrder: 1,
    seriesTitle: "Test Series",
    seriesDescription: "A test series description",
    coverImage: "/images/test.jpg",
    accessLevel: "public",
    _id: "test-post-1",
    _raw: {
      flattenedPath: "blog/series/test-series/test-post",
      sourceFilePath: "blog/series/test-series/test-post.mdx",
      sourceFileName: "test-post.mdx",
    },
    ...overrides,
  };
}

describe("Blog Series Wrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only blog series", () => {
    mockGetDocuments.mockReturnValue([
      mockBlogPost({
        series: "blog-series",
        seriesTitle: "Blog Series",
        seriesOrder: 1,
        slug: "blog-part-1",
      }),
    ]);

    const result = getBlogSeriesCatalogue();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("blog-series");
  });

  it("getBlogSeriesBySlug returns correct series", () => {
    mockGetDocuments.mockReturnValue([
      mockBlogPost({
        series: "target-series",
        seriesTitle: "Target Series",
        seriesOrder: 1,
        slug: "part-1",
      }),
    ]);

    const result = getBlogSeriesBySlug("target-series");
    expect(result).toBeDefined();
    expect(result!.title).toBe("Target Series");
  });

  it("getBlogSeriesPart returns correct part", () => {
    mockGetDocuments.mockReturnValue([
      mockBlogPost({
        series: "test-series",
        seriesOrder: 1,
        slug: "part-1",
        title: "Part One",
      }),
      mockBlogPost({
        series: "test-series",
        seriesOrder: 2,
        slug: "part-2",
        title: "Part Two",
      }),
    ]);

    const series = getBlogSeriesBySlug("test-series");
    expect(series).toBeDefined();

    const part = getBlogSeriesPart(series!, "part-2");
    expect(part).toBeDefined();
    expect(part!.title).toBe("Part Two");
    expect(part!.order).toBe(2);
  });

  it("formatBlogSeriesPartNumber formats correctly", () => {
    expect(formatBlogSeriesPartNumber(1)).toBe("One");
    expect(formatBlogSeriesPartNumber(5)).toBe("Five");
    expect(formatBlogSeriesPartNumber(10)).toBe("Ten");
    expect(formatBlogSeriesPartNumber(11)).toBe("11");
  });

  it("getBlogSeriesPartNeighbors returns correct neighbors", () => {
    mockGetDocuments.mockReturnValue([
      mockBlogPost({
        series: "test-series",
        seriesOrder: 1,
        slug: "part-1",
      }),
      mockBlogPost({
        series: "test-series",
        seriesOrder: 2,
        slug: "part-2",
      }),
      mockBlogPost({
        series: "test-series",
        seriesOrder: 3,
        slug: "part-3",
      }),
    ]);

    const series = getBlogSeriesBySlug("test-series");
    expect(series).toBeDefined();

    const neighbors = getBlogSeriesPartNeighbors(series!, 2);
    expect(neighbors.previous).toBeDefined();
    expect(neighbors.previous!.order).toBe(1);
    expect(neighbors.next).toBeDefined();
    expect(neighbors.next!.order).toBe(3);
  });

  it("The Burden Changes Hands still resolves", () => {
    mockGetDocuments.mockReturnValue([
      mockBlogPost({
        series: "the-burden-changes-hands",
        seriesTitle: "The Burden Changes Hands",
        seriesOrder: 1,
        slug: "the-accountant-in-uruk",
        date: "2026-02-28",
      }),
      mockBlogPost({
        series: "the-burden-changes-hands",
        seriesTitle: "The Burden Changes Hands",
        seriesOrder: 2,
        slug: "knowledge-can-wait-the-question-is-whether-it-should",
        date: "2026-03-14",
      }),
    ]);

    const result = getBlogSeriesBySlug("the-burden-changes-hands");
    expect(result).toBeDefined();
    expect(result!.title).toBe("The Burden Changes Hands");
    expect(result!.parts.length).toBe(2);
  });

  it("The Truth in the Frame resolves", () => {
    mockGetDocuments.mockReturnValue([
      mockBlogPost({
        series: "the-truth-in-the-frame",
        seriesTitle: "The Truth in the Frame",
        seriesOrder: 1,
        slug: "before-the-word-what-the-cave-walls-remember",
        date: "2026-07-07",
        draft: true,
      }),
      mockBlogPost({
        series: "the-truth-in-the-frame",
        seriesTitle: "The Truth in the Frame",
        seriesOrder: 9,
        slug: "what-deserves-to-survive",
        date: "2026-09-01",
        draft: true,
      }),
    ]);

    const result = getBlogSeriesBySlug("the-truth-in-the-frame");
    // Since all parts are draft, the series should not be exposed publicly
    expect(result).toBeNull();
  });
});