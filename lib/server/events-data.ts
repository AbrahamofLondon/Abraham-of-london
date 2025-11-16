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

function loadAllEventsFromFs(): EventMeta[] {
  // We assume /content/events holds event MD/MDX
  const abs = ensureDir("events");
  if (!abs) return [];

  const files = listMdFiles(abs);
  if (!files.length) return [];

  const events: EventMeta[] = files.map((absFile) => {
    const { data, content } = readFrontmatter(absFile);
    const rawSlug = (data.slug as string) || fileToSlug(absFile);

    const slug = String(rawSlug || "")
      .trim()
      .replace(/^\/+|\/+$/g, "");

    const title =
      (data.title as string | undefined) ||
      slug ||
      "Untitled event";

    const date = (data.date as string | undefined) || undefined;

    const location = (data.location as string | undefined) || undefined;

    const excerpt =
      (data.excerpt as string | undefined) ||
      (data.summary as string | undefined) ||
      (data.description as string | undefined) ||
      undefined;

    const description =
      (data.description as string | undefined) ||
      undefined;

    const category =
      (data.category as string | undefined) ||
      (data.type as string | undefined) ||
      undefined;

    const tags = Array.isArray(data.tags)
      ? data.tags.map((t: unknown) => String(t))
      : undefined;

    const resources: EventResources | undefined =
      data.resources && typeof data.resources === "object"
        ? (data.resources as EventResources)
        : undefined;

    return {
      slug,
      title,
      date,
      location,
      excerpt,
      description,
      category,
      tags,
      href: `/events/${slug}`,
      resources,
      content, // if you ever need raw body later
      ...data,
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
  const key = String(slug || "").toLowerCase();
  return allEvents().find(
    (e) => String(e.slug || "").toLowerCase() === key,
  );
}

export function getEventsBySlugs(slugs: string[]): EventMeta[] {
  const keys = new Set(slugs.map((s) => String(s || "").toLowerCase()));
  return allEvents().filter((e) =>
    keys.has(String(e.slug || "").toLowerCase()),
  );
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
    if (!dt) continue;
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