// lib/server/events-data.ts

/** Minimal event shape we rely on. Extend as needed. */
export type BasicEvent = {
  title: string;
  date: string; // ISO or parseable by Date
  [k: string]: any; // allow extra fields (slug, location, etc.)
};

/** Convert a date string to a YYYY-MM-DD key in Europe/London. */
function dateKey(d: string): string {
  // handle both ISO-like and yyyy-mm-dd literal
  const only = /^\d{4}-\d{2}-\d{2}$/.test(d);
  if (only) return d;
  const dt = new Date(d);
  if (Number.isNaN(dt.valueOf())) return ""; // will sort to bottom and dedupe conservatively
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dt);
}

/**
 * Dedupe events by (normalized title + day), keeping the *first* occurrence.
 * Returns a new array, stable relative to the original order.
 */
export function dedupeEventsByTitleAndDay<T extends BasicEvent>(events: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const ev of events) {
    const title = String(ev.title || "").trim().toLowerCase().replace(/\s+/g, " ");
    const key = `${title}::${dateKey(String(ev.date || ""))}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(ev);
    }
  }
  return out;
}

/** Optional: small utility you might already be using elsewhere. */
export function sortEventsAsc<T extends BasicEvent>(events: T[]): T[] {
  return [...events].sort((a, b) => +new Date(a.date) - +new Date(b.date));
}

// If you have other helpers in this module, export them here.
// export { getAllEvents, getUpcomingEvents, ... };
