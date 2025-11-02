// lib/server/events-data.ts (FINAL SYNCHRONIZED VERSION)

import { allEvents } from "contentlayer/generated"; // Assuming successful Contentlayer integration
import { getDownloadsBySlugs, type DownloadMeta } from "@/lib/server/downloads-data";

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
    
    // Ensure slug is a string before using map
    return events.map((event) => event.slug).filter(Boolean);
}

// ----------------------------------------------------
// FIX: getEventBySlug (Finds event using the clean data)
// ----------------------------------------------------
export function getEventBySlug(slug: string, fields: string[]): (EventMeta & { content?: string }) | null {
    const allEvents = getAllEvents(fields);
    const doc = allEvents.find((event) => event.slug === slug) || null;
    
    // In a production app, content is usually attached by Contentlayer/MDX serialization.
    // For local dev/testing, ensure content is available if needed.
    // NOTE: This placeholder assumes 'content' is part of the Contentlayer structure or handled elsewhere.
    if (doc) {
        // Since we are inside the server-side utility, we can augment the document here if needed.
        // For simplicity, we return the found document.
        return doc; 
    }

    return null;
}

// --- Placeholder/Utility Functions (Keep these as separate imports in your actual file) ---

export function getDownloadsBySlugs(
  slugs: string[],
  fields: string[]
): DownloadMeta[] {
  // NOTE: This function needs to be correctly implemented to read your downloads folder.
  // Assuming this is imported from lib/server/downloads-data.ts
  return []; // Placeholder return
}

export function dedupeEventsByTitleAndDay(events: EventMeta[]): EventMeta[] {
  // NOTE: Keep your robust logic from the previous step here
  return events; 
}

export function getEventResourcesSummary(events: EventMeta[]): { downloads: number; reads: number } {
    // NOTE: Keep your robust logic from the previous step here
    return { downloads: 0, reads: 0 };
}