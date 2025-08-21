import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { EventMeta } from "@/types/event";

const eventsDir = path.join(process.cwd(), "content", "events");

function resolveEventPath(slug: string): string | null {
  const mdx = path.join(eventsDir, `${slug}.mdx`);
  const md = path.join(eventsDir, `${slug}.md`);
  if (fs.existsSync(mdx)) return mdx;
  if (fs.existsSync(md)) return md;
  return null;
}

export function getEventSlugs(): string[] {
  if (!fs.existsSync(eventsDir)) return [];
  return fs
    .readdirSync(eventsDir)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((f) => f.replace(/\.mdx?$/, ""));
}

// Pick only the fields you ask for (like books lib)
export function getEventBySlug(
  slug: string,
  fields: (keyof EventMeta | "content")[] = []
): Partial<EventMeta> & { content?: string } {
  const realSlug = slug.replace(/\.mdx?$/, "");
  const full = resolveEventPath(realSlug);

  if (!full) {
    return { slug: realSlug, title: "Event Not Found" } as Partial<EventMeta>;
  }

  const file = fs.readFileSync(full, "utf8");
  const { data, content } = matter(file);
  const fm = (data || {}) as Record<string, unknown>;

  const item: Partial<EventMeta> & { content?: string } = { slug: realSlug };

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

  return item;
}

export function getAllEvents(
  fields: (keyof EventMeta | "content")[] = []
): Partial<EventMeta>[] {
  const events = getEventSlugs().map((slug) => getEventBySlug(slug, fields));

  // sort by date descending; fall back to title/slug
  events.sort((a, b) => {
    const ad = a.date ? Date.parse(String(a.date)) : 0;
    const bd = b.date ? Date.parse(String(b.date)) : 0;
    if (ad && bd && ad !== bd) return bd - ad;
    const an = (a.title || a.slug || "").toString();
    const bn = (b.title || b.slug || "").toString();
    return an.localeCompare(bn, undefined, { sensitivity: "base" });
  });

  return events;
}
