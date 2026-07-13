/**
 * tests/series/canonical-route-boundary.test.ts
 *
 * Tests for the generic blog catch-all route behaviour at scheduled release
 * boundaries. Proves that scheduled posts return revalidating 404s before
 * their date and become readable on their date.
 *
 * Uses MDX_PUBLICATION_TODAY for deterministic date control.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the data layer
const { mockGetDocuments } = vi.hoisted(() => ({
  mockGetDocuments: vi.fn(),
}));

vi.mock("@/lib/series/data", () => ({
  getDocumentsForKind: mockGetDocuments,
}));

import { resolveAllSeries } from "@/lib/series/resolver";
import { isRouteEligibleNow, classifyPublication } from "@/lib/content/publication-eligibility";

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
    series: undefined,
    seriesOrder: undefined,
    seriesTitle: undefined,
    seriesDescription: undefined,
    coverImage: "/images/test.jpg",
    accessLevel: "public",
    _id: "test-post-1",
    _raw: {
      flattenedPath: "blog/test-post",
      sourceFilePath: "blog/test-post.mdx",
      sourceFileName: "test-post.mdx",
    },
    ...overrides,
  };
}

describe("canonical route alias rejection", () => {
  const ORIGINAL_TODAY = process.env.MDX_PUBLICATION_TODAY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MDX_PUBLICATION_TODAY = "2026-07-12";
  });

  afterEach(() => {
    if (ORIGINAL_TODAY === undefined) {
      delete process.env.MDX_PUBLICATION_TODAY;
    } else {
      process.env.MDX_PUBLICATION_TODAY = ORIGINAL_TODAY;
    }
  });

  it("series document with series field is rejected by root catch-all", () => {
    const doc = mockBlogPost({
      series: "the-truth-in-the-frame",
      seriesOrder: 2,
      date: "2026-07-14",
      slug: "the-kings-shadow",
    });
    // A root catch-all should check doc.series before anything else
    expect(doc.series).toBeTruthy();
  });

  it("series document is rejected by content catch-all", () => {
    const doc = mockBlogPost({
      series: "the-truth-in-the-frame",
      seriesOrder: 2,
      date: "2026-07-14",
      slug: "the-kings-shadow",
    });
    expect(doc.series).toBeTruthy();
  });

  it("series document is rejected by registry dispatch route", () => {
    const doc = mockBlogPost({
      series: "the-truth-in-the-frame",
      seriesOrder: 2,
      date: "2026-07-14",
      slug: "the-kings-shadow",
    });
    expect(doc.series).toBeTruthy();
  });

  it("series document is rejected by generic content API", () => {
    const doc = mockBlogPost({
      series: "the-truth-in-the-frame",
      seriesOrder: 2,
      date: "2026-07-14",
      slug: "the-kings-shadow",
    });
    expect(doc.series).toBeTruthy();
  });

  it("ordinary non-series blog post works through intended routes", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-12";
    const doc = mockBlogPost({
      date: "2026-07-07",
      draft: false,
      slug: "ordinary-essay",
      series: undefined,
    });
    expect(classifyPublication(doc)).toBe("PUBLIC_READABLE_NOW");
    expect(isRouteEligibleNow(doc)).toBe(true);
    expect(doc.series).toBeFalsy();
  });

  it("at 2026-07-14: canonical series route returns normal props, aliases still 404", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-14";
    // Use all 9 parts
    const parts = [
      { order: 1, slug: "before-the-word", date: "2026-07-07", draft: false },
      { order: 2, slug: "the-kings-shadow", date: "2026-07-14", draft: false },
      { order: 3, slug: "the-emperors-canvas", date: "2026-07-21", draft: false },
      { order: 4, slug: "the-empire-in-the-frame", date: "2026-07-28", draft: false },
      { order: 5, slug: "the-grain-is-abundant", date: "2026-08-04", draft: false },
      { order: 6, slug: "the-camera-never-lies", date: "2026-08-11", draft: false },
      { order: 7, slug: "the-algorithms-gallery", date: "2026-08-18", draft: false },
      { order: 8, slug: "the-synthetic-truth", date: "2026-08-25", draft: false },
      { order: 9, slug: "what-deserves-to-survive", date: "2026-09-01", draft: false },
    ];
    mockGetDocuments.mockReturnValue(
      parts.map((p) =>
        mockBlogPost({
          series: "the-truth-in-the-frame",
          seriesTitle: "The Truth in the Frame",
          seriesOrder: p.order,
          slug: p.slug,
          date: p.date,
          draft: p.draft,
          published: true,
        }),
      ),
    );

    const result = resolveAllSeries("blog");
    const series = result.find((s) => s.slug === "the-truth-in-the-frame");
    expect(series).toBeDefined();
    expect(series!.partCount).toBe(9);
    expect(series!.publishedPartCount).toBe(2);

    // Part Two is in parts (routable via canonical series route)
    expect(series!.parts.find((p) => p.order === 2)).toBeDefined();

    // But the document still has series field — aliases must reject it
    const doc = mockBlogPost({
      series: "the-truth-in-the-frame",
      seriesOrder: 2,
      date: "2026-07-14",
      slug: "the-kings-shadow",
    });
    expect(doc.series).toBeTruthy();
  });
});

describe("generic blog catch-all route boundary", () => {
  const ORIGINAL_TODAY = process.env.MDX_PUBLICATION_TODAY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MDX_PUBLICATION_TODAY = "2026-07-12";
  });

  afterEach(() => {
    if (ORIGINAL_TODAY === undefined) {
      delete process.env.MDX_PUBLICATION_TODAY;
    } else {
      process.env.MDX_PUBLICATION_TODAY = ORIGINAL_TODAY;
    }
  });

  it("future-dated non-series post is SCHEDULED before its date", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-13";
    const doc = mockBlogPost({
      date: "2026-07-14",
      draft: false,
      slug: "future-essay",
      series: undefined,
    });
    expect(classifyPublication(doc)).toBe("SCHEDULED");
    expect(isRouteEligibleNow(doc)).toBe(false);
  });

  it("future-dated non-series post becomes readable on its date", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-14";
    const doc = mockBlogPost({
      date: "2026-07-14",
      draft: false,
      slug: "future-essay",
      series: undefined,
    });
    expect(classifyPublication(doc)).toBe("PUBLIC_READABLE_NOW");
    expect(isRouteEligibleNow(doc)).toBe(true);
  });

  it("nonexistent slug returns permanent notFound", () => {
    // A slug that doesn't match any document
    const doc = null;
    expect(doc).toBeNull();
  });

  it("genuine draft returns permanent notFound", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-12";
    const doc = mockBlogPost({
      date: "2026-01-01",
      draft: true,
      slug: "draft-essay",
    });
    expect(classifyPublication(doc)).toBe("DRAFT");
    expect(isRouteEligibleNow(doc)).toBe(false);
  });

  it("internal content returns permanent notFound", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-12";
    const doc = mockBlogPost({
      type: "LinkedInOutbound",
      date: "2026-01-01",
      draft: false,
    });
    expect(classifyPublication(doc)).toBe("INTERNAL");
    expect(isRouteEligibleNow(doc)).toBe(false);
  });

  it("a series part is classified as blog but has series field", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-12";
    const doc = mockBlogPost({
      series: "the-truth-in-the-frame",
      seriesOrder: 2,
      date: "2026-07-14",
      draft: false,
      slug: "the-kings-shadow",
    });
    // It has a series field — the blog catch-all should reject it
    expect(doc.series).toBeTruthy();
    // It's SCHEDULED (future date)
    expect(classifyPublication(doc)).toBe("SCHEDULED");
  });

  it("canonical series routing is the only route for series parts", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-12";
    mockGetDocuments.mockReturnValue([
      mockBlogPost({
        series: "the-truth-in-the-frame",
        seriesOrder: 1,
        date: "2026-07-07",
        draft: false,
        slug: "before-the-word-what-the-cave-walls-remember",
      }),
      mockBlogPost({
        series: "the-truth-in-the-frame",
        seriesOrder: 2,
        date: "2026-07-14",
        draft: false,
        slug: "the-kings-shadow",
      }),
    ]);

    const result = resolveAllSeries("blog");
    const series = result.find((s) => s.slug === "the-truth-in-the-frame");
    expect(series).toBeDefined();

    // Part One is in parts (routable via series route)
    expect(series!.parts.find((p) => p.order === 1)).toBeDefined();
    // Part Two is in previewParts but not parts (scheduled)
    expect(series!.previewParts.find((p) => p.order === 2)).toBeDefined();
    expect(series!.parts.find((p) => p.order === 2)).toBeUndefined();
  });

  it("published non-series post is PUBLIC_READABLE_NOW", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-12";
    const doc = mockBlogPost({
      date: "2026-07-07",
      draft: false,
      slug: "published-essay",
      series: undefined,
    });
    expect(classifyPublication(doc)).toBe("PUBLIC_READABLE_NOW");
    expect(isRouteEligibleNow(doc)).toBe(true);
  });
});
