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
          date: "2026-05-01", // Past date — 2026-06-01 is future, gets SCHEDULED_HIDDEN
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

  describe("scheduled / preview-visible editorial series", () => {
    it("includes series when all parts are SCHEDULED with preview permission", () => {
      // Simulate six editorial-series parts, all future-dated with seriesVisibility:scheduled
      // Slug is derived from directory name: "outsourcing-our-sense-of-meaning-and-belonging"
      mockGetDocuments.mockReturnValue([
        {
          type: "EditorialSeriesPart",
          docKind: "editorial-series",
          title: "Part One",
          description: "First part",
          excerpt: "First excerpt",
          slug: "part-one",
          slugSafe: "part-one",
          date: "2026-07-13", // future
          draft: false,
          published: true,
          category: "Special Edition",
          tags: ["test"],
          readTime: "10 min read",
          readTimeSafe: "10 min read",
          series: "Outsourcing Our Sense of Meaning and Belonging",
          seriesOrder: 1,
          seriesTitle: "Test Scheduled Series",
          seriesDescription: "A scheduled series description",
          seriesVisibility: "scheduled",
          accessLevel: "public",
          _id: "part-1",
          _raw: {
            flattenedPath: "editorial-series/outsourcing-our-sense-of-meaning-and-belonging/part-one",
            sourceFilePath: "editorial-series/outsourcing-our-sense-of-meaning-and-belonging/part-one.mdx",
            sourceFileName: "part-one.mdx",
            sourceFileDir: "editorial-series/outsourcing-our-sense-of-meaning-and-belonging",
          },
        },
        {
          type: "EditorialSeriesPart",
          docKind: "editorial-series",
          title: "Part Two",
          description: "Second part",
          excerpt: "Second excerpt",
          slug: "part-two",
          slugSafe: "part-two",
          date: "2026-07-20", // future
          draft: false,
          published: true,
          category: "Special Edition",
          tags: ["test"],
          readTime: "10 min read",
          readTimeSafe: "10 min read",
          series: "Outsourcing Our Sense of Meaning and Belonging",
          seriesOrder: 2,
          seriesTitle: "Test Scheduled Series",
          seriesDescription: "A scheduled series description",
          seriesVisibility: "scheduled",
          accessLevel: "public",
          _id: "part-2",
          _raw: {
            flattenedPath: "editorial-series/outsourcing-our-sense-of-meaning-and-belonging/part-two",
            sourceFilePath: "editorial-series/outsourcing-our-sense-of-meaning-and-belonging/part-two.mdx",
            sourceFileName: "part-two.mdx",
            sourceFileDir: "editorial-series/outsourcing-our-sense-of-meaning-and-belonging",
          },
        },
      ]);

      const result = resolveAllSeries("editorial");
      const series = result.find((s) => s.slug === "outsourcing-our-sense-of-meaning-and-belonging");
      expect(series).toBeDefined();
      expect(series!.slug).toBe("outsourcing-our-sense-of-meaning-and-belonging");
      // All parts are SCHEDULED → previewParts should contain both
      expect(series!.previewParts).toHaveLength(2);
      // No parts are PUBLIC_READABLE_NOW → published parts should be empty
      expect(series!.parts).toHaveLength(0);
      expect(series!.publishedPartCount).toBe(0);
    });

    it("does not fall into MIXED_REVIEW when all parts are consistently SCHEDULED", () => {
      mockGetDocuments.mockReturnValue([
        {
          type: "EditorialSeriesPart",
          docKind: "editorial-series",
          title: "Part One",
          description: "First part",
          excerpt: "First excerpt",
          slug: "part-one",
          slugSafe: "part-one",
          date: "2026-07-13", // future
          draft: false,
          published: true,
          category: "Special Edition",
          tags: ["test"],
          readTime: "5 min read",
          readTimeSafe: "5 min read",
          series: "Consistent Scheduled Series",
          seriesOrder: 1,
          seriesTitle: "Consistent Scheduled Series",
          seriesDescription: "All parts future-dated",
          seriesVisibility: "scheduled",
          accessLevel: "public",
          _id: "part-1",
          _raw: {
            flattenedPath: "editorial-series/consistent-scheduled-series/part-one",
            sourceFilePath: "editorial-series/consistent-scheduled-series/part-one.mdx",
            sourceFileName: "part-one.mdx",
            sourceFileDir: "editorial-series/consistent-scheduled-series",
          },
        },
        {
          type: "EditorialSeriesPart",
          docKind: "editorial-series",
          title: "Part Two",
          description: "Second part",
          excerpt: "Second excerpt",
          slug: "part-two",
          slugSafe: "part-two",
          date: "2026-07-20", // future
          draft: false,
          published: true,
          category: "Special Edition",
          tags: ["test"],
          readTime: "5 min read",
          readTimeSafe: "5 min read",
          series: "Consistent Scheduled Series",
          seriesOrder: 2,
          seriesTitle: "Consistent Scheduled Series",
          seriesDescription: "All parts future-dated",
          seriesVisibility: "scheduled",
          accessLevel: "public",
          _id: "part-2",
          _raw: {
            flattenedPath: "editorial-series/consistent-scheduled-series/part-two",
            sourceFilePath: "editorial-series/consistent-scheduled-series/part-two.mdx",
            sourceFileName: "part-two.mdx",
            sourceFileDir: "editorial-series/consistent-scheduled-series",
          },
        },
      ]);

      const result = resolveAllSeries("editorial");
      const series = result.find((s) => s.slug === "consistent-scheduled-series");
      expect(series).toBeDefined();
      // Series should NOT be skipped — it should be SCHEDULED_VISIBLE
      expect(series!.status).toBe("DRAFT"); // SCHEDULED_VISIBLE maps to DRAFT status
      // All parts should be in previewParts
      expect(series!.previewParts).toHaveLength(2);
    });

    it("excludes series when all parts are DRAFT without preview permission", () => {
      mockGetDocuments.mockReturnValue([
        {
          type: "EditorialSeriesPart",
          docKind: "editorial-series",
          title: "Draft Part",
          description: "A draft",
          excerpt: "Draft excerpt",
          slug: "draft-part",
          slugSafe: "draft-part",
          date: "2026-01-01", // past
          draft: true,
          published: true,
          category: "Special Edition",
          tags: ["test"],
          readTime: "5 min read",
          readTimeSafe: "5 min read",
          series: "Hidden Draft Series",
          seriesOrder: 1,
          seriesTitle: "Hidden Draft Series",
          seriesVisibility: "hidden", // no preview permission
          accessLevel: "public",
          _id: "draft-1",
          _raw: {
            flattenedPath: "editorial-series/hidden-draft-series/draft-part",
            sourceFilePath: "editorial-series/hidden-draft-series/draft-part.mdx",
            sourceFileName: "draft-part.mdx",
            sourceFileDir: "editorial-series/hidden-draft-series",
          },
        },
      ]);

      const result = resolveAllSeries("editorial");
      const series = result.find((s) => s.slug === "hidden-draft-series");
      expect(series).toBeUndefined();
    });

    it("resolves scheduled series by slug for preview", () => {
      mockGetDocuments.mockReturnValue([
        {
          type: "EditorialSeriesPart",
          docKind: "editorial-series",
          title: "Preview Part",
          description: "Preview",
          excerpt: "Preview excerpt",
          slug: "preview-part",
          slugSafe: "preview-part",
          date: "2026-07-13", // future
          draft: false,
          published: true,
          category: "Special Edition",
          tags: ["test"],
          readTime: "5 min read",
          readTimeSafe: "5 min read",
          series: "Preview Series",
          seriesOrder: 1,
          seriesTitle: "Preview Series",
          seriesVisibility: "scheduled",
          accessLevel: "public",
          _id: "preview-1",
          _raw: {
            flattenedPath: "editorial-series/preview-series/preview-part",
            sourceFilePath: "editorial-series/preview-series/preview-part.mdx",
            sourceFileName: "preview-part.mdx",
            sourceFileDir: "editorial-series/preview-series",
          },
        },
      ]);

      const result = resolveSeriesBySlug("preview-series", "editorial");
      expect(result).toBeDefined();
      expect(result!.slug).toBe("preview-series");
      // No published parts — all scheduled
      expect(result!.publishedPartCount).toBe(0);
      expect(result!.previewParts).toHaveLength(1);
    });
  });
});
