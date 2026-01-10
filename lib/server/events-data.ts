// lib/server/events-data.ts
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
  return value.filter(item => typeof item === "string");
}

function safeNumber(value: any): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
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
    // Required
    slug,
    title: safeString(m.title) || "Untitled Event",
    
    // Content
    description: safeString(m.description) || safeString(m.excerpt),
    excerpt: safeString(m.excerpt) || safeString(m.description),
    
    // Metadata
    date: safeString(m.date),
    author: safeString(m.author),
    category: safeString(m.category),
    tags: safeArray(m.tags),
    featured: safeBoolean(m.featured),
    
    // Visual
    coverImage: safeString(m.coverImage) || safeString(m.image),
    
    // State
    draft: safeBoolean(m.draft),
    published: safeBoolean(m.published),
    
    // Event-specific
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
    
    // System
    _raw: m._raw,
    url: safeString(m.url),
    type: "event",
  };
}

function fromMdxDocument(doc: MdxDocument): EventWithContent {
  const { content, ...rest } = doc as any;
  const meta = fromMdxMeta(rest);
  
  return {
    ...meta,
    content: typeof content === "string" ? content : "",
  };
}

export function getAllEventsMeta(): Event[] {
  try {
    const metas = getMdxCollectionMeta("events");
    return metas.map(m => fromMdxMeta(m));
  } catch (error) {
    console.error("[events-data] Error getting all events meta:", error);
    return [];
  }
}

export function getEventBySlug(slug: string): EventWithContent | null {
  try {
    const doc = getMdxDocumentBySlug("events", slug);
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

export function getUpcomingEvents(): Event[] {
  try {
    const now = new Date();
    return getAllEventsMeta()
      .filter(e => {
        if (e.draft) return false;
        if (!e.eventDate) return false;
        
        const eventDate = new Date(e.eventDate);
        return eventDate >= now && !e.isCancelled;
      })
      .sort((a, b) => {
        const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
        const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
        return dateA - dateB;
      });
  } catch (error) {
    console.error("[events-data] Error getting upcoming events:", error);
    return [];
  }
}

export function getPastEvents(): Event[] {
  try {
    const now = new Date();
    return getAllEventsMeta()
      .filter(e => {
        if (e.draft) return false;
        if (!e.eventDate) return false;
        
        const eventDate = new Date(e.eventDate);
        return eventDate < now;
      })
      .sort((a, b) => {
        const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
        const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
        return dateB - dateA;
      });
  } catch (error) {
    console.error("[events-data] Error getting past events:", error);
    return [];
  }
}

export default {
  getAllEventsMeta,
  getEventBySlug,
  getUpcomingEvents,
  getPastEvents,
};


