/* eslint-disable no-restricted-globals */
if (typeof window !== "undefined") {
  throw new Error("This module is server-only");
}

// lib/server/events-data.ts
// Loads event MD/MDX from /content/events, parses front matter, and returns
// JSON-serializable metadata + (optionally) raw MDX content.

export interface EventMeta {
  slug: string;
  title: string;
  date: string; // ISO or YYYY-MM-DD
  endDate?: string | null;

  location?: string | null;
  excerpt?: string | null;
  summary?: string | null;

  heroImage?: string | null;
  heroFit?: "cover" | "contain" | null;
  heroAspect?: "16/9" | "21/9" | "3/1" | null;
  heroPosition?: "center" | "top" | "left" | "right" | null;

  ctaHref?: string | null;
  ctaLabel?: string | null;

  tags?: string[];

  // Optional sections for the event page
  resources?: Array<{ label: string; href: string; kind?: "pdf" | "link" }> | null;
  related?: string[] | null;

  // Only when explicitly requested
  content?: string;
}

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const eventsDir = path.join(process.cwd(), "content", "events");
const exts = [".mdx", ".md"] as const;

const LONDON_TZ = "Europe/London";

/* ---------- date helpers ---------- */
function isDateOnly(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function dayKey(iso: string, tz = LONDON_TZ): string {
  if (!iso) return "";
  if (isDateOnly(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
function isMidnightLocal(iso: string, tz = LONDON_TZ): boolean {
  if (!iso) return false;
  if (isDateOnly(iso)) return true;
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return false;
  const hh = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(d)
  );
  const mm = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, minute: "2-digit" }).format(d)
  );
  return hh === 0 && mm === 0;
}
function localMinutes(iso: string, tz = LONDON_TZ): number {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return Number.POSITIVE_INFINITY;
  const hh = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(d)
  );
  const mm = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, minute: "2-digit" }).format(d)
  );
  return hh * 60 + mm;
}

