/**
 * tests/series/series-resolver.test.ts
 *
 * Tests for the Contentlayer-driven series resolver.
 *
 * We mock the data layer (lib/series/data) to avoid requiring contentlayer/generated.
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
  resolveAllSeries,
  resolveSeriesBySlug,
} from "@/lib/series/resolver";

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

describe("Series Resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("resolveAllSeries", () => {
    it("groups documents by series slug", () => {
      mockGetDocuments.mockReturnValue([
        mockBlogPost({
          series: "series-a",
          seriesTitle: "Series A",
          seriesOrder: 1,
          slug: "part-1",
          date: "2026-01-01",
        }),
        mockBlogPost({
          series: "series-a",
          seriesTitle: "Series A",
          seriesOrder: 2,
          slug: "part-2",
          date: "2026-01-15",
        }),
        mockBlogPost({
          series: "series-b",
          seriesTitle: "Series B",
          seriesOrder: 1,
          slug: "part-1",
          date: "2026-02-01",
        }),
      ]);

      const result = resolveAllSeries("blog");
      expect(result).toHaveLength(2);

      const slugs = result.map((s) => s.slug);
      expect(slugs).toContain("series-a");
      expect(slugs).toContain("series-b");
    });

    it("sorts parts by seriesOrder ascending", () => {
      mockGetDocuments.mockReturnValue([
        mockBlogPost({
          series: "series-a",
          seriesOrder: 3,
          slug: "part-3",
          date: "2026-03-01",
        }),
        mockBlogPost({
          series: "series-a",
          seriesOrder: 1,
          slug: "part-1",
          date: "2026-01-01",
        }),
        mockBlogPost({
          series: "series-a",
          seriesOrder: 2,
          slug: "part-2",
          date: "2026-02-01",
        }),
      ]);

      const result = resolveAllSeries("blog");
      const seriesA = result.find((s) => s.slug === "series-a");
      expect(seriesA).toBeDefined();
      expect(seriesA!.parts.map((p) => p.order)).toEqual([1, 2, 3]);
    });

    it("sorts series by first published date descending", () => {
      mockGetDocuments.mockReturnValue([
        mockBlogPost({
          series: "older-series",
          seriesTitle: "Older Series",
          seriesOrder: 1,
          slug: "older-part-1",
          date: "2025-01-01",
        }),
        mockBlogPost({
          series: "newer-series",
          seriesTitle: "Newer Series",
          seriesOrder: 1,
          slug: "newer-part-1",
          date: "2026-06-01",
        }),
      ]);

      const result = resolveAllSeries("blog");
      expect(result).toHaveLength(2);
      // Newer series should come first
      expect(result[0].slug).toBe("newer-series");
      expect(result[1].slug).toBe("older-series");
    });

    it("drafts do not appear in public parts", () => {
      mockGetDocuments.mockReturnValue([
        mockBlogPost({
          series: "series-a",
          seriesOrder: 1,
          slug: "part-1",
          draft: false,
          published: true,
        }),
        mockBlogPost({
          series: "series-a",
          seriesOrder: 2,
          slug: "part-2",
          draft: true,
          published: true,
        }),
        mockBlogPost({
          series: "series-a",
          seriesOrder: 3,
          slug: "part-3",
          draft: false,
          published: true,
        }),
      ]);

      const result = resolveAllSeries("blog");
      const seriesA = result.find((s) => s.slug === "series-a");
      expect(seriesA).toBeDefined();
      expect(seriesA!.publishedPartCount).toBe(2);
      expect(seriesA!.partCount).toBe(2);
      const part2 = seriesA!.parts.find((p) => p.order === 2);
      expect(part2).toBeUndefined();
    });

    it("excludes series with zero published parts", () => {
      mockGetDocuments.mockReturnValue([
        mockBlogPost({
          series: "all-draft-series",
          seriesOrder: 1,
          slug: "draft-part",
          draft: true,
          published: false,
        }),
      ]);

      const result = resolveAllSeries("blog");
      const allDraft = result.find((s) => s.slug === "all-draft-series");
      expect(allDraft).toBeUndefined();
    });

    it("derives fallback title from slug when seriesTitle is absent", () => {
      mockGetDocuments.mockReturnValue([
        mockBlogPost({
          series: "my-custom-series",
          seriesTitle: undefined,
          seriesOrder: 1,
          slug: "part-1",
        }),
      ]);

      const result = resolveAllSeries("blog");
      const series = result.find((s) => s.slug === "my-custom-series");
      expect(series).toBeDefined();
      expect(series!.title).toBe("My Custom Series");
    });
  });

  describe("resolveSeriesBySlug", () => {
    it("returns null for non-existent series", () => {
      mockGetDocuments.mockReturnValue([]);

      const result = resolveSeriesBySlug("non-existent", "blog");
      expect(result).toBeNull();
    });

    it("returns the correct series by slug", () => {
      mockGetDocuments.mockReturnValue([
        mockBlogPost({
          series: "target-series",
          seriesTitle: "Target Series",
          seriesOrder: 1,
          slug: "part-1",
        }),
        mockBlogPost({
          series: "other-series",
          seriesTitle: "Other Series",
          seriesOrder: 1,
          slug: "other-part",
        }),
      ]);

      const result = resolveSeriesBySlug("target-series", "blog");
      expect(result).toBeDefined();
      expect(result!.title).toBe("Target Series");
      expect(result!.slug).toBe("target-series");
    });
  });
});
