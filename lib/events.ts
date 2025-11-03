// lib/server/events-data.ts (FINAL ROBUST VERSION)

import { allEvents } from "contentlayer/generated";
import type { EventMeta, EventResources } from "@/types/event"; // Use the central event type

// ----------------------------------------------------
// Data Fetching Functions
// ----------------------------------------------------

export function getAllEvents(fields?: string[]): EventMeta[] {
    const events: EventMeta[] = allEvents.map(event => {
        // Destructure all known properties from the Contentlayer event
        const { 
            slug, 
            title, 
            date, 
            location, 
            summary, 
            chatham, 
            tags, 
            resources, 
            ...rest // Capture all other properties
        } = event;
        
        // ✅ CRITICAL FIX: Build the new object. Spread 'rest' first, 
        // then explicitly define the safe, coerced values.
        // This avoids the "'slug' is specified more than once" error.
        return {
            ...rest, // Spread the remaining properties
            slug: slug ?? '', // Overwrite with the safe value
            title: title ?? 'Untitled Event', // Overwrite with the safe value
            date: date ?? new Date().toISOString(), // Overwrite with the safe value
            location: location ?? null, // Overwrite with the safe value
            summary: summary ?? null, // Overwrite with the safe value
            chatham: chatham ?? false, // Overwrite with the safe value
            tags: Array.isArray(tags) ? tags : null, // Correctly check for array
            resources: (resources as EventResources) ?? null, // Overwrite with the safe value
        } as EventMeta; // Cast to EventMeta
    });

    // Sort by date descending (newest first) by default
    return events.sort((a, b) => (new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()));
}

export function getEventSlugs(): string[] {
    const events = getAllEvents([]); 
    if (!Array.isArray(events)) return []; 
    
    return events.map((event) => event.slug).filter(Boolean);
}

export function getEventBySlug(slug: string, fields?: string[]): (EventMeta & { content?: string }) | null {
    const doc = allEvents.find((event) => event.slug === slug) || null;
    
    if (doc) {
        // Destructure all known properties
        const { 
            slug: docSlug, 
            title, 
            date, 
            location, 
            summary, 
            chatham, 
            tags, 
            resources,
            body, // Get the body (MDX code)
            ...rest 
        } = doc;

        // Return the full, safe object
        return {
            ...rest,
            slug: docSlug ?? '',
            title: title ?? 'Untitled Event',
            date: date ?? new Date().toISOString(),
            location: location ?? null,
            summary: summary ?? null,
            tags: Array.isArray(tags) ? tags : null,
            content: body.code, // Pass the MDX content
            resources: (resources as EventResources) ?? null,
        } as EventMeta & { content?: string };
    }
    
    return null;
}

// ----------------------------------------------------
// Helper Functions (Correctly Exported)
// ----------------------------------------------------

/** Convert a date string to a YYYY-MM-DD key in Europe/London. */
function dateKey(d: string): string {
  const only = /^\d{4}-\d{2}-\d{2}$/.test(d);
  if (only) return d;
  const dt = new Date(d);
  if (Number.isNaN(dt.valueOf())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dt);
}

/**
 * Deduplicates a list of events based on matching titles and calendar day.
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
 * Calculates the total number of download and read links from a list of events.
 */
export function getEventResourcesSummary(events: EventMeta[]): { downloads: number; reads: number } {
    if (!Array.isArray(events)) return { downloads: 0, reads: 0 };

    return events.reduce(
        (acc, event) => ({
            downloads: acc.downloads + (event.resources?.downloads?.length || 0),
            reads: acc.reads + (event.resources?.reads?.length || 0),
        }),
        { downloads: 0, reads: 0 }
    );
}