/* ---------- normalization ---------- */
function normalizeDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.trim();
  if (isDateOnly(s)) return s;

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString();

  const ts = Date.parse(s);
  return Number.isNaN(ts) ? undefined : new Date(ts).toISOString();
}
function normalizeTags(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((s) => s.trim()).filter(Boolean);
  return undefined;
}
function normTitle(s: unknown): string {
  return String(s ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

/* ---------- fs helpers ---------- */
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

type FieldKey =
  | keyof EventMeta
  | "content";

const DEFAULT_FIELDS: FieldKey[] = [
  "slug",
  "title",
  "date",
  "endDate",
  "location",
  "summary",
  "excerpt",
  "heroImage",
  "heroFit",
  "heroAspect",
  "heroPosition",
  "ctaHref",
  "ctaLabel",
  "tags",
  "resources",
  "related",
];

/* ---------- loader ---------- */
export function getEventBySlug(
  slug: string,
  fields: FieldKey[] = []
): Partial<EventMeta> & { content?: string } {
  const realSlug = slug.replace(/\.mdx?$/i, "");
  const fullPath = resolveEventPath(realSlug);

  if (!fullPath) {
    const fallback: Partial<EventMeta> = {
      slug: realSlug,
      title: "Event Not Found",
      date: new Date().toISOString(),
      endDate: null,
      location: null,
      excerpt: null,
      summary: null,
      heroImage: null,
      heroFit: null,
      heroAspect: null,
      heroPosition: null,
      ctaHref: null,
      ctaLabel: null,
      tags: [],
      resources: null,
      related: null,
    };
    if (fields.includes("content")) (fallback as any).content = "";
    return fallback as Partial<EventMeta> & { content?: string };
  }

  const file = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(file);
  const fm = (data || {}) as Record<string, unknown>;

  // Back-compat: coverImage -> heroImage
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

    const raw = fm[field as string];

    if (field === "date" || field === "endDate") {
      const iso = normalizeDate(raw);
      if (iso) (item as any)[field] = iso;
      continue;
    }

    if (field === "tags") {
      const tags = normalizeTags(raw);
      if (tags) item.tags = tags;
      continue;
    }

    if (field === "resources") {
      const arr = Array.isArray(raw) ? raw : undefined;
      if (arr) item.resources = arr as any;
      continue;
    }

    if (field === "related") {
      const arr =
        Array.isArray(raw) ? raw.map(String) :
        typeof raw === "string" ? raw.split(",").map((s) => s.trim()) :
        undefined;
      if (arr) item.related = arr;
      continue;
    }

    if (typeof raw !== "undefined") {
      (item as any)[field] = raw;
    }
  }

  // Sensible defaults / JSON-safe coercions
  if (wanted.includes("title") && !item.title) item.title = realSlug;
  if (wanted.includes("date") && !item.date) item.date = new Date().toISOString();

  const strTrimKeys: (keyof EventMeta)[] = [
    "title", "location", "summary", "excerpt",
    "heroImage", "ctaHref", "ctaLabel",
  ];
  strTrimKeys.forEach((k) => {
    const v = (item as any)[k];
    if (typeof v === "string") (item as any)[k] = v.trim();
  });

  // Null out anything that might be undefined (Next.js JSON-safe)
  (item as any).endDate      = (item as any).endDate      ?? null;
  (item as any).location     = (item as any).location     ?? null;
  (item as any).summary      = (item as any).summary      ?? null;
  (item as any).excerpt      = (item as any).excerpt      ?? null;
  (item as any).heroImage    = (item as any).heroImage    ?? null;
  (item as any).heroFit      = (item as any).heroFit      ?? null;
  (item as any).heroAspect   = (item as any).heroAspect   ?? null;
  (item as any).heroPosition = (item as any).heroPosition ?? null;
  (item as any).ctaHref      = (item as any).ctaHref      ?? null;
  (item as any).ctaLabel     = (item as any).ctaLabel     ?? null;

  if (!Array.isArray(item.tags)) item.tags = [];
  if (!Array.isArray(item.resources)) item.resources = null;
  if (!Array.isArray(item.related)) item.related = null;

  return item;
}

/* ---------- dedupe (title + day, prefers non-midnight, then earlier time) ---------- */
export function dedupeEventsByTitleAndDay<T extends Partial<EventMeta>>(items: T[], tz = LONDON_TZ): T[] {
  const map = new Map<string, T>();

  for (const ev of items) {
    const title = normTitle(ev?.title);
    const date = ev?.date || "";
    const dk = dayKey(date, tz);
    if (!title || !dk) continue;

    const key = `${title}|${dk}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, ev);
      continue;
    }

    const aMid = isMidnightLocal(existing.date || "", tz);
    const bMid = isMidnightLocal(date, tz);

    if (aMid && !bMid) { map.set(key, ev); continue; }
    if (!aMid && bMid) { continue; }

    if (!aMid && !bMid) {
      const aMin = localMinutes(existing.date || "", tz);
      const bMin = localMinutes(date, tz);
      if (bMin < aMin) map.set(key, ev);
      continue;
    }
  }

  const seenSlugs = new Set<string>();
  const out: T[] = [];
  for (const ev of Array.from(map.values())) {
    const s = (ev.slug as string) || "";
    if (s && seenSlugs.has(s)) continue;
    if (s) seenSlugs.add(s);
    out.push(ev);
  }
  return out;
}

/* ---------- list (sorted newest→oldest) ---------- */
export function getAllEvents(fields: FieldKey[] = DEFAULT_FIELDS): Partial<EventMeta>[] {
  const slugs = getEventSlugs();
  const events = slugs.map((slug) => getEventBySlug(slug, fields));
  const deduped = dedupeEventsByTitleAndDay(events);
  deduped.sort((a, b) => {
    const da = a.date ? Date.parse(String(a.date)) : 0;
    const db = b.date ? Date.parse(String(b.date)) : 0;
    return db - da;
  });
  return deduped;
}
