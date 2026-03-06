// lib/server/events-data.ts
import "server-only";

import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";
import type { Event } from "@/types/index";

export type EventWithContent = Event & {
  content: string;
};

// Safe converters
function safeString(value: any): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function safeArray(value: any): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item) => typeof item === "string");
}

function safeNumber(value: any): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function safeBoolean(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    return lower === "true" || lower === "yes" || lower === "1";
  }
  return false;
}

function fromMdxMeta(meta: MdxMeta): Event {
  const m = meta as any;

  const slug = safeString(m.slug) || safeString(m._raw?.flattenedPath) || "";

  return {
    slug,
    title: safeString(m.title) || "Untitled Event",

    description: safeString(m.description) || safeString(m.excerpt),
    excerpt: safeString(m.excerpt) || safeString(m.description),

    date: safeString(m.date),
    author: safeString(m.author),
    category: safeString(m.category),
    tags: safeArray(m.tags),
    featured: safeBoolean(m.featured),

    coverImage: safeString(m.coverImage) || safeString(m.image),

    draft: safeBoolean(m.draft),
    // Treat as published unless explicitly false (tolerant)
    published: m.published === undefined ? true : safeBoolean(m.published),

    eventDate: safeString(m.eventDate),
    startTime: safeString(m.startTime),
    endTime: safeString(m.endTime),
    timezone: safeString(m.timezone),
    duration: safeString(m.duration),
    location: safeString(m.location),
    venue: safeString(m.venue),
    address: safeString(m.address),
    city: safeString(m.city),
    country: safeString(m.country),
    isOnline: safeBoolean(m.isOnline),
    onlineUrl: safeString(m.onlineUrl),
    registrationUrl: safeString(m.registrationUrl),
    registrationDeadline: safeString(m.registrationDeadline),
    price: safeString(m.price) || safeNumber(m.price)?.toString(),
    currency: safeString(m.currency),
    capacity: safeNumber(m.capacity),
    seatsAvailable: safeNumber(m.seatsAvailable),
    speakers: safeArray(m.speakers),
    host: safeString(m.host),
    organizer: safeString(m.organizer),
    eventType: safeString(m.eventType) as any,
    level: safeString(m.level) as any,
    requirements: safeArray(m.requirements),
    materials: safeArray(m.materials),
    takeaways: safeArray(m.takeaways),
    isUpcoming: safeBoolean(m.isUpcoming),
    isPast: safeBoolean(m.isPast),
    isCancelled: safeBoolean(m.isCancelled),

    _raw: m._raw,
    url: safeString(m.url),
    type: "event",
  } as any;
}

function fromMdxDocument(doc: MdxDocument): EventWithContent {
  const { content, ...rest } = doc as any;
  const meta = fromMdxMeta(rest);

  return {
    ...(meta as any),
    content: typeof content === "string" ? content : "",
  };
}

function safeTime(value?: string | null): number {
  if (!value) return 0;
  const t = Date.parse(String(value));
  return Number.isFinite(t) ? t : 0;
}

// ✅ Async (because getMdxCollectionMeta is async)
export async function getAllEventsMeta(): Promise<Event[]> {
  try {
    const metas = await getMdxCollectionMeta("events");
    return metas.map((m) => fromMdxMeta(m));
  } catch (error) {
    console.error("[events-data] Error getting all events meta:", error);
    return [];
  }
}

export async function getEventBySlug(slug: string): Promise<EventWithContent | null> {
  try {
    const doc = await getMdxDocumentBySlug("events", slug);
    if (!doc) {
      console.warn(`[events-data] Event not found: ${slug}`);
      return null;
    }
    return fromMdxDocument(doc);
  } catch (error) {
    console.error(`[events-data] Error getting event ${slug}:`, error);
    return null;
  }
}

export async function getUpcomingEvents(): Promise<Event[]> {
  try {
    const now = Date.now();
    const all = await getAllEventsMeta();

    return all
      .filter((e: any) => {
        if (e?.draft) return false;
        if (!e?.eventDate) return false;
        if (e?.isCancelled) return false;

        return safeTime(e.eventDate) >= now;
      })
      .sort((a: any, b: any) => safeTime(a?.eventDate) - safeTime(b?.eventDate));
  } catch (error) {
    console.error("[events-data] Error getting upcoming events:", error);
    return [];
  }
}

export async function getPastEvents(): Promise<Event[]> {
  try {
    const now = Date.now();
    const all = await getAllEventsMeta();

    return all
      .filter((e: any) => {
        if (e?.draft) return false;
        if (!e?.eventDate) return false;
        return safeTime(e.eventDate) < now;
      })
      .sort((a: any, b: any) => safeTime(b?.eventDate) - safeTime(a?.eventDate));
  } catch (error) {
    console.error("[events-data] Error getting past events:", error);
    return [];
  }
}

// ✅ Single default export (no duplicates)
const eventsDataApi = {
  getAllEventsMeta,
  getEventBySlug,
  getUpcomingEvents,
  getPastEvents,
};

export default eventsDataApi;