// lib/events.ts
// -----------------------------------------------------------------------------
// Robust facade over server-side event loaders.
// Keeps existing exports intact AND provides safe, UI-friendly summaries.
// -----------------------------------------------------------------------------

import {
  getEventSlugs as _getEventSlugs,
  getEventBySlug as _getEventBySlug,
  getAllEvents as _getAllEvents,
  getEventsBySlugs as _getEventsBySlugs,
  getAllContent as _getAllContent,
  dedupeEventsByTitleAndDay as _dedupeEventsByTitleAndDay,
  // NOTE: we just re-export this; we don't force its shape here
  getEventResourcesSummary as _getEventResourcesSummary,
} from "@/lib/server/events-data";

export type {
  EventMeta,
  EventResources,
  EventResourceLink,
} from "@/lib/server/events-data";

// -----------------------------------------------------------------------------
// Re-export original server functions (backwards-compatible)
// -----------------------------------------------------------------------------

export const getEventSlugs = _getEventSlugs;
export const getEventBySlug = _getEventBySlug;
export const getAllEvents = _getAllEvents;
export const getEventsBySlugs = _getEventsBySlugs;
export const getAllContent = _getAllContent;
export const dedupeEventsByTitleAndDay = _dedupeEventsByTitleAndDay;
export const getEventResourcesSummary = _getEventResourcesSummary;

// -----------------------------------------------------------------------------
// Safe UI-facing summary types
// -----------------------------------------------------------------------------

/**
 * Minimal, serialisable event shape that is safe to use in pages and UI
 * components (no Dates, no "maybe" slug/title).
 */
export interface EventSummary {
  slug: string;
  title: string;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  description?: string | null;
  heroImage?: string | null;
  coverImage?: string | null;
  tags?: string[] | null;
  [key: string]: unknown;
}

/**
 * Normalise raw EventMeta into a predictable EventSummary.
 */
function normaliseEventMeta(raw: unknown): EventSummary {
  const ev = (raw ?? {}) as Record<string, unknown>;

  const slug = String(ev.slug ?? "").trim();
  const titleValue = typeof ev.title === "string" ? ev.title : "";
  const title = titleValue.trim().length ? titleValue : "Untitled event";

  const rawDate = (ev.date ?? ev.startDate) as unknown;
  let date: string | null = null;
  if (typeof rawDate === "string") {
    date = rawDate;
  } else if (rawDate instanceof Date && !Number.isNaN(rawDate.valueOf())) {
    date = rawDate.toISOString();
  }

  const heroImage =
    typeof ev.heroImage === "string"
      ? ev.heroImage
      : typeof ev.coverImage === "string"
      ? (ev.coverImage as string)
      : null;

  const coverImage =
    typeof ev.coverImage === "string"
      ? (ev.coverImage as string)
      : heroImage;

  const tags = Array.isArray(ev.tags)
    ? (ev.tags as unknown[]).filter((t) => typeof t === "string") as string[]
    : null;

  return {
    slug,
    title,
    date,
    time: typeof ev.time === "string" ? ev.time : null,
    location:
      typeof ev.location === "string"
        ? ev.location
        : typeof ev.venue === "string"
        ? (ev.venue as string)
        : null,
    description:
      typeof ev.description === "string"
        ? ev.description
        : typeof ev.excerpt === "string"
        ? (ev.excerpt as string)
        : null,
    heroImage,
    coverImage,
    tags,
    // Keep all raw fields available if needed downstream
    ...ev,
  };
}

// -----------------------------------------------------------------------------
// Safe helpers for pages / homepage
// -----------------------------------------------------------------------------

/**
 * All events as EventSummary[], safe for JSON serialisation and UI use.
 */
export function getAllEventsSafe(): EventSummary[] {
  const raw = _getAllEvents() as unknown[];
  return raw.map((e) => normaliseEventMeta(e));
}

/**
 * Single event by slug as EventSummary, or null if not found.
 */
export function getEventBySlugSafe(slug: string): EventSummary | null {
  if (!slug) return null;
  const raw = _getEventBySlug(slug);
  if (!raw) return null;
  return normaliseEventMeta(raw as unknown);
}

/**
 * Convenience: upcoming events only, sorted ascending by date.
 * Fallback: returns all safe events if no dates available.
 */
export function getUpcomingEventsSafe(limit?: number): EventSummary[] {
  const all = getAllEventsSafe();

  const withValidDate = all
    .map((e) => {
      if (!e.date) return null;
      const d = new Date(e.date);
      if (Number.isNaN(d.valueOf())) return null;
      return { ...e, _ts: d.valueOf() };
    })
    .filter(Boolean) as (EventSummary & { _ts: number })[];

  if (!withValidDate.length) {
    return typeof limit === "number" ? all.slice(0, limit) : all;
  }

  const now = Date.now();
  const upcoming = withValidDate
    .filter((e) => e._ts >= now)
    .sort((a, b) => a._ts - b._ts)
    .map(({ _ts, ...rest }) => rest);

  const list = upcoming.length ? upcoming : all;
  return typeof limit === "number" ? list.slice(0, limit) : list;
}