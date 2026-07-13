/**
 * tests/series/route-publication-gate.test.ts
 *
 * Regression tests for date-aware route eligibility across generic content
 * routes and APIs.
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

import { resolveAllSeries, resolveSeriesBySlug } from "@/lib/series/resolver";
import { isRouteEligibleNow } from "@/lib/content/publication-eligibility";
import { getDocKind } from "@/lib/content/shared";

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

function makeTruthParts() {
  return [
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
}

function mockTruthParts(parts: { order: number; slug: string; date: string; draft: boolean }[]) {
  mockGetDocuments.mockReturnValue(
    parts.map((p) =>
      mockBlogPost({
        series: "the-truth-in-the-frame",
        seriesTitle: "The Truth in the Frame",
        seriesDescription: "From cave paintings to deepfakes",
        seriesOrder: p.order,
        slug: p.slug,
        date: p.date,
        draft: p.draft,
        published: true,
        readTime: "14 min read",
      }),
    ),
  );
}

describe("isRouteEligibleNow helper", () => {
  const ORIGINAL_TODAY = process.env.MDX_PUBLICATION_TODAY;

  afterEach(() => {
    if (ORIGINAL_TODAY === undefined) {
      delete process.env.MDX_PUBLICATION_TODAY;
    } else {
      process.env.MDX_PUBLICATION_TODAY = ORIGINAL_TODAY;
    }
  });

  it("accepts PUBLIC_READABLE_NOW content (past date, not draft)", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-12";
    const doc = { date: "2026-07-07", draft: false, published: true, accessLevel: "public" };
    expect(isRouteEligibleNow(doc)).toBe(true);
  });

  it("rejects SCHEDULED content (future date)", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-12";
    const doc = { date: "2026-07-14", draft: false, published: true, accessLevel: "public" };
    expect(isRouteEligibleNow(doc)).toBe(false);
  });

  it("rejects DRAFT content (past date, draft:true)", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-12";
    const doc = { date: "2026-01-01", draft: true, published: true };
    expect(isRouteEligibleNow(doc)).toBe(false);
  });

  it("accepts RESTRICTED content (non-public tier)", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-12";
    const doc = { date: "2026-07-07", draft: false, published: true, accessLevel: "member" };
    expect(isRouteEligibleNow(doc)).toBe(true);
  });

  it("rejects null/undefined", () => {
    expect(isRouteEligibleNow(null)).toBe(false);
    expect(isRouteEligibleNow(undefined)).toBe(false);
  });

  it("rejects INTERNAL document types", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-12";
    const doc = { type: "LinkedInOutbound", date: "2026-07-07", draft: false };
    expect(isRouteEligibleNow(doc)).toBe(false);
  });
});

describe("registry family integrity", () => {
  it("getDocKind returns blog for a blog series Post", () => {
    const doc = {
      type: "Post",
      docKind: "blog",
      slug: "blog/series/the-truth-in-the-frame/before-the-word",
      _raw: { flattenedPath: "blog/series/the-truth-in-the-frame/before-the-word" },
    };
    expect(getDocKind(doc)).toBe("blog");
  });

  it("getDocKind returns short for a Short", () => {
    const doc = {
      type: "Short",
      docKind: "short",
      slug: "shorts/when-you-feel-something",
      _raw: { flattenedPath: "shorts/when-you-feel-something" },
    };
    expect(getDocKind(doc)).toBe("short");
  });

  it("a blog Post at /registry/shorts is rejected by family mismatch", () => {
    // A blog series Post has docKind="blog".
    // /registry/shorts expects docKind="short".
    // blog !== short → rejected.
    const doc = {
      type: "Post",
      docKind: "blog",
      slug: "blog/series/the-truth-in-the-frame/the-kings-shadow",
      _raw: { flattenedPath: "blog/series/the-truth-in-the-frame/the-kings-shadow" },
    };
    expect(getDocKind(doc)).toBe("blog");
    expect(getDocKind(doc)).not.toBe("short");
  });

  it("a blog Post at /registry/dispatches is accepted by family (blog matches blog)", () => {
    // /registry/dispatches expects docKind="blog" (dispatches = blog posts).
    // A blog series Post has docKind="blog".
    // blog === blog → accepted.
    const doc = {
      type: "Post",
      docKind: "blog",
      slug: "blog/series/the-truth-in-the-frame/before-the-word",
      _raw: { flattenedPath: "blog/series/the-truth-in-the-frame/before-the-word" },
    };
    expect(getDocKind(doc)).toBe("blog");
  });
});

describe("scheduled content in public registries", () => {
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

  it("at 2026-07-13: Part One is eligible, Part Two is not", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-13";
    mockTruthParts(makeTruthParts());

    const result = resolveAllSeries("blog");
    const series = result.find((s) => s.slug === "the-truth-in-the-frame");
    expect(series).toBeDefined();

    // Part One is PUBLIC_READABLE_NOW → eligible for listing
    expect(series!.parts.find((p) => p.order === 1)).toBeDefined();
    // Part Two is SCHEDULED → not in parts (not in published listings)
    expect(series!.parts.find((p) => p.order === 2)).toBeUndefined();
    // Part Seven (The Algorithms Gallery) is SCHEDULED → not in parts
    expect(series!.parts.find((p) => p.order === 7)).toBeUndefined();
  });

  it("at 2026-07-14: Part One and Part Two are eligible, Part Three is not", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-14";
    mockTruthParts(makeTruthParts());

    const result = resolveAllSeries("blog");
    const series = result.find((s) => s.slug === "the-truth-in-the-frame");
    expect(series).toBeDefined();

    expect(series!.parts.find((p) => p.order === 1)).toBeDefined();
    expect(series!.parts.find((p) => p.order === 2)).toBeDefined();
    expect(series!.parts.find((p) => p.order === 3)).toBeUndefined();
    expect(series!.publishedPartCount).toBe(2);
    expect(series!.partCount).toBe(9);
  });

  it("at 2026-07-21: Parts 1-3 are eligible", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-21";
    mockTruthParts(makeTruthParts());

    const result = resolveAllSeries("blog");
    const series = result.find((s) => s.slug === "the-truth-in-the-frame");
    expect(series).toBeDefined();

    expect(series!.parts).toHaveLength(3);
    expect(series!.publishedPartCount).toBe(3);
    expect(series!.partCount).toBe(9);
  });

  it("scheduled content with revalidate:60 is not permanently cached as 404", () => {
    // Simulate a scheduled doc being checked via isRouteEligibleNow
    process.env.MDX_PUBLICATION_TODAY = "2026-07-13";
    const doc = { date: "2026-07-14", draft: false, published: true, accessLevel: "public" };
    expect(isRouteEligibleNow(doc)).toBe(false);

    // Advance to publication date
    process.env.MDX_PUBLICATION_TODAY = "2026-07-14";
    expect(isRouteEligibleNow(doc)).toBe(true);
  });
});

describe("route eligibility across release boundary", () => {
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

  it("before 2026-07-14: Part One route exists, Part Two route does not", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-13";
    mockTruthParts(makeTruthParts());

    const result = resolveAllSeries("blog");
    const series = result.find((s) => s.slug === "the-truth-in-the-frame");
    expect(series).toBeDefined();

    // Part One is PUBLIC_READABLE_NOW → route exists
    expect(series!.parts.find((p) => p.order === 1)).toBeDefined();
    // Part Two is SCHEDULED → not in parts (no route)
    expect(series!.parts.find((p) => p.order === 2)).toBeUndefined();
    // Part Two IS in previewParts (shown as Coming soon)
    expect(series!.previewParts.find((p) => p.order === 2)).toBeDefined();
  });

  it("on 2026-07-14: Part One and Part Two routes exist, Part Three does not", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-14";
    mockTruthParts(makeTruthParts());

    const result = resolveAllSeries("blog");
    const series = result.find((s) => s.slug === "the-truth-in-the-frame");
    expect(series).toBeDefined();

    // Parts 1-2 are PUBLIC_READABLE_NOW → routes exist
    expect(series!.parts.find((p) => p.order === 1)).toBeDefined();
    expect(series!.parts.find((p) => p.order === 2)).toBeDefined();
    // Part Three is SCHEDULED → not in parts
    expect(series!.parts.find((p) => p.order === 3)).toBeUndefined();
    // partCount remains 9
    expect(series!.partCount).toBe(9);
    expect(series!.publishedPartCount).toBe(2);
  });

  it("genuine internal draft is excluded from parts and previewParts", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-12";
    const parts = makeTruthParts();
    parts.push({ order: 99, slug: "internal-draft", date: "2026-01-01", draft: true });
    mockTruthParts(parts);

    const result = resolveAllSeries("blog");
    const series = result.find((s) => s.slug === "the-truth-in-the-frame");
    expect(series).toBeDefined();
    expect(series!.partCount).toBe(9);
    expect(series!.parts.find((p) => p.order === 99)).toBeUndefined();
    expect(series!.previewParts.find((p) => p.order === 99)).toBeUndefined();
  });

  it("restricted released content is eligible via isRouteEligibleNow", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-12";
    const doc = { date: "2026-07-07", draft: false, published: true, accessLevel: "member" };
    expect(isRouteEligibleNow(doc)).toBe(true);
  });

  it("future restricted content is not eligible", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-12";
    const doc = { date: "2026-07-14", draft: false, published: true, accessLevel: "member" };
    expect(isRouteEligibleNow(doc)).toBe(false);
  });

  it("at 2026-07-13: The King's Shadow is SCHEDULED, not route-eligible", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-13";
    mockTruthParts(makeTruthParts());

    // Through the series resolver: Part Two should not be in parts
    const result = resolveAllSeries("blog");
    const series = result.find((s) => s.slug === "the-truth-in-the-frame");
    expect(series).toBeDefined();
    expect(series!.parts.find((p) => p.order === 2)).toBeUndefined();

    // Through isRouteEligibleNow: a doc with date 2026-07-14 at 2026-07-13 is SCHEDULED
    const doc = { date: "2026-07-14", draft: false, published: true, accessLevel: "public" };
    expect(isRouteEligibleNow(doc)).toBe(false);
  });

  it("at 2026-07-14: The King's Shadow becomes route-eligible", () => {
    process.env.MDX_PUBLICATION_TODAY = "2026-07-14";
    mockTruthParts(makeTruthParts());

    const result = resolveAllSeries("blog");
    const series = result.find((s) => s.slug === "the-truth-in-the-frame");
    expect(series).toBeDefined();
    expect(series!.parts.find((p) => p.order === 2)).toBeDefined();
    expect(series!.publishedPartCount).toBe(2);
    expect(series!.partCount).toBe(9);

    // Through isRouteEligibleNow: 2026-07-14 >= 2026-07-14 → PUBLIC_READABLE_NOW
    const doc = { date: "2026-07-14", draft: false, published: true, accessLevel: "public" };
    expect(isRouteEligibleNow(doc)).toBe(true);
  });
});