// types/event.ts

// --- 1. Utility Type Definitions ---
export type ResourceLink = { 
    href: string; 
    label: string; 
};

export type EventResources = {
    // Allow null for serialization safety
    downloads?: ResourceLink[] | null; 
    reads?: ResourceLink[] | null;
};

// --- 2. Main Event Metadata Interface ---
/**
 * Defines the complete structure of an Event document.
 * All optional fields are explicitly unioned with 'null' to allow for missing data.
 */
export interface EventMeta {
    // Required fields
    slug: string;
    title: string;
    date: string; // ISO string format (e.g., "YYYY-MM-DD")

    // Optional fields (Allow null for robustness)
    endDate?: string | null; 
    location?: string | null;
    excerpt?: string | null;
    summary?: string | null;
    
    // Image and Content Fields
    coverImage?: string | null;
    heroImage?: string | null;
    content?: string; // Raw MDX content

    // Event Specific Fields
    tags?: string[] | null;
    resources?: EventResources | null;
    chatham?: boolean; 
    related?: string[] | null;
    
    // CTA Fields
    ctaHref?: string | null;
    ctaLabel?: string | null;
}