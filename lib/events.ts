// lib/events.ts
// Pure types + client-safe helpers (no fs imports here).

export interface EventMeta {
  slug: string;
  title: string;
  date: string;
  location?: string;
  excerpt?: string;
  summary?: string;

  /** Preferred/new field */
  coverImage?: string | null;

  /** Legacy/alternate field some MDX may still use */
  heroImage?: string | null;

  ctaHref?: string;
  ctaLabel?: string;
  tags?: string[];
  content?: string;
}

/** Safe default if neither coverImage nor heroImage is present */
export const DEFAULT_EVENT_COVER = "/assets/images/social/og-image.jpg";

/** Normalize whichever image field is present */
export function eventCover(e?: Partial<EventMeta>): string {
  const src = e?.coverImage ?? e?.heroImage;
  return src && String(src).trim() ? String(src) : DEFAULT_EVENT_COVER;
}

export function isUpcoming(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;

  // compare against local "start of today"
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return d >= start;
}

export function prettyDate(dateStr?: string, locale = "en-GB"): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Filter/slice utilities operate on provided data */
export function getUpcomingEvents(events: EventMeta[], limit = 3): EventMeta[] {
  return events.filter((e) => isUpcoming(e.date)).slice(0, limit);
}

export function getEventsTeaser(events: EventMeta[], limit = 3) {
  return getUpcomingEvents(events, limit).map((e) => ({
    slug: e.slug,
    title: e.title,
    date: e.date,
    location: e.location || "",
    description: e.summary ?? null,
    cover: eventCover(e), // handy if a teaser needs a cover
  }));
}
