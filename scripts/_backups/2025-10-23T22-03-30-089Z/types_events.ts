// ./lib/events.ts

// Define the core types needed for EventMeta
export type ResourceLink = { href: string; label: string };
export type EventResources = {
    downloads?: ResourceLink[] | null;
    reads?: ResourceLink[] | null;
};

// Define the EventMeta interface
export interface EventMeta {
    slug: string;
    title: string;
    date: string;
    // Added based on previous context/sitemap requirement
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

export async function getAllEvents(fields?: string[]): Promise<EventMeta[]> {
    // In a real implementation, you would use 'fields' to filter the data
    // being fetched from Contentlayer, but for this placeholder, we return
    // the full list.

    // Note: The fields argument is included for compatibility with other functions
    // like getEventBySlug, as seen in previous snippets.

    return [
        {
            slug: "founders-salon",
            title: "Founders Salon",
            date: "2025-11-01",
            location: "London",
            summary: "A discussion for founders.",
            heroImage: "/assets/images/events/founders-salon.jpg",
            tags: ["salon", "leadership"],
            chatham: true,
            resources: {
                downloads: [{ href: "/downloads/example.pdf", label: "Guide" }],
                reads: [{ href: "/blog/example", label: "Article" }],
            },
        },
        {
            slug: "leadership-workshop",
            title: "Leadership Workshop",
            date: "2025-12-01",
            location: "London",
            summary: "A workshop on leadership.",
            heroImage: "/assets/images/events/leadership-workshop.jpg",
            tags: ["workshop", "leadership"],
            related: ["/blog/leadership-begins-at-home", "/blog/kingdom-strategies-for-a-loving-legacy"],
            // Note: If fields is provided, you might only return the requested fields
        },
    ];
}