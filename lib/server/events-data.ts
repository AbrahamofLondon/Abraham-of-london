<<<<<<< HEAD
import { getAllEvents } from "@/lib/events";
import type { EventMeta } from "@/lib/events";

export async function getEventSlugs(): Promise<string[]> {
  return getAllEvents().map(e => e.slug);
}
export async function getAllEventsAsync(): Promise<EventMeta[]> {
  return getAllEvents();
}
export async function getEventBySlug(slug: string): Promise<EventMeta | null> {
  const all = getAllEvents();
  return all.find(e => e.slug === slug) ?? null;
=======
// lib/server/events-data.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

if (typeof window !== "undefined") {
  throw new Error("This module is server-only");
}

// Ensure this path is correct. If your file is at 'types/event.ts', this is correct.
import type { EventMeta, EventResources } from "@/types/event"; 

export type EventMeta = {
  slug: string;
  title?: string | null;
  date?: string | null;
  location?: string | null;
  summary?: string | null;
  excerpt?: string | null;
  chatham?: boolean | null;
  tags?: string[] | null;
  resources?: EventResources | null;
  heroImage?: string | null;
  coverImage?: string | null;
  content?: string;
  // Additional fields for compatibility
  author?: string | null;
  readTime?: string | null;
  category?: string | null;
};

type FieldKey = keyof EventMeta;

const eventsDir = path.join(process.cwd(), "content", "events");
const exts = [".mdx", ".md"] as const;

const DEFAULT_FIELDS: FieldKey[] = [
  "slug",
  "title",
  "date",
  "location",
  "summary",
  "excerpt",
  "chatham",
  "tags",
  "resources",
  "heroImage",
  "coverImage",
];

function resolveEventPath(slug: string): string | null {
  const real = slug.replace(/\.mdx?$/i, "");
  for (const ext of exts) {
    const full = path.join(eventsDir, `${real}${ext}`);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function ensureLocal(p?: string | null): string | null {
  if (!p) return null;
  const s = String(p).trim();
  if (!s) return null;
  // Leave absolute URLs alone
  if (/^https?:\/\//i.test(s)) return s;
  // Make sure we always return a root-based path
  return s.startsWith("/") ? s : `/${s.replace(/^\/+/, "")}`;
}

function normalizeCoverImage(v: unknown): string | null {
  const raw = ensureLocal(typeof v === "string" ? v : null);
  if (!raw) return null;
  // If user just wrote a filename, assume events images folder
  if (!raw.startsWith("/assets/") && !raw.startsWith("/_next/") && !/^https?:\/\//i.test(raw)) {
    return `/assets/images/events/${raw.replace(/^\/+/, "")}`;
  }
  return raw;
}

function normalizeHeroImage(v: unknown): string | null {
  const raw = ensureLocal(typeof v === "string" ? v : null);
  if (!raw) return null;
  // If user just wrote a filename, assume events images folder
  if (!raw.startsWith("/assets/") && !raw.startsWith("/_next/") && !/^https?:\/\//i.test(raw)) {
    return `/assets/images/events/${raw.replace(/^\/+/, "")}`;
  }
  return raw;
}

// ----------------------------------------------------
// Data Fetching Functions
// ----------------------------------------------------

export function getEventSlugs(): string[] {
  if (!fs.existsSync(eventsDir)) return [];
  try {
    return fs
      .readdirSync(eventsDir)
      .filter((f) => exts.some((e) => f.toLowerCase().endsWith(e)))
      .map((f) => f.replace(/\.mdx?$/i, ""));
  } catch (error) {
    console.error('Error reading events directory:', error);
    return [];
  }
}

export function getEventBySlug(
  slug: string,
  fields: FieldKey[] = DEFAULT_FIELDS,
  includeContent = false
): EventMeta & { content?: string } {
  const real = slug.replace(/\.mdx?$/i, "");
  const fullPath = resolveEventPath(real);

  if (!fullPath) {
    // Guaranteed safe fallback
    const base: EventMeta & { content?: string } = {
      slug: real,
      title: "Event Not Found",
      date: null,
      location: null,
      summary: null,
      excerpt: null,
      chatham: false,
      tags: null,
      resources: null,
      heroImage: null,
      coverImage: null,
      author: "Abraham of London",
      readTime: null,
      category: null,
      content: includeContent ? "" : undefined,
    };
    const out: any = { slug: base.slug };
    for (const f of fields) out[f] = base[f] ?? null;
    if (includeContent) out.content = base.content ?? "";
    return out;
  }

  try {
    const raw = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(raw);
    const fm = (data || {}) as Record<string, unknown>;

    const out: any = { slug: real };

    for (const f of fields) {
      switch (f) {
        case "slug":
          out.slug = real;
          break;
        case "title":
        case "date":
        case "location":
        case "summary":
        case "excerpt":
        case "readTime":
        case "category":
        case "author": {
          const v = typeof fm[f] === "string" ? fm[f].trim() : null;
          out[f] = v;
          break;
        }
        case "chatham": {
          const v = typeof fm.chatham === "boolean" ? fm.chatham : 
                    typeof fm.chatham === "string" ? fm.chatham.toLowerCase() === "true" : false;
          out.chatham = v;
          break;
        }
        case "tags": {
          const v = Array.isArray(fm.tags) ? fm.tags.map(String) : null;
          out.tags = v;
          break;
        }
        case "resources": {
          const v = fm.resources && typeof fm.resources === "object" ? fm.resources : null;
          out.resources = v;
          break;
        }
        case "heroImage": {
          const v = normalizeHeroImage(fm.heroImage);
          out.heroImage = v;
          break;
        }
        case "coverImage": {
          const v = normalizeCoverImage(fm.coverImage);
          out.coverImage = v;
          break;
        }
        case "content": {
          if (includeContent) {
            out.content = content || "";
          }
          break;
        }
        default:
          // Ignore unknown/unrequested fields
          break;
      }
    }

    return out as EventMeta & { content?: string };
  } catch (error) {
    console.error(`Error processing event ${slug}:`, error);
    // Return safe fallback on error
    const base: EventMeta & { content?: string } = {
      slug: real,
      title: "Error Loading Event",
      date: null,
      location: null,
      summary: null,
      excerpt: null,
      chatham: false,
      tags: null,
      resources: null,
      heroImage: null,
      coverImage: null,
      author: "Abraham of London",
      readTime: null,
      category: null,
      content: includeContent ? "" : undefined,
    };
    const out: any = { slug: base.slug };
    for (const f of fields) out[f] = base[f] ?? null;
    if (includeContent) out.content = base.content ?? "";
    return out;
  }
}

export function getAllEvents(fields: FieldKey[] = DEFAULT_FIELDS): EventMeta[] {
  const slugs = getEventSlugs();
  const items = slugs.map((s) => getEventBySlug(s, fields));

  // Sort by date descending (newest first) by default
  items.sort((a, b) => {
    const aDate = new Date(a.date || 0).getTime();
    const bDate = new Date(b.date || 0).getTime();
    return bDate - aDate;
  });
  
  return items;
}

export function getEventsBySlugs(
  slugs: string[],
  fields: FieldKey[] = DEFAULT_FIELDS
): EventMeta[] {
  // ROBUSTNESS: Ensure slugs is an array and filter out nulls
  if (!Array.isArray(slugs)) return [];
  return slugs.map((s) => getEventBySlug(s, fields)).filter(Boolean) as EventMeta[];
}

// ----------------------------------------------------
// Helper Functions (Correctly Exported)
// ----------------------------------------------------

/** Convert a date string to a YYYY-MM-DD key in Europe/London. */
function dateKey(d: string): string {
  if (!d || typeof d !== 'string') return "";
  const only = /^\d{4}-\d{2}-\d{2}$/.test(d);
  if (only) return d;
  const dt = new Date(d);
  if (Number.isNaN(dt.valueOf())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dt);
}

/**
 * Deduplicates a list of events based on matching titles and calendar day.
 */
export function dedupeEventsByTitleAndDay(events: EventMeta[]): EventMeta[] {
  const seen = new Set<string>();
  const out: EventMeta[] = [];
  if (!Array.isArray(events)) return [];

  for (const ev of events) {
    const title = String(ev.title || "").trim().toLowerCase().replace(/\s+/g, " ");
    const key = `${title}::${dateKey(String(ev.date || ""))}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(ev);
    }
  }
  return out;
}

/**
 * Calculates the total number of download and read links from a list of events.
 */
export function getEventResourcesSummary(events: EventMeta[]): { downloads: number; reads: number } {
  if (!Array.isArray(events)) return { downloads: 0, reads: 0 };
  return events.reduce(
    (acc, event) => ({
      downloads: acc.downloads + (event.resources?.downloads?.length || 0),
      reads: acc.reads + (event.resources?.reads?.length || 0),
    }),
    { downloads: 0, reads: 0 }
  );
>>>>>>> test-netlify-fix
}

// Compatibility exports for content system
export function getAllContent(type: "events"): EventMeta[] {
  if (type !== "events") {
    throw new Error(`Unsupported content type: ${type}`);
  }
  return getAllEvents();
}

// Export everything for external use
export default {
  getEventSlugs,
  getEventBySlug,
  getAllEvents,
  getEventsBySlugs,
  getAllContent,
  dedupeEventsByTitleAndDay,
  getEventResourcesSummary,
};