// lib/events.ts
// Events data facade (MDX-backed)

import {
  getAllEventsMeta,
  getEventBySlug as getEventBySlugServer,
} from "@/lib/server/events-data";
import { safeSlice } from "@/lib/utils/safe";

// Type definitions
export type Event = any;
export type EventMeta = Event;
export type EventFieldKey = keyof EventMeta;

/**
 * Get all events (async)
 */
export async function getAllEvents(): Promise<EventMeta[]> {
  try {
    const events = await getAllEventsMeta();
    return Array.isArray(events) ? events : [];
  } catch {
    return [];
  }
}

/**
 * Get event by slug (async)
 */
export async function getEventBySlug(slug: string): Promise<Event | null> {
  try {
    return await getEventBySlugServer(slug);
  } catch {
    return null;
  }
}

/**
 * Get event slugs (async)
 */
export async function getEventSlugs(): Promise<string[]> {
  const events = await getAllEvents();
  return events.map((e: any) => e?.slug).filter(Boolean);
}

/**
 * Get public events (async)
 */
export async function getPublicEvents(): Promise<EventMeta[]> {
  const events = await getAllEvents();
  return events.filter((event: any) => {
    const isDraft = event?.draft === true;
    const isNotPublished = event?.published === false;
    const isStatusDraft = event?.status === "draft";
    return !(isDraft || isNotPublished || isStatusDraft);
  });
}

/**
 * Get upcoming events (async)
 */
export async function getUpcomingEvents(limit?: number): Promise<EventMeta[]> {
  const events = await getPublicEvents();
  const now = Date.now();

  const upcoming = events
    .filter((e: any) => {
      if (!e?.eventDate) return false;
      const t = Date.parse(String(e.eventDate));
      if (!Number.isFinite(t)) return false;
      return t >= now;
    })
    .sort((a: any, b: any) => {
      const ta = Date.parse(String(a?.eventDate || ""));
      const tb = Date.parse(String(b?.eventDate || ""));
      return (Number.isFinite(ta) ? ta : 0) - (Number.isFinite(tb) ? tb : 0);
    });

  return typeof limit === "number" ? safeSlice(upcoming, 0, limit) : upcoming;
}