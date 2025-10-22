// File containing EventMeta definition (e.g., ./lib/events.ts)

export interface EventMeta {
  slug: string;
  title: string;
  date: string;
  // >> FIX: Add the missing property
  endDate?: string | null;
  // <<
  location?: string;
  excerpt?: string;
  summary?: string;
  coverImage?: string | null;
  heroImage?: string | null;
  ctaHref?: string;
  ctaLabel?: string;
  tags?: string[];
  content?: string;
  resources?: { downloads?: { href: string; label: string }[]; reads?: { href: string; label: string }[] } | null;
  chatham?: boolean;
  related?: string[];
}

export const DEFAULT_EVENT_COVER = "/assets/images/social/og-image.jpg";

export function eventCover(e?: Partial<EventMeta>): string {
  const src = e?.coverImage ?? e?.heroImage;
  return src && String(src).trim() ? String(src) : DEFAULT_EVENT_COVER;
}

export function isUpcoming(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
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
    cover: eventCover(e),
  }));
}