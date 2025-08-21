// lib/events.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface EventMeta {
  slug: string;
  title: string;
  date: string;
  location?: string;
  excerpt?: string;
  summary?: string;      // NEW: match pages/events/[slug].tsx usage
  heroImage?: string;
  ctaHref?: string;
  ctaLabel?: string;
  tags?: string[];
  content?: string;
}

const eventsDir = path.join(process.cwd(), "content", "events");

export function getEventSlugs(): string[] {
  if (!fs.existsSync(eventsDir)) return [];
  return fs
    .readdirSync(eventsDir)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((f) => f.replace(/\.mdx?$/, ""));
}

function resolveEventPath(slug: string): string | null {
  const mdx = path.join(eventsDir, `${slug}.mdx`);
  const md = path.join(eventsDir, `${slug}.md`);
  if (fs.existsSync(mdx)) return mdx;
  if (fs.existsSync(md)) return md;
  return null;
}

export function getEventBySlug(
  slug: string,
  fields: (keyof EventMeta | "content")[] = [],
): Partial<EventMeta> & { content?: string } {
  const realSlug = slug.replace(/\.mdx?$/, "");
  const fullPath = resolveEventPath(realSlug);

  if (!fullPath) {
    // minimal object if file not found
    return { slug: realSlug, title: "Event Not Found", date: new Date().toISOString() };
  }

  const file = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(file);
  const fm = (data || {}) as Record<string, unknown>;

  const item: Partial<EventMeta> & { content?: string } = { slug: realSlug };

  for (const field of fields) {
    if (field === "content") {
      item.content = content;
      continue;
    }
    const raw = fm[field as string];

    // normalize common fields
    if (field === "tags") {
      if (Array.isArray(raw)) {
        item.tags = (raw as unknown[]).map(String).map((s) => s.trim()).filter(Boolean);
      } else if (typeof raw === "string") {
        item.tags = raw.split(",").map((s) => s.trim()).filter(Boolean);
      }
      continue;
    }

    if (typeof raw !== "undefined") {
      (item as Record<string, unknown>)[field] = raw;
    }
  }

  // Ensure minimally required fields if selected
  if (fields.includes("title") && !item.title) item.title = realSlug;
  if (fields.includes("date") && !item.date) item.date = new Date().toISOString();

  return item;
}

export function getAllEvents(
  fields: (keyof EventMeta | "content")[] = [],
): Partial<EventMeta>[] {
  const slugs = getEventSlugs();
  const events = slugs.map((slug) => getEventBySlug(slug, fields));

  // sort by date descending (newest first)
  events.sort((a, b) => {
    const da = a.date ? Date.parse(String(a.date)) : 0;
    const db = b.date ? Date.parse(String(b.date)) : 0;
    return db - da;
  });

  return events;
}

// Small helpers (optional)
export function isUpcoming(dateStr?: string): boolean {
  if (!dateStr) return false;
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return false;
  return t >= Date.now();
}

export function prettyDate(dateStr?: string, locale = "en-GB"): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}
