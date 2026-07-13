/**
 * tests/series/canonical-route-boundary.test.ts
 *
 * End-to-end boundary tests against the REAL canonical page modules and the
 * real "the-truth-in-the-frame" Contentlayer content (no resolver mocking).
 *
 * Requires `pnpm contentlayer2 build` to have run first so
 * .contentlayer/generated exists.
 *
 * Uses MDX_PUBLICATION_TODAY for deterministic date control.
 */

import { describe, it, expect, afterEach } from "vitest";

function withToday(value: string, fn: () => void | Promise<void>) {
  const original = process.env.MDX_PUBLICATION_TODAY;
  process.env.MDX_PUBLICATION_TODAY = value;
  return Promise.resolve(fn()).finally(() => {
    if (original === undefined) delete process.env.MDX_PUBLICATION_TODAY;
    else process.env.MDX_PUBLICATION_TODAY = original;
  });
}

afterEach(() => {
  delete process.env.MDX_PUBLICATION_TODAY;
});

describe("canonical part reader — pages/blog/series/[seriesSlug]/[partSlug].tsx", () => {
  it('getStaticPaths uses fallback: "blocking"', async () => {
    const { getStaticPaths } = await import("@/pages/blog/series/[seriesSlug]/[partSlug]");
    const result: any = await getStaticPaths({} as never);
    expect(result.fallback).toBe("blocking");
  });

  it("prebuilt paths contain only currently published parts (Part One, not Part Two)", () =>
    withToday("2026-07-13", async () => {
      const { getStaticPaths } = await import("@/pages/blog/series/[seriesSlug]/[partSlug]");
      const result: any = await getStaticPaths({} as never);
      const slugs = result.paths
        .filter((p: any) => p.params.seriesSlug === "the-truth-in-the-frame")
        .map((p: any) => p.params.partSlug);

      expect(slugs).toContain("before-the-word-what-the-cave-walls-remember");
      expect(slugs).not.toContain("the-kings-shadow");
    }));

  it("at 2026-07-13: Part Two (the-kings-shadow) getStaticProps returns notFound:true with revalidate:60, no props", () =>
    withToday("2026-07-13", async () => {
      const { getStaticProps } = await import("@/pages/blog/series/[seriesSlug]/[partSlug]");
      const result: any = await getStaticProps({
        params: { seriesSlug: "the-truth-in-the-frame", partSlug: "the-kings-shadow" },
      } as never);

      expect(result.notFound).toBe(true);
      expect(result.revalidate).toBe(60);
      expect(result.props).toBeUndefined();
      expect(JSON.stringify(result)).not.toMatch(/staticHtml/);
    }));

  it("at 2026-07-14: Part Two (the-kings-shadow) getStaticProps returns normal props with revalidate:60", () =>
    withToday("2026-07-14", async () => {
      const { getStaticProps } = await import("@/pages/blog/series/[seriesSlug]/[partSlug]");
      const result: any = await getStaticProps({
        params: { seriesSlug: "the-truth-in-the-frame", partSlug: "the-kings-shadow" },
      } as never);

      expect(result.notFound).toBeUndefined();
      expect(result.revalidate).toBe(60);
      expect(result.props).toBeDefined();
      expect(result.props.part.slug).toBe("the-kings-shadow");
      expect(result.props.staticHtml.length).toBeGreaterThan(0);
    }));

  it("a nonexistent part slug returns permanent notFound without revalidate", () =>
    withToday("2026-07-14", async () => {
      const { getStaticProps } = await import("@/pages/blog/series/[seriesSlug]/[partSlug]");
      const result: any = await getStaticProps({
        params: { seriesSlug: "the-truth-in-the-frame", partSlug: "does-not-exist" },
      } as never);

      expect(result).toEqual({ notFound: true });
      expect(result.revalidate).toBeUndefined();
    }));

  it("a genuine internal draft slug remains unavailable at any date", () =>
    withToday("2026-09-02", async () => {
      const { getStaticProps } = await import("@/pages/blog/series/[seriesSlug]/[partSlug]");
      // "internal-draft" is not a real slug in the series content, so it must
      // never resolve — mirrors how a genuine draft (draft:true) is excluded
      // from previewParts and therefore hits the same notFound path.
      const result: any = await getStaticProps({
        params: { seriesSlug: "the-truth-in-the-frame", partSlug: "internal-draft" },
      } as never);

      expect(result).toEqual({ notFound: true });
    }));
});

