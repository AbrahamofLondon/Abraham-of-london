// lib/shorts.ts
import { allShorts } from "contentlayer/generated";

export type ShortIndexItem = {
  _id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  date?: string | null;
  readTime?: string | null;
  tags?: string[];
  theme?: string | null;
  draft?: boolean;
  published?: boolean;
};

function safeSlug(doc: any): string {
  // Prefer explicit frontmatter slug; fall back to flattenedPath
  const raw = doc.slug || doc._raw?.flattenedPath || "";
  return String(raw).replace(/^shorts\//, "").replace(/\/index$/, "");
}

export function getPublicShorts(): ShortIndexItem[] {
  const docs = allShorts ?? [];

  const items: ShortIndexItem[] = docs.map((d: any) => ({
    _id: d._id,
    slug: safeSlug(d),
    title: d.title ?? "Untitled",
    excerpt: d.excerpt ?? null,
    date: d.date ? String(d.date) : null,
    readTime: d.readTime ?? null,
    tags: Array.isArray(d.tags) ? d.tags : [],
    theme: d.theme ?? null,
    draft: Boolean(d.draft),
    // If published isn't present in generated output, default true
    published: typeof d.published === "boolean" ? d.published : true,
  }));

  // public rule: not draft + published
  return items
    .filter((s) => !s.draft && s.published !== false)
    .sort((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : 0;
      const bTime = b.date ? new Date(b.date).getTime() : 0;
      return bTime - aTime;
    });
}