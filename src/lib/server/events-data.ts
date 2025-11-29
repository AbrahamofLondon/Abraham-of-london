src / lib / server / events - data.ts;
import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Server-side guard
if (typeof window !== "undefined") {
  throw new Error("This module is server-only");
}

export interface EventMeta {
  slug: string;
  title: string;
  description?: string;
  excerpt?: string;
  date: string;
  endDate?: string;
  location?: string;
  venue?: string;
  category?: string;
  tags?: string[];
  author?: string;
  featured?: boolean;
  registrationUrl?: string;
  content?: string;
}

const eventsDir = path.join(process.cwd(), "content", "events");
const exts = [".mdx", ".md"] as const;

function resolveEventPath(slug: string): string | null {
  const real = slug.replace(/\.mdx?$/i, "");

  if (!fs.existsSync(eventsDir)) {
    console.warn("[events-data] Events directory does not exist:", eventsDir);
    return null;
  }

  for (const ext of exts) {
    const full = path.join(eventsDir, `${real}${ext}`);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

export function getEventSlugs(): string[] {
  if (!fs.existsSync(eventsDir)) {
    console.warn("[events-data] Events directory not found:", eventsDir);
    return [];
  }

  try {
    return fs
      .readdirSync(eventsDir)
      .filter((f) => exts.some((e) => f.toLowerCase().endsWith(e)))
      .map((f) => f.replace(/\.mdx?$/i, ""));
  } catch (err) {
    console.error("[events-data] Error reading events directory:", err);
    return [];
  }
}

export function getEventBySlug(
  slug: string,
  fields: string[] = []
): EventMeta | null {
  const real = slug.replace(/\.mdx?$/i, "");
  const fullPath = resolveEventPath(real);

  if (!fullPath) {
    console.warn("[events-data] Event not found for slug:", real);

    // Check mock events
    const knownEvent = mockEvents.find((event) => event.slug === real);
    if (knownEvent) {
      if (fields.length > 0) {
        const filteredEvent: any = {};
        fields.forEach((field) => {
          if (field in knownEvent) {
            filteredEvent[field] = (knownEvent as any)[field];
          }
        });
        return filteredEvent;
      }
      return knownEvent;
    }

    return null;
  }

  try {
    const raw = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(raw);
    const fm = data || {};

    const eventData: EventMeta = {
      slug: real,
      title: typeof fm.title === "string" ? fm.title : "Untitled Event",
      description:
        typeof fm.description === "string" ? fm.description : undefined,
      excerpt: typeof fm.excerpt === "string" ? fm.excerpt : undefined,
      date: typeof fm.date === "string" ? fm.date : new Date().toISOString(),
      endDate: typeof fm.endDate === "string" ? fm.endDate : undefined,
      location: typeof fm.location === "string" ? fm.location : undefined,
      venue: typeof fm.venue === "string" ? fm.venue : undefined,
      category: typeof fm.category === "string" ? fm.category : undefined,
      tags: Array.isArray(fm.tags) ? fm.tags : undefined,
      author: typeof fm.author === "string" ? fm.author : "Abraham of London",
      featured: typeof fm.featured === "boolean" ? fm.featured : false,
      registrationUrl:
        typeof fm.registrationUrl === "string" ? fm.registrationUrl : undefined,
      content: content || "",
    };

    if (fields.length > 0) {
      const filteredEvent: any = {};
      fields.forEach((field) => {
        if (field in eventData) {
          filteredEvent[field] = (eventData as any)[field];
        }
      });
      return filteredEvent;
    }

    return eventData;
  } catch (err) {
    console.error(`[events-data] Error processing event ${slug}:`, err);

    const knownEvent = mockEvents.find((event) => event.slug === real);
    if (knownEvent) {
      if (fields.length > 0) {
        const filteredEvent: any = {};
        fields.forEach((field) => {
          if (field in knownEvent) {
            filteredEvent[field] = (knownEvent as any)[field];
          }
        });
        return filteredEvent;
      }
      return knownEvent;
    }

    return null;
  }
}

export function getAllEvents(fields: string[] = []): EventMeta[] {
  const slugs = getEventSlugs();
  const events: EventMeta[] = [];

  for (const slug of slugs) {
    const event = getEventBySlug(slug, fields);
    if (event) {
      events.push(event);
    }
  }

  // If no events found in filesystem, use mock events
  if (events.length === 0) {
    console.warn(
      "[events-data] No events found in filesystem, using mock data"
    );
    return mockEvents.map((event) => {
      if (fields.length > 0) {
        const filteredEvent: any = {};
        fields.forEach((field) => {
          if (field in event) {
            filteredEvent[field] = (event as any)[field];
          }
        });
        return filteredEvent as EventMeta;
      }
      return event;
    });
  }

  // Sort by date (upcoming first)
  events.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return events;
}

export function getUpcomingEvents(limit?: number): EventMeta[] {
  const now = new Date();
  const events = getAllEvents().filter((event) => new Date(event.date) >= now);

  if (limit) {
    return events.slice(0, limit);
  }

  return events;
}

// Mock data fallback for development
export const mockEvents: EventMeta[] = [
  {
    slug: "strategic-fatherhood-workshop",
    title: "Strategic Fatherhood Workshop",
    description: "A deep dive into intentional fatherhood and legacy building",
    excerpt:
      "Learn practical strategies for being an intentional father and building lasting legacy",
    date: "2024-03-15",
    endDate: "2024-03-16",
    location: "London, UK",
    venue: "The Leadership Centre",
    category: "Workshop",
    tags: ["fatherhood", "legacy", "workshop"],
    author: "Abraham of London",
    featured: true,
    registrationUrl: "/register/strategic-fatherhood",
    content:
      "# Strategic Fatherhood Workshop\n\nJoin us for this transformative workshop...",
  },
  {
    slug: "founders-roundtable",
    title: "Founders Roundtable",
    description:
      "Monthly gathering for faith-driven entrepreneurs and founders",
    excerpt:
      "Connect with other founders building businesses with purpose and conviction",
    date: "2024-02-28",
    location: "Virtual",
    category: "Roundtable",
    tags: ["entrepreneurship", "founders", "faith"],
    author: "Abraham of London",
    featured: false,
    registrationUrl: "/register/founders-roundtable",
    content:
      "# Founders Roundtable\n\nOur monthly gathering for purpose-driven founders...",
  },
];

export default {
  getEventSlugs,
  getEventBySlug,
  getAllEvents,
  getUpcomingEvents,
  mockEvents,
};
