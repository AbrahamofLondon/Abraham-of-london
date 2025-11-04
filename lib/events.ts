import { ensureDir, listMdFiles, fileToSlug, readFrontmatter } from "./fs-utils";
import path from "path";

export type EventMeta = {
  slug: string;
  title?: string;
  date?: string;      // start date (ISO yyyy-mm-dd recommended)
  endDate?: string;   // optional end date
  location?: string | null;
  summary?: string | null;
  tags?: string[] | null;
  chatham?: boolean;
};

const COLLECTION = "events";

export function getAllEvents(): EventMeta[] {
  const abs = ensureDir(COLLECTION);
  if (!abs) return [];
  const items = listMdFiles(abs).map((absFile) => {
    const slug = fileToSlug(absFile);
    const { data } = readFrontmatter(absFile);
    const meta: EventMeta = {
      slug,
      title: typeof data.title === "string" ? data.title : slug,
      date: typeof data.date === "string" ? data.date : undefined,
      endDate: typeof data.endDate === "string" ? data.endDate : undefined,
      location: typeof data.location === "string" ? data.location : null,
      summary: typeof data.summary === "string" ? data.summary : null,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : null,
      chatham: typeof data.chatham === "boolean" ? data.chatham : undefined,
    };
    return meta;
  });
  // sort by start date desc if present
  return items.sort((a, b) => (new Date(b.date ?? 0).valueOf() - new Date(a.date ?? 0).valueOf()));
}

export function dedupeEventsByTitleAndDay(list: EventMeta[]): EventMeta[] {
  const seen = new Set<string>();
  const out: EventMeta[] = [];
  for (const e of list) {
    const key = `${(e.title ?? "").trim().toLowerCase()}|${(e.date ?? "").slice(0,10)}`;
    if (!seen.has(key)) { seen.add(key); out.push(e); }
  }
  return out;
}
