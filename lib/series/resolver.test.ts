/**
 * lib/series/resolver.test.ts
 *
 * Regression tests for the previewParts / parts split in the series resolver.
 *
 * Root cause of the original bug (fixed in this session):
 *   resolveAllSeries() only stored publishedParts in `parts`.
 *   Scheduled future parts were silently dropped, so hub pages rendered empty
 *   for fully-scheduled series.
 *
 * These tests guard that contract: `parts` = published only, `previewParts` =
 * published + scheduled, draft/internal = excluded from both.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks ─────────────────────────────────────────────────────────────
// We mock `./data` to control exactly which docs the resolver processes,
// and override `getToday` so date comparisons are deterministic.

vi.mock("./data", () => ({
  getDocumentsForKind: vi.fn(),
}));

vi.mock("@/lib/content/publication-eligibility", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/content/publication-eligibility")>();
  return {
    ...actual,
    // Pin today so future-dated docs are reliably SCHEDULED in tests
    getToday: () => new Date("2026-05-29"),
  };
});

import { getDocumentsForKind } from "./data";
import { resolveAllSeries } from "./resolver";

const mockGetDocs = getDocumentsForKind as ReturnType<typeof vi.fn>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal doc that classifies as PUBLIC_READABLE_NOW */
function publishedDoc(overrides: Record<string, unknown> = {}) {
  return {
    series: "Test Series",
    seriesTitle: "Test Series",
    seriesDescription: "A test series.",
    seriesOrder: 1,
    slug: "part-one",
    title: "Part One",
    excerpt: "The first part.",
    description: "The first part.",
    readTime: "5 min read",
    date: "2026-01-01",       // Past date → PUBLIC_READABLE_NOW
    draft: false,
    published: true,
    accessLevel: "public",
    ...overrides,
  };
}

/** Build a doc that classifies as SCHEDULED (future date) */
function scheduledDoc(overrides: Record<string, unknown> = {}) {
  return {
    ...publishedDoc({ slug: "part-two", title: "Part Two", seriesOrder: 2, excerpt: "The second part." }),
    date: "2027-01-01",       // Future date → SCHEDULED
    seriesVisibility: "scheduled", // Preview permission — series won't be SCHEDULED_HIDDEN
    draft: true,              // draft:true is the frontmatter safety flag; date check runs first
    ...overrides,
  };
}

/** Build a doc that classifies as DRAFT (no date, draft:true) */
function draftDoc(overrides: Record<string, unknown> = {}) {
  return {
    ...publishedDoc({ slug: "part-draft", title: "Draft Part", seriesOrder: 99, excerpt: "A draft." }),
    date: "2025-01-01",       // Past date — would be readable, BUT:
    draft: true,              // draft:true → DRAFT
    ...overrides,
  };
}

