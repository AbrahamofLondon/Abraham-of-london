// lib/server/events-data.ts
import "server-only";
export interface EventMeta {
  slug: string;
  title: string;
  date: string;
  endDate?: string;
  location?: string;
  excerpt?: string;
  summary?: string;
  heroImage?: string;
  ctaHref?: string;
  ctaLabel?: string;
  tags?: string[];
  content?: string;
}

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const eventsDir = path.join(process.cwd(), "content", "events");
const exts = [".mdx", ".md"] as const;

const LONDON_TZ = "Europe/London";

// ---------- helpers: dates / tz ----------
function isDateOnly(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function dayKey(iso: string, tz = LONDON_TZ): string {
  if (!iso) return "";
  if (isDateOnly(iso)) return iso; // already YYYY-MM-DD
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // YYYY-MM-DD
}

function isMidnightLocal(iso: string, tz = LONDON_TZ): boolean {
  if (!iso) return false;
  if (isDateOnly(iso)) return true; // treat date-only as midnight
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

// ---------- helpers: normalization ----------
function normalizeDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.trim();
  // Preserve date-only strings to avoid implicit midnight TZ churn
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

// ---------- fs helpers ----------
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

const DEFAULT_FIELDS: FieldKey[] = [
  "slug",
  "title",
  "date",
  "endDate",
  "location",
  "summary",
  "heroImage",
  "ctaHref",
  "ctaLabel",
  "tags",
];

// ---------- loader ----------
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

    if (typeof raw !== "undefined") {
      (item as any)[field] = raw;
    }
  }

  if (wanted.includes("title") && !item.title) item.title = realSlug;
  if (wanted.includes("date") && !item.date) item.date = new Date().toISOString();

  ["title", "location", "summary", "heroImage", "ctaHref", "ctaLabel"].forEach((k) => {
    const v = (item as any)[k];
    if (typeof v === "string") (item as any)[k] = v.trim();
  });

  return item;
}

// ---------- dedupe logic ----------
function dedupeEventsByTitleAndDay<T extends Partial<EventMeta>>(items: T[], tz = LONDON_TZ): T[] {
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

    // Prefer non-midnight over midnight
    const aMid = isMidnightLocal(existing.date || "", tz);
    const bMid = isMidnightLocal(date, tz);

    if (aMid && !bMid) {
      map.set(key, ev);
      continue;
    }
    if (!aMid && bMid) {
      continue; // keep existing
    }

    // If both non-midnight, keep the earlier local time
    if (!aMid && !bMid) {
      const aMin = localMinutes(existing.date || "", tz);
      const bMin = localMinutes(date, tz);
      if (bMin < aMin) map.set(key, ev);
      continue;
    }
    // Both midnight → keep first
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

// ---------- list ----------
export function getAllEvents(fields: FieldKey[] = DEFAULT_FIELDS): Partial<EventMeta>[] {
  const slugs = getEventSlugs();
  const events = slugs.map((slug) => getEventBySlug(slug, fields));

  const deduped = dedupeEventsByTitleAndDay(events);

  deduped.sort((a, b) => {
    const da = a.date ? Date.parse(String(a.date)) : 0;
    const db = b.date ? Date.parse(String(b.date)) : 0;
    return db - da; // newest first
  });

  return deduped;
}
