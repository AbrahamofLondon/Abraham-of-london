// lib/events.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface EventMeta {
  slug: string;
  title: string;
  date: string;          // ISO preferred
  location?: string;
  excerpt?: string;
  summary?: string;
  heroImage?: string;    // preferred image key
  ctaHref?: string;
  ctaLabel?: string;
  tags?: string[];
  content?: string;
}

const eventsDir = path.join(process.cwd(), "content", "events");
const exts = [".mdx", ".md"] as const;

function normalizeDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  // allow "YYYY-MM-DD" or full ISO
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? undefined : new Date(ts).toISOString();
}

function normalizeTags(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((s) => s.trim()).filter(Boolean);
  return undefined;
}

export function getEventSlugs(): string[] {
  if (!fs.existsSync(eventsDir)) return [];
  return fs
    .readdirSync(eventsDir)
    .filter((f) => exts.some((e) => f.endsWith(e)))
    .map((f) => f.replace(/\.mdx?$/i, ""));
}

function resolveEventPath(slug: string): string | null {
  for (const ext of exts) {
    const p = path.join(eventsDir, `${slug}${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

type FieldKey = keyof EventMeta | "content";

// default fields you usually want
const DEFAULT_FIELDS: FieldKey[] = [
  "slug",
  "title",
  "date",
  "location",
  "summary",
  "heroImage",
  "ctaHref",
  "ctaLabel",
  "tags",
];

export function getEventBySlug(
  slug: string,
  fields: FieldKey[] = [],
): Partial<EventMeta> & { content?: string } {
  const realSlug = slug.replace(/\.mdx?$/i, "");
  const fullPath = resolveEventPath(realSlug);

  if (!fullPath) {
    const fallback: Partial<EventMeta> = {
      slug: realSlug,
      title: "Event Not Found",
      date: new Date().toISOString(),
    };
    if (fields.includes("content")) (fallback as any).content = "";
    return fallback as Partial<EventMeta> & { content?: string };
  }

  const file = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(file);
  const fm = (data || {}) as Record<string, unknown>;

  // ---- alias coverImage → heroImage (so either key works) ----
  if (typeof fm.coverImage === "string" && !fm.heroImage) {
    fm.heroImage = fm.coverImage;
  }

  const item: Partial<EventMeta> & { content?: string } = { slug: realSlug };

  const wanted = fields.length ? fields : DEFAULT_FIELDS;

  for (const field of wanted) {
    if (field === "content") {
      item.content = content;
      continue;
    }

    let raw = fm[field as string];

    if (field === "date") {
      const iso = normalizeDate(raw);
      if (iso) item.date = iso;
      continue;
    }

    if (field === "tags") {
      const tags = normalizeTags(raw);
      if (tags) item.tags = tags;
      continue;
    }

    if (typeof raw !== "undefined") {
      (item as any)[field] = raw;
    }
  }

  // Ensure minimally required fields if selected
  if (wanted.includes("title") && !item.title) item.title = realSlug;
  if (wanted.includes("date") && !item.date) item.date = new Date().toISOString();

  // light trim to avoid stray spaces
  ["title","location","summary","heroImage","ctaHref","ctaLabel"].forEach((k) => {
    const v = (item as any)[k];
    if (typeof v === "string") (item as any)[k] = v.trim();
  });

  return item;
}

export function getAllEvents(fields: FieldKey[] = DEFAULT_FIELDS): Partial<EventMeta>[] {
  const slugs = getEventSlugs();
  const events = slugs.map((slug) => getEventBySlug(slug, fields));

  // sort by date DESC (newest first)
  events.sort((a, b) => {
    const da = a.date ? Date.parse(String(a.date)) : 0;
    const db = b.date ? Date.parse(String(b.date)) : 0;
    return db - da;
  });

  return events;
}

// Helpers
export function isUpcoming(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return d >= start;
}

export function prettyDate(dateStr?: string, locale = "en-GB"): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

export function getUpcomingEvents(limit = 3, fields: FieldKey[] = DEFAULT_FIELDS): Partial<EventMeta>[] {
  return getAllEvents(fields).filter((e) => isUpcoming(String(e.date))).slice(0, limit);
}

export function getEventsTeaser(limit = 3) {
  return getUpcomingEvents(limit, ["slug", "title", "date", "location", "summary"]).map((e) => ({
    slug: String(e.slug),
    title: String(e.title),
    date: String(e.date),
    location: String(e.location || ""),
    description: (e as any).summary ?? null,
  }));
}
