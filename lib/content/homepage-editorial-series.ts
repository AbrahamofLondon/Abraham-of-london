/**
 * lib/content/homepage-editorial-series.ts
 *
 * Build-time/static view-model for the homepage Editorial Intelligence section.
 *
 * Derives editorial series data from the same resolver used by /editorials:
 *   getEditorialSeriesCatalogue() → resolveAllSeries("editorial")
 *
 * This is the single source of truth for the homepage. EditorialIntelligenceBand
 * renders this model and must NOT maintain separate hardcoded series data.
 *
 * Applied Essay Series is separately defined here (blog-based series, not
 * editorial-series content type) but is also a single source of truth —
 * no hardcoded copies elsewhere.
 */

import { getEditorialSeriesCatalogue, type EditorialSeries } from "@/lib/editorial/series";

// ─── Types ───────────────────────────────────────────────────────────────────

export type HomepageEditorialSeriesEntry = {
  slug: string;
  title: string;
  description: string;
  /** Display label: "Complete", "Scheduled", or "In progress" */
  statusLabel: string;
  /** CTA label: "Enter the series" or "Coming soon" */
  ctaLabel: string;
  /** CTA href — only set when the series is readable (COMPLETE or IN_PROGRESS with public parts) */
  ctaHref: string | null;
  /** Total parts in the series */
  partCount: number;
  /** Parts that are publicly readable now */
  readablePartCount: number;
  /** Scheduled start date (ISO string), null if not applicable */
  scheduledDate: string | null;
};

export type HomepageAppliedSeriesEntry = {
  slug: string;
  title: string;
  description: string;
  href: string;
  statusLabel: string;
  partCount: number;
  relationNote: string;
};

export type HomepageEditorialViewModel = {
  /** Editorial Series (content type: EditorialSeriesPart) — dynamically resolved */
  editorialSeries: HomepageEditorialSeriesEntry[];
  /** Applied Essay Series (content type: Post, blog-based) — stable curated list */
  appliedSeries: HomepageAppliedSeriesEntry[];
};

// ─── Applied Essay Series (stable curated list) ──────────────────────────────
// These are blog-based series (Post content type), not EditorialSeriesPart.
// They are curated here as the single source of truth for the homepage.

const APPLIED_SERIES: HomepageAppliedSeriesEntry[] = [
  {
    slug: "the-burden-changes-hands",
    title: "The Burden Changes Hands",
    description:
      "Seven essays on memory, custody, records, authorship, and the intelligence organisations build over time.",
    href: "/blog/series/the-burden-changes-hands",
    statusLabel: "Complete",
    partCount: 7,
    relationNote: "What institutions carry.",
  },
  {
    slug: "the-science-of-inherited-selves",
    title: "The Science of Inherited Selves",
    description:
      "Eight essays on inheritance, attachment, family memory, trauma, love, marriage, responsibility, and the courage to interrupt what should not be passed on.",
    href: "/blog/series/the-science-of-inherited-selves",
    statusLabel: "In progress",
    partCount: 8,
    relationNote: "What persons, families, and generations carry.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeStatusLabel(series: EditorialSeries): string {
  if (series.status === "PUBLISHED") return "Complete";
  // DRAFT status with zero published parts = SCHEDULED_VISIBLE
  if (series.partCount > 0 && series.parts.length === 0) return "Scheduled";
  return "In progress";
}

function computeCtaLabel(statusLabel: string): string {
  return statusLabel === "Scheduled" ? "Coming soon" : "Enter the series";
}

function computeCtaHref(series: EditorialSeries, statusLabel: string): string | null {
  if (statusLabel === "Scheduled") return null;
  return `/editorials/series/${series.slug}`;
}

function computeScheduledDate(series: EditorialSeries): string | null {
  // For scheduled series, find the earliest future-dated part
  // This is derived from the series parts' dates if available
  // For now, return null — the resolver doesn't expose part dates directly
  return null;
}

// ─── View-model builder ──────────────────────────────────────────────────────

/**
 * Build the homepage editorial series view-model.
 *
 * This is a pure function — safe to call at build time (getStaticProps)
 * or at request time (SSR/ISR). It reads from the same contentlayer
 * generated index as /editorials.
 */
export function getHomepageEditorialSeries(): HomepageEditorialViewModel {
  const catalogue = getEditorialSeriesCatalogue();

  const editorialSeries: HomepageEditorialSeriesEntry[] = catalogue.map((s) => {
    const statusLabel = computeStatusLabel(s);
    return {
      slug: s.slug,
      title: s.title,
      description: s.descriptor,
      statusLabel,
      ctaLabel: computeCtaLabel(statusLabel),
      ctaHref: computeCtaHref(s, statusLabel),
      partCount: s.partCount,
      readablePartCount: s.parts.length,
      scheduledDate: computeScheduledDate(s),
    };
  });

  return {
    editorialSeries,
    appliedSeries: APPLIED_SERIES,
  };
}