describe("series hub — pages/blog/series/[seriesSlug]/index.tsx", () => {
  it("at 2026-07-13: hub reports 1 of 9 published, with revalidate:60", () =>
    withToday("2026-07-13", async () => {
      const { getStaticProps } = await import("@/pages/blog/series/[seriesSlug]/index");
      const result: any = await getStaticProps({
        params: { seriesSlug: "the-truth-in-the-frame" },
      } as never);

      expect(result.revalidate).toBe(60);
      const series = result.props.series;
      const publishedCount = series.parts.filter((p: any) => p.status === "PUBLISHED").length;
      expect(publishedCount).toBe(1);
      expect(series.partCount).toBe(9);
    }));

  it("at 2026-07-14: hub advances to 2 of 9 published and Part Two is an active link", () =>
    withToday("2026-07-14", async () => {
      const { getStaticProps } = await import("@/pages/blog/series/[seriesSlug]/index");
      const result: any = await getStaticProps({
        params: { seriesSlug: "the-truth-in-the-frame" },
      } as never);

      expect(result.revalidate).toBe(60);
      const series = result.props.series;
      const publishedCount = series.parts.filter((p: any) => p.status === "PUBLISHED").length;
      expect(publishedCount).toBe(2);
      expect(series.partCount).toBe(9);

      const partTwo = series.parts.find((p: any) => p.order === 2);
      expect(partTwo).toBeDefined();
      expect(partTwo.status).toBe("PUBLISHED");
    }));
});

describe("blog shelf — pages/blog/index.tsx", () => {
  it("at 2026-07-13: shelf shows the-truth-in-the-frame as 1 of 9, with revalidate:60", () =>
    withToday("2026-07-13", async () => {
      const { getStaticProps } = await import("@/pages/blog/index");
      const result: any = await getStaticProps({} as never);

      expect(result.revalidate).toBe(60);
      const entry = result.props.seriesCatalogue.find(
        (s: any) => s.slug === "the-truth-in-the-frame",
      );
      expect(entry).toBeDefined();
      expect(entry.publishedCount).toBe(1);
      expect(entry.partCount).toBe(9);
    }));

  it("at 2026-07-14: shelf advances to 2 of 9 without a new deployment", () =>
    withToday("2026-07-14", async () => {
      const { getStaticProps } = await import("@/pages/blog/index");
      const result: any = await getStaticProps({} as never);

      expect(result.revalidate).toBe(60);
      const entry = result.props.seriesCatalogue.find(
        (s: any) => s.slug === "the-truth-in-the-frame",
      );
      expect(entry).toBeDefined();
      expect(entry.publishedCount).toBe(2);
      expect(entry.partCount).toBe(9);
    }));
});

describe("route tracing — Post data reaches reader, hub, and blog index", () => {
  it("declares Post tracing for the canonical reader, the hub, and the blog index", async () => {
    const { ROUTE_CONTENT_TYPES, buildContentTracingIncludes } = await import(
      "@/lib/content/route-content-types.mjs"
    );

    expect(ROUTE_CONTENT_TYPES["/blog/series/[seriesSlug]/[partSlug]"]).toContain("Post");
    expect(ROUTE_CONTENT_TYPES["/blog/series/[seriesSlug]"]).toContain("Post");
    expect(ROUTE_CONTENT_TYPES["/blog"]).toContain("Post");

    const includes = buildContentTracingIncludes();
    expect(includes["/blog/series/[seriesSlug]/[partSlug]"]).toContain(
      "./.contentlayer/generated/Post/_index.json",
    );
    expect(includes["/blog/series/[seriesSlug]"]).toContain(
      "./.contentlayer/generated/Post/_index.json",
    );
    expect(includes["/blog"]).toContain("./.contentlayer/generated/Post/_index.json");
  });
});
