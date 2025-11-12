// lib/server/events-data.ts
// Server-only utilities to load Event MD/MDX files without Contentlayer.

import fs from "fs";
import path from "path";
import matter from "gray-matter";

if (typeof window !== "undefined") {
  throw new Error("This module is server-only");
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type EventResourceLink = {
  href: string;
  label?: string | null;
};

export type EventResources = {
  downloads?: EventResourceLink[];
  reads?: EventResourceLink[];
};

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
  // Compatibility fields
  author?: string | null;
  readTime?: string | null;
  category?: string | null;
};

type FieldKey = keyof EventMeta;

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

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
  "coverImage"
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

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
  if (/^https?:\/\//i.test(s)) return s; // absolute url
  return s.startsWith("/") ? s : `/${s.replace(/^\/+/, "")}`;
}

function normalizeImageForEvents(v: unknown): string | null {
  const raw = ensureLocal(typeof v === "string" ? v : null);
  if (!raw) return null;
  if (!raw.startsWith("/assets/") && !raw.startsWith("/_next/") && !/^https?:\/\//i.test(raw)) {
    return `/assets/images/events/${raw.replace(/^\/+/, "")}`;
  }
  return raw;
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

export function getEventSlugs(): string[] {
  if (!fs.existsSync(eventsDir)) return [];
  try {
    return fs
      .readdirSync(eventsDir)
      .filter((f) => exts.some((e) => f.toLowerCase().endsWith(e)))
      .map((f) => f.replace(/\.mdx?$/i, ""));
  } catch (error) {
    console.error("Error reading events directory:", error);
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
      content: includeContent ? "" : undefined
    };
    const out: any = { slug: base.slug };
    for (const f of fields) out[f] = (base as any)[f] ?? null;
    if (includeContent) out.content = base.content ?? "";
    return out as EventMeta & { content?: string };
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
          out[f] = typeof fm[f] === "string" ? String(fm[f]).trim() : null;
          break;
        }
        case "chatham": {
          const v =
            typeof fm.chatham === "boolean"
              ? fm.chatham
              : typeof fm.chatham === "string"
              ? fm.chatham.toLowerCase() === "true"
              : false;
          out.chatham = v;
          break;
        }
        case "tags": {
          out.tags = Array.isArray(fm.tags) ? (fm.tags as any[]).map(String) : null;
          break;
        }
        case "resources": {
          const r = fm.resources && typeof fm.resources === "object" ? (fm.resources as EventResources) : null;
          out.resources = r ?? null;
          break;
        }
        case "heroImage":
        case "coverImage": {
          const key = f as "heroImage" | "coverImage";
          out[key] = normalizeImageForEvents(fm[key]);
          break;
        }
        case "content": {
          if (includeContent) out.content = content || "";
          break;
        }
        default:
          break;
      }
    }

    return out as EventMeta & { content?: string };
  } catch (error) {
    console.error(`Error processing event ${slug}:`, error);
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
      content: includeContent ? "" : undefined
    };
    const out: any = { slug: base.slug };
    for (const f of fields) out[f] = (base as any)[f] ?? null;
    if (includeContent) out.content = base.content ?? "";
    return out as EventMeta & { content?: string };
  }
}

export function getAllEvents(fields: FieldKey[] = DEFAULT_FIELDS): EventMeta[] {
  const slugs = getEventSlugs();
  const items = slugs.map((s) => getEventBySlug(s, fields));
  // Newest first
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
  if (!Array.isArray(slugs)) return [];
  return slugs.map((s) => getEventBySlug(s, fields)).filter(Boolean) as EventMeta[];
}

/* -------------------------------------------------------------------------- */
/*  Utilities                                                                 */
/* -------------------------------------------------------------------------- */

/** Convert a date string to YYYY-MM-DD in Europe/London. */
function dateKey(d: string): string {
  if (!d || typeof d !== "string") return "";
  const only = /^\d{4}-\d{2}-\d{2}$/.test(d);
  if (only) return d;
  const dt = new Date(d);
  if (Number.isNaN(dt.valueOf())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(dt);
}

/** Dedupe by normalised title + calendar day. */
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

/** Count resources for reporting/teasers. */
export function getEventResourcesSummary(events: EventMeta[]): { downloads: number; reads: number } {
  if (!Array.isArray(events)) return { downloads: 0, reads: 0 };
  return events.reduce(
    (acc, e) => ({
      downloads: acc.downloads + (e.resources?.downloads?.length || 0),
      reads: acc.reads + (e.resources?.reads?.length || 0)
    }),
    { downloads: 0, reads: 0 }
  );
}

/* -------------------------------------------------------------------------- */
/*  Compatibility wrapper                                                     */
/* -------------------------------------------------------------------------- */

export function getAllContent(type: "events"): EventMeta[] {
  if (type !== "events") {
    throw new Error(`Unsupported content type: ${type}`);
  }
  return getAllEvents();
}

export default {
  getEventSlugs,
  getEventBySlug,
  getAllEvents,
  getEventsBySlugs,
  getAllContent,
  dedupeEventsByTitleAndDay,
  getEventResourcesSummary
};