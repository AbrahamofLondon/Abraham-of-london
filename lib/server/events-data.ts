// lib/server/events-data.ts (CRITICAL FINAL FIX - Removing Duplicates)

// You must keep this import to use it in other files (like pages/events/[slug].tsx)
import { getDownloadsBySlugs } from "@/lib/server/downloads-data"; 
import { allEvents } from "contentlayer/generated";
// NOTE: EventMeta and ResourceLink types must be defined in your separate types/event.ts file

// ----------------------------------------------------
// CRITICAL FIX: Replaces hardcoded placeholder with Contentlayer data
// ----------------------------------------------------
export function getAllEvents(fields?: string[]): EventMeta[] {
    // CRITICAL: Map the Contentlayer Event object to your application's EventMeta type
    const events: EventMeta[] = allEvents.map(event => ({
        // Ensure all required fields exist or have safe fallbacks
        slug: event.slug ?? '',
        title: event.title ?? 'Untitled Event',
        date: event.date ?? new Date().toISOString(),
        location: event.location ?? null,
        summary: event.summary ?? null,
        tags: Array.isArray(event.tags) ? event.tags : null,
        
        // Spread the remaining fields from Contentlayer
        ...event
    })) as EventMeta[];

    return events;
}

// ----------------------------------------------------
// FIX: getEventSlugs (Synchronous and guaranteed Array return)
// ----------------------------------------------------
export function getEventSlugs(): string[] {
    const events = getAllEvents([]); 
    if (!Array.isArray(events)) return []; 
    
    return events.map((event) => event.slug).filter(Boolean);
}

// ----------------------------------------------------
// FIX: getEventBySlug (Finds event using the clean data)
// ----------------------------------------------------
export function getEventBySlug(slug: string, fields: string[]): (EventMeta & { content?: string }) | null {
    const allEvents = getAllEvents(fields);
    const doc = allEvents.find((event) => event.slug === slug) || null;
    
    // NOTE: This assumes 'content' is attached by Contentlayer or ignored by this utility.
    return doc; 
}

// ----------------------------------------------------
// DELETE all other utility functions (dedupeEventsByTitleAndDay, getEventResourcesSummary, 
// and especially the duplicate getDownloadsBySlugs implementation) if they are 
// defined later in this file. They belong in a separate utility file.
// ----------------------------------------------------