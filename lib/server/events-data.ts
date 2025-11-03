// lib/server/events-data.ts (FINAL SYNCHRONIZED VERSION)

import { allEvents } from "contentlayer/generated";
// We import this, but do not re-define it
import { getDownloadsBySlugs, type DownloadMeta } from "@/lib/server/downloads-data";
// We must import the type definition to use it
import type { EventMeta } from "@/types/event"; 

// ----------------------------------------------------
// Data Fetching Functions
// ----------------------------------------------------

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

    return events;
}

export function getEventSlugs(): string[] {
    const events = getAllEvents([]); 
    if (!Array.isArray(events)) return []; 
    
    return events.map((event) => event.slug).filter(Boolean);
}

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
// ✅ CRITICAL FIX: Exporting Helper Functions
// ----------------------------------------------------

/**
 * Deduplicates a list of events based on matching titles and calendar day.
 */
export function dedupeEventsByTitleAndDay(events: EventMeta[]): EventMeta[] {
    const seen = new Set<string>();
    if (!Array.isArray(events)) return [];
    
    return events.filter((event) => {
        // CRITICAL ROBUSTNESS: Ensure date exists and is a string before splitting
        const datePart = typeof event.date === 'string' ? event.date.split("T")[0] : '';
        const key = `${event.title}-${datePart}`;
        
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
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