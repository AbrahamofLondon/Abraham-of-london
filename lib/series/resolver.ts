/**
 * lib/series/resolver.ts
 *
 * Contentlayer-driven series resolver.
 *
 * Derives series metadata from published MDX frontmatter instead of
 * hardcoded registries. Supports both blog and editorial document types.
 *
 * Usage:
 *   const allSeries = resolveAllSeries("blog");
 *   const series = resolveSeriesBySlug("the-truth-in-the-frame", "blog");
 *
 * No manual registry update required when a new series is added —
 * just write MDX files with the correct frontmatter fields.
 *
 * Primary rule: Content is the source of truth. Code derives series metadata
 * from published MDX content. No manual registry update should be required
 * when a new series is added.
 */

// ---------------------------------------------------------------------------
// Types — compatible with existing BlogSeries / EditorialSeries consumers
// ---------------------------------------------------------------------------

export type SeriesPartStatus = "PUBLISHED" | "DRAFT";

export type SeriesPart = {
  order: number;
  slug: string;
  title: string;
  excerpt: string;
  readTime: string;
  status: SeriesPartStatus;
  /** Used by editorial series pages — maps to the MDX slug for content lookup */
  mdxSlug?: string;
  /**
   * Raw publication classification from publication-eligibility.
   * Preserved so callers can distinguish SCHEDULED from DRAFT without
   * re-running the classifier. Used internally to build previewParts.
   */
  publicationState: PublicationClass;
};

export type ResolvedSeries = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  category: string;
  tags: string[];
  partCount: number;
  publishedPartCount: number;
  status: SeriesPartStatus;
  /**
   * Published parts only.
   * Safe for: sitemap generation, getStaticPaths, navigation CTAs, neighbour links.
   * Never contains scheduled or draft parts.
   */
  parts: SeriesPart[];
  /**
   * Published + scheduled parts (no draft/internal).
   * Use for hub-page display so future parts appear as "Coming soon" previews.
   * Never used for routing — scheduled parts must not generate active links.
   */
  previewParts: SeriesPart[];
};

// ---------------------------------------------------------------------------
// Data source — imported from separate module for testability
// ---------------------------------------------------------------------------

import { getDocumentsForKind } from "./data";
import { classifyPublication, computeSeriesPublicationState, isPublicNow, getToday, type PublicationClass } from "@/lib/content/publication-eligibility";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inferSeriesTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Normalise a series slug for consistent grouping.
 * The editorial-series documents use the display title (e.g. "The Mind's Clay")
 * as the `series` field value. We normalise to a slug for internal use.
 */
function normaliseSeriesSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function docToSeriesPart(doc: any, now: Date = getToday()): SeriesPart {
  const classification = classifyPublication(doc, now);
  return {
    order: doc.seriesOrder ?? 0,
    slug: doc.slug ?? doc.slugSafe ?? "",
    title: doc.title ?? doc.titleSafe ?? "Untitled",
    excerpt: doc.excerpt ?? doc.excerptSafe ?? doc.description ?? "",
    readTime: doc.readTime ?? doc.readTimeSafe ?? "",
    // SCHEDULED collapses to "DRAFT" in the two-value status enum —
    // callers that need the fine-grained distinction use publicationState instead.
    status: classification === "PUBLIC_READABLE_NOW" ? "PUBLISHED" : "DRAFT",
    mdxSlug: doc.slug ?? doc.slugSafe ?? undefined,
    publicationState: classification,
  };
}

/**
 * Extract a sortable date from a document.
 * Returns the Date object or null if not available.
 */
