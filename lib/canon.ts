// lib/canon.ts
import { allCanons } from "contentlayer/generated";
import type { Canon } from "contentlayer/generated";

function norm(s: string) {
  return String(s || "").trim().toLowerCase();
}

export function getCanonIndexItems(): Array<
  Pick<
    Canon,
    | "slug"
    | "title"
    | "subtitle"
    | "excerpt"
    | "description"
    | "coverImage"
    | "volumeNumber"
    | "date"
    | "tags"
    | "featured"
    | "accessLevel"
    | "lockMessage"
    | "draft"
    | "order"
  >
> {
  return (allCanons || [])
    .filter((c) => c && c.draft !== true && c.draft !== "true")
    .map((c) => ({
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle,
      excerpt: c.excerpt,
      description: c.description,
      coverImage: c.coverImage,
      volumeNumber: c.volumeNumber,
      date: c.date,
      tags: c.tags,
      featured: c.featured,
      accessLevel: c.accessLevel,
      lockMessage: c.lockMessage,
      draft: c.draft,
      order: (c as any).order,
    }));
}

/** ✅ FULL DOC (includes body.code) — this is what the slug page must use */
export function getCanonDocBySlug(slug: string): Canon | null {
  const target = norm(slug);
  const doc =
    (allCanons || []).find((c) => norm(c.slug) === target) ??
    (allCanons || []).find((c) => norm(c._raw?.flattenedPath?.split("/").pop() || "") === target) ??
    null;

  return doc;
}