// ./lib/server/events-data.ts (FINAL ROBUST VERSION)
import type { EventMeta } from "@/lib/events"; // Assuming EventMeta definition is correct

// ----------------------------------------------------
// ✅ FIX: getAllEvents (Guarantees array return for safety)
// ----------------------------------------------------
// NOTE: Since this is placeholder data, we make it synchronous and guarantee an array.
export function getAllEvents(fields: string[]): EventMeta[] {
  // Hardcoded data definition (replace with actual Contentlayer fetch if possible)
  const events: EventMeta[] = [
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
      // Ensure all event properties expected by the component are present, even if null
      related: null,
    },
    {
      slug: "leadership-workshop",
      title: "Leadership Workshop",
      date: "2025-12-01",
      location: "London",
      summary: "A workshop on leadership.",
      heroImage: "/assets/images/events/leadership-workshop.jpg",
      tags: ["workshop", "leadership"],
      chatham: false,
      resources: null,
      related: ["/blog/leadership-begins-at-home", "/blog/kingdom-strategies-for-a-loving-legacy"],
    },
  ];
  return events;
}

// ----------------------------------------------------
// ✅ FIX: getEventSlugs (Synchronous and guaranteed Array.map operation)
// ----------------------------------------------------
// NOTE: Resolves the "map is not a function" crash.
export function getEventSlugs(): string[] {
  const events = getAllEvents([]); 
  // Ensure events is an array before map (though getAllEvents guarantees it)
  if (!Array.isArray(events)) return []; 
  
  return events.map((event) => event.slug);
}

// ----------------------------------------------------
// getEventBySlug (Synchronous and guaranteed definition)
// ----------------------------------------------------
export function getEventBySlug(slug: string): EventMeta | null {
  const events = getAllEvents([]);
  return events.find((event) => event.slug === slug) || null;
}

// --- Other Utilities (Simplified to syncronous array operations) ---

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

export function getEventResourcesSummary(events: EventMeta[]): { downloads: number; reads: number } {
  if (!Array.isArray(events)) return { downloads: 0, reads: 0 };

  return events.reduce(
    (acc, event) => ({
      // ROBUSTNESS: Use optional chaining and null coalescing
      downloads: acc.downloads + (event.resources?.downloads?.length || 0),
      reads: acc.reads + (event.resources?.reads?.length || 0),
    }),
    { downloads: 0, reads: 0 }
  );
}