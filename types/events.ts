code lib/events.ts
import type { EventMeta } from "@/lib/events";

export async function getAllEvents(): Promise<EventMeta[]> {
  // Fetch or import events data (e.g., from MDX or a database)
  return [
    {
      slug: "example-event",
      title: "Example Event",
      date: "2025-11-01",
      location: "London",
      summary: "An example event.",
      heroImage: "/assets/images/events/example.jpg",
      tags: ["workshop", "leadership"],
      resources: {
        downloads: [{ href: "/downloads/example.pdf", label: "Guide" }],
        reads: [{ href: "/blog/example", label: "Article" }],
      },
    },
  ];
}