// lib/server/events-data.ts
import {
  ensureDir,
  listMdFiles,
  fileToSlug,
  readFrontmatter,
  sortByDateDesc,
} from "@/lib/server/md-utils";

export type EventResourceLink = {
  label: string;
  href: string;
  kind?: string;
};

export type EventResources = {
  links?: EventResourceLink[];
};

export type EventMeta = {
  slug: string;
  title: string;
  date?: string;
  location?: string;
  excerpt?: string;
  description?: string;
  category?: string;
  tags?: string[];
  href?: string;        // /events/[slug]
  resources?: EventResources;
  [key: string]: unknown;
};

// ------------------------------
// Internal FS loader
// ------------------------------

function normaliseSlug(raw: unknown): string {
  const s = String(raw ?? "").trim().toLowerCase();

  if (!s) return "";

  // strip leading/trailing slashes
  let cleaned = s.replace(/^\/+|\/+$/g, "");

  // strip leading "events/" if someone writes "events/founders-salon"
  if (cleaned.startsWith("events/")) {
    cleaned = cleaned.slice("events/".length);
  }

  return cleaned;
}

function loadAllEventsFromFs(): EventMeta[] {
  // We assume /content/events holds event MD/MDX
  const abs = ensureDir("events");
  if (!abs) return [];

  const files = listMdFiles(abs);
  if (!files.length) return [];

  const events: EventMeta[] = files.map((absFile) => {
    const { data, content } = readFrontmatter(absFile);

    // Prefer frontmatter slug; fall back to filename-based slug
    const rawSlug = (data.slug as string | undefined) || fileToSlug(absFile);
    const slug = normaliseSlug(rawSlug);

    const title =
      (data.title as string | undefined && String(data.title).trim()) ||
      slug ||
      "Untitled event";

    const date =
      (typeof data.date === "string" && data.date.trim().length > 0
        ? data.date
        : undefined) ?? undefined;

    const location =
      (typeof data.location === "string" && data.location.trim().length > 0
        ? data.location
        : undefined) ?? undefined;

    const excerpt =
      (typeof data.excerpt === "string" && data.excerpt.trim().length > 0
        ? data.excerpt
        : undefined) ??
      (typeof data.summary === "string" && data.summary.trim().length > 0
        ? data.summary
        : undefined) ??
      (typeof data.description === "string" &&
      data.description.trim().length > 0
        ? data.description
        : undefined) ??
      undefined;

    const description =
      (typeof data.description === "string" &&
        data.description.trim().length > 0 &&
        data.description) ||
      undefined;

    const category =
      (typeof data.category === "string" && data.category.trim().length > 0
        ? data.category
        : undefined) ??
      (typeof data.type === "string" && data.type.trim().length > 0
        ? data.type
        : undefined) ??
      undefined;

    const tags = Array.isArray(data.tags)
      ? (data.tags as unknown[]).map((t) => String(t))
      : undefined;

    const resources: EventResources | undefined =
      data.resources && typeof data.resources === "object"
        ? (data.resources as EventResources)
        : undefined;

    const base: EventMeta = {
      slug,
      title,
      date,
      location,
      excerpt,
      description,
      category,
      tags,
      href: slug ? `/events/${slug}` : undefined,
      resources,
      content, // keep raw body available for future use
    };

    // Spread data LAST so we don't accidentally strip fields we haven't modelled,
    // but we avoid clobbering slug/title/date etc by re-applying them.
    return {
      ...data,
      ...base,
      slug,
      title,
      date,
      location,
      excerpt,
      description,
      category,
      tags,
      href: base.href,
      resources,
    };
  });

  // Sort latest first by date
  return sortByDateDesc(events);
}

// Cache
let EVENTS_CACHE: EventMeta[] | null = null;

function allEvents(): EventMeta[] {
  if (!EVENTS_CACHE) {
    EVENTS_CACHE = loadAllEventsFromFs();
  }
  return EVENTS_CACHE;
}

// ------------------------------
// Public API
// ------------------------------

export function getAllEvents(): EventMeta[] {
  return allEvents();
}

export function getEventSlugs(): string[] {
  return allEvents().map((e) => e.slug);
}

export function getEventBySlug(slug: string): EventMeta | undefined {
  const key = normaliseSlug(slug);
  if (!key) return undefined;

  return allEvents().find(
    (e) => normaliseSlug(e.slug) === key,
  );
}

export function getEventsBySlugs(slugs: string[]): EventMeta[] {
  const keys = new Set(slugs.map((s) => normaliseSlug(s)));
  return allEvents().filter((e) => keys.has(normaliseSlug(e.slug)));
}

export function dedupeEventsByTitleAndDay(events: EventMeta[]): EventMeta[] {
  const seen = new Set<string>();
  const out: EventMeta[] = [];

  for (const ev of events) {
    const key = `${(ev.title || "").toLowerCase()}::${ev.date || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ev);
  }

  return out;
}

export function getEventResourcesSummary() {
  const events = allEvents();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const parse = (d?: string) => (d ? new Date(d) : null);

  let upcoming = 0;
  let past = 0;

  for (const ev of events) {
    const dt = parse(ev.date);
    if (!dt || Number.isNaN(dt.valueOf())) continue;
    if (dt >= now) upcoming++;
    else past++;
  }

  return {
    total: events.length,
    upcoming,
    past,
  };
}

// For symmetry with downloads-data
export function getAllContent(): EventMeta[] {
  return getAllEvents();
}