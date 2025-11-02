// ./lib/events.ts (FINAL CONTENTLAYER INTEGRATION)

// --- Type Definitions (Keep these as they allow nulls, fixing your TS errors) ---
export type ResourceLink = { href: string; label: string };
export type EventResources = {
    downloads?: ResourceLink[] | null;
    reads?: ResourceLink[] | null;
};
export interface EventMeta {
    slug: string;
    title: string;
    date: string;
    endDate?: string | null; 
    location?: string;
    excerpt?: string;
    summary?: string;
    coverImage?: string | null;
    heroImage?: string | null;
    ctaHref?: string;
    ctaLabel?: string;
    tags?: string[];
    content?: string;
    resources?: EventResources | null;
    chatham?: boolean; 
    related?: string[];
}
// -------------------------------------------------------------------------
// ✅ CRITICAL FIX: Replace placeholder data with actual Contentlayer fetch
// -------------------------------------------------------------------------

// Assuming your Contentlayer generated types are accessible, e.g., 'allEvents'
// If you are using next-contentlayer2, you would typically import it like this:
import { allEvents } from "contentlayer/generated";

// Function to fetch ALL events from the Contentlayer output
export function getAllEvents(fields?: string[]): EventMeta[] {
    // Coerce Contentlayer's output (allEvents) to your EventMeta structure
    const events: EventMeta[] = allEvents.map(event => ({
        // Map all fields, using null coalescing for safety
        slug: event.slug ?? '',
        title: event.title ?? 'Untitled Event',
        date: event.date ?? new Date().toISOString(),
        location: event.location ?? null,
        summary: event.summary ?? null,
        // ... include all other fields explicitly, using null if missing
        chatham: event.chatham ?? false,
        tags: event.tags ?? null,
        // Since resources field in Contentlayer is likely JSON/object, ensure it's mapped safely
        resources: (event.resources as EventResources) ?? null, 
        
        // This spreads the rest of the properties, ensuring everything defined in the frontmatter is included.
        ...event
    })) as EventMeta[];

    // Return the full list for the index page
    return events;
}

// Function to get all slugs (relies on the function above)
export function getEventSlugs(): string[] {
    const events = getAllEvents();
    return events.map((event) => event.slug);
}

// Function to get a single event by slug
export function getEventBySlug(slug: string): EventMeta | null {
    const events = getAllEvents();
    return events.find((event) => event.slug === slug) || null;
}

// ... (Keep the rest of your utility functions: dedupeEventsByTitleAndDay, getEventResourcesSummary)
// Note: You must ensure the rest of your file is synchronized with the latest helper function definitions.