// ./lib/server/events-data.ts
// Server-only module: Reads and processes event data from MD/MDX files.

import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Enforce server-side usage for file system operations
if (typeof window !== "undefined") {
  throw new Error("This module is server-only and cannot be imported by client components.");
}

// --- Type Definitions (Usually imported from /lib/events.ts, defined here for completeness) ---

type ResourceLink = {
  href: string; // URL or local path
  label: string;
};

export type EventMeta = {
  slug: string;
  title: string;
  date: string; // ISO date string (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)
  summary?: string;
  location: string;
  heroImage?: string; // Path under /public
  tags?: string[];
  chatham?: boolean; // True if the event is conducted under Chatham House Rule
  related?: string[]; // Array of related blog post slugs/paths
  resources?: {
    downloads?: ResourceLink[];
    reads?: ResourceLink[];
  };
  content?: string; // Full MD/MDX content (if requested)
};

type EventFrontmatter = { [K in keyof Omit<EventMeta, "slug" | "content">]: unknown };
type EventField = keyof EventMeta;

const EVENTS_CONTENT_DIR = path.join(process.cwd(), "content", "events");
const DEFAULT_FIELDS: EventField[] = [
    "slug", "title", "date", "location", "summary", "heroImage", "tags", "chatham", "related", "resources"
];

// --- Private Helpers (reusing logic from safe-coercion/stringUtils) ---

/** Converts a value to an ISO date string, or undefined. */
function toDateString(v: unknown): string | undefined {
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "number") return new Date(v).toISOString();
    if (typeof v === "string") {
      const t = Date.parse(v);
      return Number.isNaN(t) ? undefined : new Date(t).toISOString();
    }
    return undefined;
}

/** Coerces a value into a boolean. */
function toBoolean(v: unknown): boolean {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v.toLowerCase() === 'true' || v.toLowerCase() === '1';
    if (typeof v === 'number') return v === 1;
    return false;
}

/** Coerces a value into an array of trimmed, non-empty strings. */
function toStringArray(v: unknown): string[] {
    let values: unknown[] = [];
    if (Array.isArray(v)) values = v;
    else if (typeof v === "string") values = v.split(',');
    
    return values.map(String).map((s) => s.trim()).filter(Boolean);
}

/** Coerces a value into an array of ResourceLink objects. */
function toResourceLinks(v: unknown): ResourceLink[] | undefined {
    if (!Array.isArray(v)) return undefined;

    const links: ResourceLink[] = [];
    for (const item of v) {
        if (typeof item === 'object' && item !== null && 'href' in item && 'label' in item) {
            const href = String(item.href).trim();
            const label = String(item.label).trim();
            if (href && label) {
                links.push({ href, label });
            }
        }
    }
    return links.length > 0 ? links : undefined;
}

/** Finds the full path to an event file, supporting .mdx and .md. */
function resolveEventPath(slug: string): string | null {
  const real = slug.replace(/\.mdx?$/i, "");
  const mdx = path.join(EVENTS_CONTENT_DIR, `${real}.mdx`);
  const md = path.join(EVENTS_CONTENT_DIR, `${real}.md`);
  if (fs.existsSync(mdx)) return mdx;
  if (fs.existsSync(md)) return md;
  return null;
}

// --- Public API ---

/** Retrieves all valid event content slugs. */
export function getEventSlugs(): string[] {
  if (!fs.existsSync(EVENTS_CONTENT_DIR)) return [];
  return fs
    .readdirSync(EVENTS_CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((f) => f.replace(/\.(mdx|md)$/, ""));
}


/**
 * Retrieves a single event entry's metadata and optional content by slug.
 * @param slug The filename slug (e.g., 'founders-salon').
 * @param fields The subset of fields to retrieve.
 */
export function getEventBySlug<T extends EventField | "content">(
  slug: string,
  fields: T[] = DEFAULT_FIELDS as T[],
): Partial<Pick<EventMeta, Exclude<T, "content">>> & { content?: string } & Pick<EventMeta, "slug" | "title"> {
  
  const realSlug = slug.replace(/\.(mdx|md)$/, "");
  const fullPath = resolveEventPath(realSlug);
  const out: Partial<EventMeta> = { slug: realSlug };

  if (!fullPath) {
    return { slug: realSlug, title: "Event Not Found" } as any;
  }

  const file = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(file);
  const fm = data as EventFrontmatter;

  for (const field of fields) {
    if (field === "content") {
      out.content = content;
      continue;
    }

    const raw = fm[field as keyof EventFrontmatter];
    if (typeof raw === "undefined") continue; 

    // Explicitly coerce types
    switch (field as EventField) {
      case "date": {
        const dateString = toDateString(raw);
        if (dateString) out.date = dateString;
        break;
      }
      case "tags": {
        out.tags = toStringArray(raw);
        break;
      }
      case "related": {
        out.related = toStringArray(raw);
        break;
      }
      case "chatham": {
        out.chatham = toBoolean(raw);
        break;
      }
      case "resources": {
        if (typeof raw === 'object' && raw !== null) {
            out.resources = {
                downloads: toResourceLinks((raw as any).downloads),
                reads: toResourceLinks((raw as any).reads),
            };
        }
        break;
      }
      // Simple string fields
      case "title":
      case "summary":
      case "location":
      case "heroImage": {
        if (typeof raw === "string") {
          (out as any)[field] = raw.trim();
        }
        break;
      }
      default:
        // Ignore unexpected fields
        break;
    }
  }

  // Ensure mandatory fields have safe fallbacks
  if (!out.title) out.title = realSlug.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  if (!out.date) out.date = new Date().toISOString().split('T')[0]; // Safe fallback to today

  return out as any;
}


/**
 * Retrieves all events with the specified fields, sorted by date (newest first).
 * @param fields The subset of fields to retrieve.
 */
export function getAllEvents<T extends EventField>(
  fields: T[] = DEFAULT_FIELDS as T[],
): Partial<Pick<EventMeta, T>>[] {
  
  // Ensure we include date for sorting
  const requiredFields = Array.from(new Set<EventField>([...fields, "date", "title", "slug"])) as EventField[];

  const events = getEventSlugs()
    .map((slug) => getEventBySlug(slug, requiredFields))
    .filter(e => e.title !== "Event Not Found");

  // Sort by date descending (newest first)
  events.sort((a, b) => {
    // Note: getEventBySlug ensures 'date' is present
    const dateA = Date.parse(a.date!); 
    const dateB = Date.parse(b.date!);
    return dateB - dateA;
  });

  return events as any;
}

// --- Utility Functions (Adapted from the original mock) ---

/**
 * Ensures that if multiple events share the same title and occur on the same day, only one is kept.
 */
export function dedupeEventsByTitleAndDay(events: EventMeta[]): EventMeta[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    // Use the title and the date part (before 'T') as the key
    const key = `${event.title}-${event.date.split("T")[0]}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Calculates the total number of downloads and reads associated with a list of events.
 */
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