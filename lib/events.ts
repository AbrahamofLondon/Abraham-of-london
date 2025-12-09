// lib/events.ts
// Events data facade

import { getAllEventsMeta, getEventBySlug as getEventBySlugServer } from "@/lib/server/events-data";

// Type definitions
export type Event = any;
export type EventMeta = Event;
export type EventFieldKey = keyof EventMeta;

/**
 * Get all events
 */
export function getAllEvents(): EventMeta[] {
  try {
    const events = getAllEventsMeta();
    return Array.isArray(events) ? events : [];
  } catch {
    return [];
  }
}

/**
 * Get event by slug
 */
export function getEventBySlug(slug: string): Event | null {
  try {
    return getEventBySlugServer(slug);
  } catch {
    return null;
  }
}

/**
 * Get event slugs
 */
export function getEventSlugs(): string[] {
  const events = getAllEvents();
  return events.map(e => e.slug).filter(Boolean);
}

/**
 * Get public events
 */
export function getPublicEvents(): EventMeta[] {
  const events = getAllEvents();
  return events.filter(event => {
    const isDraft = event.draft === true;
    const isNotPublished = event.published === false;
    const isStatusDraft = event.status === 'draft';
    return !(isDraft || isNotPublished || isStatusDraft);
  });
}

/**
 * Get upcoming events
 */
export function getUpcomingEvents(limit?: number): EventMeta[] {
  const events = getPublicEvents();
  const now = new Date();
  const upcoming = events.filter(e => {
    if (!e.eventDate) return false;
    const eventDate = new Date(e.eventDate);
    return eventDate >= now;
  }).sort((a, b) => {
    const dateA = new Date(a.eventDate || '').getTime();
    const dateB = new Date(b.eventDate || '').getTime();
    return dateA - dateB;
  });
  return limit ? upcoming.slice(0, limit) : upcoming;
}