beforeEach(() => {
  mockGetDocs.mockReset();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("resolveAllSeries — previewParts / parts split", () => {

  it("1. parts contains only published parts; previewParts also contains scheduled parts", () => {
    const pub = publishedDoc({ seriesOrder: 1, slug: "part-one" });
    const sch = scheduledDoc({ seriesOrder: 2, slug: "part-two" });
    mockGetDocs.mockReturnValue([pub, sch]);

    const [series] = resolveAllSeries("editorial");

    expect(series).toBeDefined();
    expect(series.parts).toHaveLength(1);
    expect(series.parts[0].slug).toBe("part-one");

    expect(series.previewParts).toHaveLength(2);
    expect(series.previewParts.map((p) => p.slug)).toContain("part-one");
    expect(series.previewParts.map((p) => p.slug)).toContain("part-two");
  });

  it("2. Scheduled part in previewParts has status 'DRAFT' (two-value enum compat)", () => {
    const sch = scheduledDoc({ seriesOrder: 1, slug: "part-one" });
    mockGetDocs.mockReturnValue([sch]);

    const [series] = resolveAllSeries("editorial");

    expect(series).toBeDefined();
    const scheduledInPreview = series.previewParts.find((p) => p.slug === "part-one");
    expect(scheduledInPreview).toBeDefined();
    expect(scheduledInPreview!.status).toBe("DRAFT");
  });

  it("3. Scheduled part in previewParts has publicationState 'SCHEDULED'", () => {
    const sch = scheduledDoc({ seriesOrder: 1, slug: "part-one" });
    mockGetDocs.mockReturnValue([sch]);

    const [series] = resolveAllSeries("editorial");

    const scheduledInPreview = series.previewParts.find((p) => p.slug === "part-one");
    expect(scheduledInPreview!.publicationState).toBe("SCHEDULED");
  });

  it("4. Draft parts are excluded from both parts and previewParts", () => {
    const pub = publishedDoc({ seriesOrder: 1, slug: "part-one" });
    const sch = scheduledDoc({ seriesOrder: 2, slug: "part-two" });
    const dft = draftDoc({ seriesOrder: 3, slug: "part-draft" });
    mockGetDocs.mockReturnValue([pub, sch, dft]);

    const [series] = resolveAllSeries("editorial");

    const draftInParts = series.parts.find((p) => p.slug === "part-draft");
    const draftInPreview = series.previewParts.find((p) => p.slug === "part-draft");

    expect(draftInParts).toBeUndefined();
    expect(draftInPreview).toBeUndefined();
  });

  it("5. Fully-scheduled series: parts is empty, previewParts has all scheduled parts", () => {
    // This is the exact regression case: "Outsourcing Our Sense of Meaning and Belonging"
    const docs = [1, 2, 3, 4, 5, 6].map((n) =>
      scheduledDoc({ seriesOrder: n, slug: `part-${n}`, title: `Part ${n}` }),
    );
    mockGetDocs.mockReturnValue(docs);

    const [series] = resolveAllSeries("editorial");

    expect(series).toBeDefined();
    expect(series.parts).toHaveLength(0);          // No published parts
    expect(series.previewParts).toHaveLength(6);   // All 6 scheduled → Coming Soon
  });

  it("6. Mixed series: correct published / scheduled split in both arrays", () => {
    // 1 published + 7 scheduled = "Science of Inherited Selves" shape
    const pub = publishedDoc({ seriesOrder: 1, slug: "part-one" });
    const scheduled = [2, 3, 4, 5, 6, 7, 8].map((n) =>
      scheduledDoc({ seriesOrder: n, slug: `part-${n}`, title: `Part ${n}` }),
    );
    mockGetDocs.mockReturnValue([pub, ...scheduled]);

    const [series] = resolveAllSeries("editorial");

    expect(series.parts).toHaveLength(1);
    expect(series.parts[0].status).toBe("PUBLISHED");

    expect(series.previewParts).toHaveLength(8);
    const statuses = series.previewParts.map((p) => p.status);
    expect(statuses.filter((s) => s === "PUBLISHED")).toHaveLength(1);
    expect(statuses.filter((s) => s === "DRAFT")).toHaveLength(7);
  });

  it("7. Series with no preview permission on scheduled parts is excluded from catalogue", () => {
    // SCHEDULED_HIDDEN: all parts are future-dated, none have seriesVisibility: "scheduled"
    const hiddenDocs = [1, 2].map((n) => ({
      ...publishedDoc({ seriesOrder: n, slug: `part-${n}` }),
      date: "2027-06-01",        // future → SCHEDULED
      seriesVisibility: "",       // no preview permission
      series: "Hidden Series",
      seriesTitle: "Hidden Series",
    }));
    mockGetDocs.mockReturnValue(hiddenDocs);

    const result = resolveAllSeries("editorial");

    // SCHEDULED_HIDDEN series must not appear in the catalogue
    expect(result).toHaveLength(0);
  });

  it("8. previewParts is sorted ascending by seriesOrder", () => {
    // Return docs in reverse order to confirm the resolver sorts them
    const docs = [3, 1, 2].map((n) =>
      scheduledDoc({ seriesOrder: n, slug: `part-${n}`, title: `Part ${n}` }),
    );
    mockGetDocs.mockReturnValue(docs);

    const [series] = resolveAllSeries("editorial");

    const orders = series.previewParts.map((p) => p.order);
    expect(orders).toEqual([1, 2, 3]);
  });

});
