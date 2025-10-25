// ./lib/server/events-data.ts

import type { EventMeta } from "@/lib/events";

export async function getAllEvents(fields: string[]): Promise<EventMeta[]> {
  // In a real implementation, you would use 'fields' to filter the data
  // being fetched from Contentlayer, but for this placeholder, we return
  // the full list and ignore the argument.
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
      related: [
        "/blog/leadership-begins-at-home",
        "/blog/kingdom-strategies-for-a-loving-legacy",
      ],
    },
  ];
}

export async function getEventSlugs(): Promise<string[]> {
  const events = await getAllEvents([]);
  return events.map((event) => event.slug);
}

export async function getEventBySlug(slug: string): Promise<EventMeta | null> {
  const events = await getAllEvents([]);
  return events.find((event) => event.slug === slug) || null;
}

export function dedupeEventsByTitleAndDay(events: EventMeta[]): EventMeta[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = `${event.title}-${event.date.split("T")[0]}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getEventResourcesSummary(events: EventMeta[]): {
  downloads: number;
  reads: number;
} {
  return events.reduce(
    (acc, event) => ({
      downloads: acc.downloads + (event.resources?.downloads?.length || 0),
      reads: acc.reads + (event.resources?.reads?.length || 0),
    }),
    { downloads: 0, reads: 0 },
  );
}
