// src/lib/server/events-data.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

// -----------------------------------------------------------------------------
// Core types
// -----------------------------------------------------------------------------

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
  heroImage?: string;
  coverImage?: string;
  time?: string;
  content?: string;
}

// Lightweight "resource" model used by lib/events.ts
export interface EventResourceLink {
  label: string;
  href: string;
  category?: string;
}

export interface EventResources {
  primary?: EventResourceLink[];
  secondary?: EventResourceLink[];
  misc?: EventResourceLink[];
  [section: string]: EventResourceLink[] | undefined;
}

// -----------------------------------------------------------------------------
// Server-only guard
// -----------------------------------------------------------------------------

if (typeof window !== "undefined") {
  throw new Error("events-data must not be imported on the client");
}

// -----------------------------------------------------------------------------
// FS constants
// -----------------------------------------------------------------------------

const eventsDir = path.join(process.cwd(), "content", "events");
const exts = [".mdx", ".md"] as const;

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

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

// Helper to safely filter event fields
function filterEventFields(event: EventMeta, fields: string[]): Partial<EventMeta> {
  if (fields.length === 0) return event;
  
  const filtered: Record<string, unknown> = {};
  fields.forEach((field) => {
    if (field in event) {
      filtered[field] = (event as any)[field];
    }
  });
  
  // Ensure required fields are present if they were requested
  const requiredFields = ['slug', 'title', 'date'] as const;
  requiredFields.forEach(field => {
    if (fields.includes(field) && field in event) {
      filtered[field] = (event as any)[field];
    }
  });
  
  return filtered as Partial<EventMeta>;
}

