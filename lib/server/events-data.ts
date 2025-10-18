// lib/server/events-data.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type EventMeta = {
  slug: string;
  title?: string;
  date?: string;
  endDate?: string;
  location?: string;
  summary?: string;
  heroImage?: string;
  tags?: string[];
  content?: string;
};

// ── helpers ────────────────────────────────────────────────────────────────
const EVENTS_DIR = path.join(process.cwd(), "content", "events");
const isFile = (f: string) => {
  try {
    return fs.statSync(f).isFile();
  } catch {
    return false;
  }
};
const toArray = <T = string>(v: unknown): T[] =>
  Array.isArray(v) ? (v as T[]) : typeof v === "undefined" || v === null ? [] : [v as T];
const lower = (v: unknown) => (typeof v === "string" ? v.toLowerCase() : "");
const safeStr = (v: unknown) => (typeof v === "string" ? v : undefined);

function readEvent(slugOrFile: string) {
  // allow "foo" or "foo.mdx"
  const base = slugOrFile.replace(/\.mdx?$/i, "");
  const full = path.join(EVENTS_DIR, `${base}.mdx`);
  const raw = fs.readFileSync(full, "utf8");
  const { data, content } = matter(raw);
  return { slug: base, data, content };
}

export function getEventSlugs(): string[] {
  if (!fs.existsSync(EVENTS_DIR)) return [];
  return fs
    .readdirSync(EVENTS_DIR)
    .filter((f) => f.endsWith(".mdx") && isFile(path.join(EVENTS_DIR, f)))
    .map((f) => f.replace(/\.mdx$/i, ""));
}

export function getEventBySlug(slug: string, fields: (keyof EventMeta | "content")[] = []): EventMeta {
  const { slug: real, data, content } = readEvent(String(slug));
  const out: Partial<EventMeta> = { slug: real };

  fields.forEach((f) => {
    if (f === "slug") out.slug = real;
    else if (f === "content") (out as any).content = content;
    else if (typeof (data as any)[f] !== "undefined") (out as any)[f] = (data as any)[f];
  });

  return out as EventMeta;
}

export function getAllEvents(
  fields: (keyof EventMeta | "content")[] = ["slug", "title", "date", "endDate", "location", "summary", "heroImage", "tags"]
): EventMeta[] {
  return getEventSlugs()
    .map((s) => getEventBySlug(s, fields))
    .sort((a, b) => {
      const ad = new Date(a.date || 0).valueOf();
      const bd = new Date(b.date || 0).valueOf();
      return ad - bd;
    });
}

/**
 * Deduplicate events that share the same title + calendar day.
 * Useful for teaser lists.
 */
export function dedupeEventsByTitleAndDay<T extends { title: string; date: string }>(list: T[]): T[] {
  const keyOf = (x: T) => {
    const t = lower(x.title || "");
    const d = x.date
      ? new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(
          new Date(x.date)
        )
      : "";
    return `${t}__${d}`;
  };
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of list) {
    const k = keyOf(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

/**
 * Lightweight “resource pills” summary for cards.
 * Returns short lists of downloads / reads if the slug suggests a preset.
 * (You can expand this to load per-event front-matter if you want.)
 */
export function getEventResourcesSummary(rawSlug: unknown): {
  downloads?: { href: string; label: string }[];
  reads?: { href: string; label: string }[];
} | null {
  const slug = lower(rawSlug);
  if (!slug) return null;

  const isFounders = /founder|venture|capital|salon/.test(slug);
  const isLeadership = /leader|leadership|workshop|retreat/.test(slug);

  if (isFounders) {
    return {
      reads: [
        { href: "/blog/founders-salon-charter", label: "Salon Charter" },
        { href: "/blog/capital-with-standards", label: "Capital with Standards" },
      ],
      downloads: [{ href: "/downloads/standards-brief", label: "Standards Brief (PDF)" }],
    };
  }

  if (isLeadership) {
    return {
      reads: [{ href: "/blog/leadership-without-theater", label: "Leadership without Theater" }],
      downloads: [
        { href: "/downloads/leaders-cue-card", label: "Leader’s Cue Card (PDF)" },
        { href: "/downloads/brotherhood-covenant", label: "Brotherhood Covenant (PDF)" },
      ],
    };
  }

  return null;
}
