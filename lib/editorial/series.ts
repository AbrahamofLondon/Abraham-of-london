// lib/editorial/series.ts
// Contentlayer-driven editorial series registry — thin wrapper over lib/series/resolver.ts
// No hardcoded registry entries required.

import {
  resolveAllSeries,
  resolveSeriesBySlug,
  type ResolvedSeries,
  type SeriesPart,
} from "@/lib/series/resolver";

// ─── Types — backward compatible with existing EditorialSeries consumers ─────

export type EditorialSeriesStatus = "DRAFT" | "PUBLISHED";

export type EditorialSeriesPart = SeriesPart & {
  mdxSlug: string;
};

export type EditorialSeries = {
  id: string;
  slug: string;
  title: string;
  descriptor: string;
  partCount: number;
  status: EditorialSeriesStatus;
  parts: EditorialSeriesPart[];
};

// ─── Mapping — convert ResolvedSeries to EditorialSeries ────────────────────

function toEditorialSeries(resolved: ResolvedSeries): EditorialSeries {
  return {
    id: `editorial-series-${resolved.slug}`,
    slug: resolved.slug,
    title: resolved.title,
    descriptor: resolved.description,
    partCount: resolved.partCount,
    status: resolved.status as EditorialSeriesStatus,
    parts: resolved.parts.map((p) => ({
      ...p,
      mdxSlug: p.mdxSlug ?? p.slug,
    })),
  };
}

// ─── Public API — preserves existing function names ──────────────────────────

export function getEditorialSeriesCatalogue(): EditorialSeries[] {
  return resolveAllSeries("editorial").map(toEditorialSeries);
}

export function getEditorialSeriesBySlug(
  slug: string,
): EditorialSeries | null {
  const resolved = resolveSeriesBySlug(slug, "editorial");
  return resolved ? toEditorialSeries(resolved) : null;
}

export function getEditorialSeriesPart(
  series: EditorialSeries,
  partSlug: string,
): EditorialSeriesPart | null {
  return series.parts.find((p) => p.slug === partSlug) ?? null;
}

export function getEditorialSeriesPartNeighbors(
  series: EditorialSeries,
  partOrder: number,
): {
  previous: EditorialSeriesPart | null;
  next: EditorialSeriesPart | null;
} {
  const sorted = [...series.parts].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((p) => p.order === partOrder);
  return {
    previous: idx > 0 ? (sorted[idx - 1] ?? null) : null,
    next: idx < sorted.length - 1 ? (sorted[idx + 1] ?? null) : null,
  };
}

export function formatEditorialSeriesPartNumber(order: number): string {
  const labels = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  return labels[order] ?? String(order);
}