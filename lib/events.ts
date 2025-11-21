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
// NOTE: getEventSlugs is wrapped below for safety instead of direct alias.

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
      ? (ev.heroImage as string)
      : typeof ev.coverImage === "string"
      ? (ev.coverImage as string)
      : null;

  const coverImage =
    typeof ev.coverImage === "string"
      ? (ev.coverImage as string)
      : heroImage;

  const tags = Array.isArray(ev.tags)
    ? (ev.tags as unknown[])
        .filter((t) => typeof t === "string")
        .map((t) => t as string)
    : null;

  return {
    slug,
    title,
    date,
    time: typeof ev.time === "string" ? (ev.time as string) : null,
    location:
      typeof ev.location === "string"
        ? (ev.location as string)
        : typeof ev.venue === "string"
        ? (ev.venue as string)
        : null,
    description:
      typeof ev.description === "string"
        ? (ev.description as string)
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
 * Safe slugs for SSG – trimmed, non-empty.
 * Falls back to deriving from all events if the raw getter misbehaves.
 */
export function getEventSlugs(): string[] {
  try {
    const raw = _getEventSlugs?.() ?? [];
    const array = Array.isArray(raw) ? raw : [];
    const cleaned = array
      .map((s) => String(s ?? "").trim())
      .filter((s) => s.length > 0);

    if (cleaned.length > 0) return cleaned;
  } catch {
    // ignore and fall back
  }

  // Fallback – derive from all events
  return getAllEventsSafe()
    .map((e) => e.slug)
    .filter((s) => s.length > 0);
}

/**
 * All events as EventSummary[], safe for JSON serialisation and UI use.
 */
export function getAllEventsSafe(): EventSummary[] {
  const raw = (_getAllEvents?.() ?? []) as unknown[];
  return raw.map((e) => normaliseEventMeta(e));
}

/**
 * Single event by slug as EventSummary, or null if not found.
 * Tries the underlying getEventBySlug first, then falls back
 * to scanning all events by normalised slug.
 */
export function getEventBySlugSafe(slug: string): EventSummary | null {
  const target = String(slug ?? "").trim();
  if (!target) return null;

  // 1) Try raw implementation first (correctly trimmed)
  try {
    const direct = _getEventBySlug?.(target) as unknown;
    if (direct) {
      return normaliseEventMeta(direct);
    }
  } catch {
    // ignore and fall through to fallback
  }

  // 2) Fallback: scan all events and match by normalised slug
  const allRaw = (_getAllEvents?.() ?? []) as unknown[];
  for (const ev of allRaw) {
    const normalised = normaliseEventMeta(ev);
    if (normalised.slug === target) return normalised;
  }

  return null;
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