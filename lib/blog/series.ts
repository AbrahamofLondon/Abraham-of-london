// lib/blog/series.ts
// Contentlayer-driven blog series registry — thin wrapper over lib/series/resolver.ts
// No hardcoded registry entries required. Add a new series by writing MDX with
// the correct frontmatter (series, seriesOrder, seriesTitle, seriesDescription).

import {
  resolveAllSeries,
  resolveSeriesBySlug,
  type ResolvedSeries,
  type SeriesPart,
} from "@/lib/series/resolver";

// Re-export types for backward compatibility
export type BlogSeriesPart = SeriesPart;
export type BlogSeries = ResolvedSeries;

// ─── Public API — preserves existing function names ──────────────────────────

export function getBlogSeriesCatalogue(): BlogSeries[] {
  return resolveAllSeries("blog");
}

export function getBlogSeriesBySlug(slug: string): BlogSeries | null {
  return resolveSeriesBySlug(slug, "blog");
}

export function getBlogSeriesPart(
  series: BlogSeries,
  partSlug: string,
): BlogSeriesPart | null {
  return series.parts.find((p) => p.slug === partSlug) ?? null;
}

export function getBlogSeriesPartNeighbors(
  series: BlogSeries,
  order: number,
): { previous: BlogSeriesPart | null; next: BlogSeriesPart | null } {
  const sorted = [...series.parts].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((p) => p.order === order);
  return {
    previous: idx > 0 ? (sorted[idx - 1] ?? null) : null,
    next: idx < sorted.length - 1 ? (sorted[idx + 1] ?? null) : null,
  };
}

export function formatBlogSeriesPartNumber(order: number): string {
  const words = [
    "One", "Two", "Three", "Four", "Five",
    "Six", "Seven", "Eight", "Nine", "Ten",
  ];
  return words[order - 1] ?? String(order);
}

export function parseMins(readTime: string): number {
  const m = readTime.match(/(\d+)/);
  return m ? parseInt(m[1] ?? "0", 10) : 0;
}

export function formatTotalTime(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `~${hrs} hr ${mins} min` : `~${hrs} hr`;
}