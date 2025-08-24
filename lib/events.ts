// lib/events.ts
// This file should contain only client-side code and types.

export interface EventMeta {
  slug: string;
  title: string;
  date: string;
  location?: string;
  excerpt?: string;
  summary?: string;
  heroImage?: string;
  ctaHref?: string;
  ctaLabel?: string;
  tags?: string[];
  content?: string;
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
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

// These functions will now receive data as props and can perform their logic.
// They no longer need to call fs-dependent functions.
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
  }));
}