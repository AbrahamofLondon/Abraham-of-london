// lib/server/events-data.ts

// Add the EventMeta interface here
export interface EventMeta {
  slug: string;
  title: string;
  date: string;
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
import { remark } from 'remark';
import html from 'remark-html';

const eventsDir = path.join(process.cwd(), "content", "events");
const exts = [".mdx", ".md"] as const;

function normalizeDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
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

  if (wanted.includes("title") && !item.title) item.title = realSlug;
  if (wanted.includes("date") && !item.date) item.date = new Date().toISOString();

  ["title", "location", "summary", "heroImage", "ctaHref", "ctaLabel"].forEach((k) => {
    const v = (item as any)[k];
    if (typeof v === "string") (item as any)[k] = v.trim();
  });

  return item;
}

export function getAllEvents(fields: FieldKey[] = DEFAULT_FIELDS): Partial<EventMeta>[] {
  const slugs = getEventSlugs();
  const events = slugs.map((slug) => getEventBySlug(slug, fields));
  events.sort((a, b) => {
    const da = a.date ? Date.parse(String(a.date)) : 0;
    const db = b.date ? Date.parse(String(b.date)) : 0;
    return db - da;
  });
  return events;
}