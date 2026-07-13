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
});
