// lib/events.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type EventItem = {
  slug: string;
  title: string;
  date: string;        // ISO yyyy-mm-dd
  location: string;
  description?: string | null;
  coverImage?: string | null;
  tags?: string[] | null;
  content?: string;
};

const eventsDir = path.join(process.cwd(), "content", "events");

export function getEventSlugs(): string[] {
  if (!fs.existsSync(eventsDir)) return [];
  return fs
    .readdirSync(eventsDir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx?$/, ""));
}

function resolveEventPath(slug: string): string | null {
  const real = slug.replace(/\.mdx?$/, "");
  const mdx = path.join(eventsDir, `${real}.mdx`);
  const md = path.join(eventsDir, `${real}.md`);
  if (fs.existsSync(mdx)) return mdx;
  if (fs.existsSync(md)) return md;
  return null;
}

export function getEventBySlug(
  slug: string,
  fields: (keyof EventItem | "content")[] = [],
): Partial<EventItem> & { content?: string } {
  const realSlug = slug.replace(/\.mdx?$/, "");
  const fullPath = resolveEventPath(realSlug);

  if (!fullPath) {
    return { slug: realSlug, title: "Event Not Found" } as Partial<EventItem>;
  }

  const file = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(file);
  const fm = (data || {}) as Record<string, unknown>;

  const item: Partial<EventItem> & { content?: string } = { slug: realSlug };

  for (const field of fields) {
    if (field === "content") {
      item.content = content;
      continue;
    }
    const raw = fm[field as string];
    if (typeof raw === "undefined") continue;

    if (field === "tags") {
      if (Array.isArray(raw)) {
        item.tags = (raw as unknown[]).map(String).map((s) => s.trim()).filter(Boolean);
      } else if (typeof raw === "string") {
        item.tags = raw.split(",").map((s) => s.trim()).filter(Boolean);
      }
      continue;
    }

    (item as Record<string, unknown>)[field] = raw;
  }

  // Normalize a few common fields if they weren't explicitly requested
  if (!fields.includes("title") && typeof fm.title === "string") item.title = fm.title;
  if (!fields.includes("date") && typeof fm.date === "string") item.date = fm.date;
  if (!fields.includes("location") && typeof fm.location === "string") item.location = fm.location;
  if (!fields.includes("description") && typeof fm.description === "string") item.description = fm.description;

  return item;
}

export function getAllEvents(
  fields: (keyof EventItem | "content")[] = [],
): Partial<EventItem>[] {
  const slugs = getEventSlugs();
  const events = slugs.map((slug) => getEventBySlug(slug, fields));

  // Sort ascending by date (soonest first); invalid dates sink to bottom
  events.sort((a, b) => {
    const ad = a.date ? new Date(String(a.date)).getTime() : Number.POSITIVE_INFINITY;
    const bd = b.date ? new Date(String(b.date)).getTime() : Number.POSITIVE_INFINITY;
    return ad - bd;
  });

  return events;
}