// -----------------------------------------------------------------------------
// Core API
// -----------------------------------------------------------------------------

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

    const knownEvent = mockEvents.find((event) => event.slug === real);
    if (knownEvent) {
      if (fields.length > 0) {
        const filtered = filterEventFields(knownEvent, fields);
        // If we don't have all required fields, return null or full event
        if (fields.includes('slug') && fields.includes('title') && fields.includes('date')) {
          return filtered as EventMeta;
        }
        // Return full event if we weren't filtering for specific fields
        return knownEvent;
      }
      return knownEvent;
    }

    return null;
  }

  try {
    const raw = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(raw);
    const fm = data || {};

    const title =
      typeof fm.title === "string" && fm.title.trim().length
        ? fm.title
        : "Untitled Event";

    const description =
      typeof fm.description === "string" ? fm.description : undefined;

    const excerpt =
      typeof fm.excerpt === "string"
        ? fm.excerpt
        : typeof fm.summary === "string"
          ? fm.summary
          : description;

    const date =
      typeof fm.date === "string" && fm.date.trim().length
        ? fm.date
        : new Date().toISOString();

    const heroImage =
      typeof fm.heroImage === "string"
        ? fm.heroImage
        : typeof fm.coverImage === "string"
          ? fm.coverImage
          : undefined;

    const coverImage =
      typeof fm.coverImage === "string" ? fm.coverImage : heroImage;

    const eventData: EventMeta = {
      slug: real,
      title,
      description,
      excerpt,
      date,
      endDate:
        typeof fm.endDate === "string" && fm.endDate.trim().length
          ? fm.endDate
          : undefined,
      location:
        typeof fm.location === "string" && fm.location.trim().length
          ? fm.location
          : undefined,
      venue:
        typeof fm.venue === "string" && fm.venue.trim().length
          ? fm.venue
          : undefined,
      category:
        typeof fm.category === "string" && fm.category.trim().length
          ? fm.category
          : undefined,
      tags: Array.isArray(fm.tags) ? fm.tags : undefined,
      author:
        typeof fm.author === "string" && fm.author.trim().length
          ? fm.author
          : "Abraham of London",
      featured: typeof fm.featured === "boolean" ? fm.featured : false,
      registrationUrl:
        typeof fm.registrationUrl === "string" && fm.registrationUrl.trim().length
          ? fm.registrationUrl
          : undefined,
      heroImage,
      coverImage,
      time:
        typeof fm.time === "string" && fm.time.trim().length
          ? fm.time
          : undefined,
      content: content || "",
    };

    if (fields.length > 0) {
      const filtered = filterEventFields(eventData, fields);
      // If we don't have all required fields, return null or full event
      if (fields.includes('slug') && fields.includes('title') && fields.includes('date')) {
        return filtered as EventMeta;
      }
      // Return full event if we weren't filtering for specific fields
      return eventData;
    }

    return eventData;
  } catch (err) {
    console.error(`[events-data] Error processing event ${slug}:`, err);

    const knownEvent = mockEvents.find((event) => event.slug === real);
    if (knownEvent) {
      if (fields.length > 0) {
        const filtered = filterEventFields(knownEvent, fields);
        // If we don't have all required fields, return null or full event
        if (fields.includes('slug') && fields.includes('title') && fields.includes('date')) {
          return filtered as EventMeta;
        }
        // Return full event if we weren't filtering for specific fields
        return knownEvent;
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

  if (events.length === 0) {
    console.warn(
      "[events-data] No events found in filesystem, using mock data"
    );
    return mockEvents.map((event) => {
      if (fields.length > 0) {
        const filtered = filterEventFields(event, fields);
        // Only return as EventMeta if we have required fields
        if (fields.includes('slug') && fields.includes('title') && fields.includes('date')) {
          return filtered as EventMeta;
        }
        // Otherwise return full event
        return event;
      }
      return event;
    });
  }

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

// -----------------------------------------------------------------------------
// Backwards-compat convenience functions (for lib/events.ts and callers)
// -----------------------------------------------------------------------------

/**
 * getEventsBySlugs - simple batch resolver used in some older code paths.
 */
export function getEventsBySlugs(
  slugs: string[],
  fields: string[] = []
): EventMeta[] {
  const unique = Array.from(
    new Set(
      slugs
        .map((s) => String(s ?? "").trim())
        .filter((s) => s.length > 0)
    )
  );

  return unique
    .map((slug) => getEventBySlug(slug, fields))
    .filter((ev): ev is EventMeta => Boolean(ev));
}

/**
 * getAllContent - thin facade kept for historical reasons.
 * Returns a simple object keyed by "events".
 */
export function getAllContent(fields: string[] = []): { events: EventMeta[] } {
  return {
    events: getAllEvents(fields),
  };
}

/**
 * dedupeEventsByTitleAndDay - removes duplicates by lowercased title + date (YYYY-MM-DD).
 * Keeps the first occurrence.
 */
export function dedupeEventsByTitleAndDay(events: EventMeta[]): EventMeta[] {
  const seen = new Set<string>();
  const result: EventMeta[] = [];

  for (const ev of events) {
    const titleKey = (ev.title || "").trim().toLowerCase();
    const dateKey = ev.date ? new Date(ev.date).toISOString().slice(0, 10) : "";

    const key = `${titleKey}::${dateKey}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(ev);
    }
  }

  return result;
}

/**
 * getEventResourcesSummary - structured "resource links" helper.
 * We keep it intentionally conservative: registration URL, plus any obvious links.
 */
export function getEventResourcesSummary(slug: string): EventResources {
  const ev = getEventBySlug(slug);
  if (!ev) return {};

  const resources: EventResources = {};

  const primary: EventResourceLink[] = [];
  const secondary: EventResourceLink[] = [];
  const misc: EventResourceLink[] = [];

  if (ev.registrationUrl) {
    primary.push({
      label: "Register",
      href: ev.registrationUrl,
      category: "registration",
    });
  }

  // Expandable: if you later add fields like `slidesUrl`, `replayUrl`, etc.,
  // you can push them into secondary/misc here.

  if (primary.length) resources.primary = primary;
  if (secondary.length) resources.secondary = secondary;
  if (misc.length) resources.misc = misc;

  return resources;
}

// -----------------------------------------------------------------------------
// Mock data fallback for development
// -----------------------------------------------------------------------------

export const mockEvents: EventMeta[] = [
  {
    slug: "strategic-fatherhood-workshop",
    title: "Strategic Fatherhood Workshop",
    description:
      "A deep dive into intentional fatherhood and legacy building.",
    excerpt:
      "Learn practical strategies for being an intentional father and building lasting legacy.",
    date: "2024-03-15",
    endDate: "2024-03-16",
    location: "London, UK",
    venue: "The Leadership Centre",
    category: "Workshop",
    tags: ["fatherhood", "legacy", "workshop"],
    author: "Abraham of London",
    featured: true,
    registrationUrl: "/register/strategic-fatherhood",
    heroImage: "/assets/images/events/strategic-fatherhood-workshop.jpg",
    coverImage: "/assets/images/events/strategic-fatherhood-workshop.jpg",
    content:
      "# Strategic Fatherhood Workshop\n\nJoin us for this transformative workshop...",
  },
  {
    slug: "founders-roundtable",
    title: "Founders Roundtable",
    description:
      "Monthly gathering for faith-driven entrepreneurs and founders.",
    excerpt:
      "Connect with other founders building businesses with purpose and conviction.",
    date: "2024-02-28",
    location: "Virtual",
    category: "Roundtable",
    tags: ["entrepreneurship", "founders", "faith"],
    author: "Abraham of London",
    featured: false,
    registrationUrl: "/register/founders-roundtable",
    heroImage: "/assets/images/events/founders-roundtable.jpg",
    coverImage: "/assets/images/events/founders-roundtable.jpg",
    content:
      "# Founders Roundtable\n\nOur monthly gathering for purpose-driven founders...",
  },
];

// Default export for any legacy imports
export default {
  getEventSlugs,
  getEventBySlug,
  getAllEvents,
  getUpcomingEvents,
  getEventsBySlugs,
  getAllContent,
  dedupeEventsByTitleAndDay,
  getEventResourcesSummary,
  mockEvents,
};