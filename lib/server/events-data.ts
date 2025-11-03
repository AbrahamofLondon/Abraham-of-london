// lib/server/events-data.ts (FINAL SYNCHRONIZED VERSION)

import { allEvents } from "contentlayer/generated";
import type { EventMeta } from "@/types/event"; // Use the central event type

// ----------------------------------------------------
// Data Fetching Functions
// ----------------------------------------------------

/**
 * Fetches all events from Contentlayer and maps them to the robust EventMeta type.
 */
export function getAllEvents(fields?: string[]): EventMeta[] {
    const events: EventMeta[] = allEvents.map(event => ({
        // Ensure all required fields exist or have safe fallbacks
        slug: event.slug ?? '',
        title: event.title ?? 'Untitled Event',
        date: event.date ?? new Date().toISOString(),
        location: event.location ?? null,
        summary: event.summary ?? null,
        tags: Array.isArray(event.tags) ? event.tags : null,
        
        // Spread the remaining fields from Contentlayer
        ...event,

        // Ensure resource structure is safe, even if 'any'
        resources: (event as any).resources ? {
             downloads: (event as any).resources.downloads ?? null,
             reads: (event as any).resources.reads ?? null,
        } : null,
        
    })) as EventMeta[];

    // Sort by date descending (newest first) by default
    return events.sort((a, b) => (new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()));
}

/**
 * Gets all event slugs for getStaticPaths.
 */
export function getEventSlugs(): string[] {
    const events = getAllEvents([]); 
    if (!Array.isArray(events)) return []; 
    
    return events.map((event) => event.slug).filter(Boolean);
}

/**
 * Gets a single event by slug, ensuring content is included.
 */
export function getEventBySlug(slug: string, fields?: string[]): (EventMeta & { content?: string }) | null {
    const doc = allEvents.find((event) => event.slug === slug) || null;
    
    if (doc) {
        return {
            ...doc,
            slug: doc.slug ?? '',
            title: doc.title ?? 'Untitled Event',
            date: doc.date ?? new Date().toISOString(),
            location: doc.location ?? null,
            summary: doc.summary ?? null,
            tags: Array.isArray(doc.tags) ? doc.tags : null,
            // Pass the MDX content
            content: doc.body.code, 
            // Ensure resources are safely mapped
            resources: (doc as any).resources ? {
                downloads: (doc as any).resources.downloads ?? null,
                reads: (doc as any).resources.reads ?? null,
            } : null,
        } as EventMeta & { content?: string };
    }
    
    return null;
}

// ----------------------------------------------------
// Helper Functions (Now Correctly Exported)
// ----------------------------------------------------

/** Convert a date string to a YYYY-MM-DD key in Europe/London. */
function dateKey(d: string): string {
  // handle both ISO-like and yyyy-mm-dd literal
  const only = /^\d{4}-\d{2}-\d{2}$/.test(d);
  if (only) return d;
  const dt = new Date(d);
  if (Number.isNaN(dt.valueOf())) return ""; // will sort to bottom
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dt);
}

/**
 * Deduplicates a list of events based on matching titles and calendar day.
 * This is the function your index page was missing.
 */
export function dedupeEventsByTitleAndDay(events: EventMeta[]): EventMeta[] {
    const seen = new Set<string>();
    const out: EventMeta[] = [];
    if (!Array.isArray(events)) return [];

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

/**
 * Sorts events by date, ascending (soonest first).
 */
export function sortEventsAsc(events: EventMeta[]): EventMeta[] {
    if (!Array.isArray(events)) return [];
    return [...events].sort((a, b) => +new Date(a.date) - +new Date(b.date));
}