function getDocDate(doc: any): Date | null {
  const raw = doc.date ?? doc.publishedDate ?? doc.createdAt ?? null;
  if (!raw) return null;
  try {
    const d = new Date(raw);
    return Number.isFinite(d.getTime()) ? d : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

/**
 * Resolve all series from Contentlayer documents.
 *
 * @param docKind - "blog" for Post documents, "editorial" for EditorialSeriesPart
 * @returns Array of ResolvedSeries, sorted by first published date descending
 */
export function resolveAllSeries(
  docKind: "blog" | "editorial",
): ResolvedSeries[] {
  const allDocs = getDocumentsForKind(docKind);

  // Filter to documents that belong to a series
  const seriesDocs = allDocs.filter(
    (doc: any) => doc.series && doc.seriesOrder != null,
  );

  // Group by normalised series slug
  const groups = new Map<string, { docs: any[]; rawSlug: string }>();

  for (const doc of seriesDocs) {
    const rawSeries = String(doc.series);
    const slug = normaliseSeriesSlug(rawSeries);
    if (!groups.has(slug)) {
      groups.set(slug, { docs: [], rawSlug: rawSeries });
    }
    groups.get(slug)!.docs.push(doc);
  }

  const seriesList: ResolvedSeries[] = [];

  const now = getToday();

  for (const [slug, { docs, rawSlug }] of groups.entries()) {
    // Sort parts by seriesOrder ascending
    const sortedParts = [...docs].sort(
      (a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0),
    );

    const allParts: SeriesPart[] = sortedParts.map((doc) => docToSeriesPart(doc, now));
    const publishedParts = allParts.filter((p) => p.status === "PUBLISHED");
    // previewParts: published + scheduled only. Draft/internal parts are never surfaced.
    // Used by hub pages to render "Coming soon" previews for future parts.
    const previewParts = allParts.filter(
      (p) => p.publicationState === "PUBLIC_READABLE_NOW" || p.publicationState === "SCHEDULED",
    );
    const firstDoc = sortedParts[0];

    // Use shared publication classifier for series-level state
    const seriesPubState = computeSeriesPublicationState(sortedParts, now);

    // Derive series-level metadata from frontmatter or first document
    const seriesTitle =
      firstDoc.seriesTitle ??
      // For editorial-series, the `series` field is often the display title
      // (e.g. "The Mind's Clay"), so use it as a fallback
      (docKind === "editorial" ? rawSlug : inferSeriesTitle(slug));

    const seriesDescription =
      firstDoc.seriesDescription ?? firstDoc.description ?? "";

    const publishedPartCount = publishedParts.length;

    // Visibility rules:
    // - Skip if DRAFT_INTERNAL (all draft, no preview permission)
    // - Skip if SCHEDULED_HIDDEN (future-dated, no preview permission)
    // - Skip if MIXED_REVIEW (inconsistent)
    // - Allow if COMPLETE, IN_PROGRESS, or SCHEDULED_VISIBLE
    if (seriesPubState.seriesVisibility === "DRAFT_INTERNAL" ||
        seriesPubState.seriesVisibility === "SCHEDULED_HIDDEN" ||
        seriesPubState.seriesVisibility === "MIXED_REVIEW") {
      continue;
    }

    // Map computed state to resolver status
    let seriesStatus: SeriesPartStatus;
    switch (seriesPubState.seriesVisibility) {
      case "COMPLETE":
        seriesStatus = "PUBLISHED";
        break;
      case "IN_PROGRESS":
        seriesStatus = "DRAFT";
        break;
      case "SCHEDULED_VISIBLE":
        seriesStatus = "DRAFT"; // Not published yet, but visible as scheduled
        break;
      default:
        seriesStatus = "DRAFT";
        break;
    }

    seriesList.push({
      slug,
      title: seriesTitle,
      description: seriesDescription,
      excerpt: firstDoc.excerpt ?? firstDoc.description ?? "",
      category: firstDoc.category ?? "Essays",
      tags: Array.isArray(firstDoc.tags) ? firstDoc.tags : [],
      // partCount reflects published parts only — drafts are not exposed in the
      // public-facing ResolvedSeries. Use previewParts for scheduled previews.
      partCount: publishedParts.length,
      publishedPartCount,
      status: seriesStatus,
      parts: publishedParts,
      previewParts,
    });
  }

  // Sort by first published date descending (most recent series first)
  seriesList.sort((a, b) => {
    const aDate = getEarliestPublishedDate(a, docKind);
    const bDate = getEarliestPublishedDate(b, docKind);
    if (aDate && bDate) return bDate.getTime() - aDate.getTime();
    if (aDate) return -1;
    if (bDate) return 1;
    return 0;
  });

  return seriesList;
}

/**
 * Get the earliest published date for a series by looking up the original docs.
 */
function getEarliestPublishedDate(
  series: ResolvedSeries,
  docKind: "blog" | "editorial",
): Date | null {
  const allDocs = getDocumentsForKind(docKind);
  const slug = series.slug;

  const seriesDocs = allDocs.filter((doc: any) => {
    const rawSeries = String(doc.series ?? "");
    const docSlug = normaliseSeriesSlug(rawSeries);
    return docSlug === slug && doc.draft !== true && doc.published !== false;
  });

  if (seriesDocs.length === 0) return null;

  const dates = seriesDocs
    .map((doc: any) => getDocDate(doc))
    .filter((d: Date | null): d is Date => d !== null);

  if (dates.length === 0) return null;

  return new Date(Math.min(...dates.map((d: Date) => d.getTime())));
}

/**
 * Resolve a single series by slug.
 */
export function resolveSeriesBySlug(
  slug: string,
  docKind: "blog" | "editorial",
): ResolvedSeries | null {
  const all = resolveAllSeries(docKind);
  return all.find((s) => s.slug === slug) ?? null;
}
