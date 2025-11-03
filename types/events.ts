// types/event.ts

// --- 1. Utility Type Definitions ---
export type ResourceLink = { 
    href: string; 
    label: string; 
};

export type EventResources = {
    // FIX: Use ResourceLink type array, and allow null for serialization safety
    downloads?: ResourceLink[] | null; 
    reads?: ResourceLink[] | null;
};

// --- 2. Main Event Metadata Interface ---
/**
 * Defines the complete structure of an Event document, typically derived from 
 * Contentlayer frontmatter and augmented by server-side fetching utilities.
 * * NOTE: Fields are marked as optional (?) and explicitly allow null to prevent 
 * compilation failures when data is missing during runtime serialization.
 */
export interface EventMeta {
    // Required fields (enforced by Contentlayer, but marked safe by the code)
    slug: string;
    title: string;
    date: string; // ISO string format (e.g., "YYYY-MM-DD")

    // Optional fields (Allow null for robustness)
    endDate?: string | null; 
    location?: string | null; // Changed from 'string' to 'string | null' for safety
    excerpt?: string | null;
    summary?: string | null;
    
    // Image and Content Fields
    coverImage?: string | null;
    heroImage?: string | null;
    content?: string; // Raw MDX content is often included by slug fetcher

    // Event Specific Fields
    tags?: string[] | null;
    resources?: EventResources | null;
    chatham?: boolean; 
    related?: string[] | null;
    
    // CTA Fields
    ctaHref?: string | null;
    ctaLabel?: string | null;
}