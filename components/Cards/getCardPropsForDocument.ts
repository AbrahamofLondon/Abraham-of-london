// components/Cards/getCardPropsForDocument.ts
import type { PostLike } from "./types";

function toStr(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number") return String(v);
  return null;
}

function toStrArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
}

function normalizeType(doc: any): string {
  const raw =
    doc?.type ??
    doc?._type ??
    doc?.__type ??
    doc?._raw?.sourceFileDir ?? // sometimes helpful if you want folder-based fallback
    "";
  return String(raw).toLowerCase();
}

function fallbackHrefForType(type: string, slug: string): string {
  const s = slug.replace(/^\/+|\/+$/g, "");
  if (!s) return "/content";

  // accept both "post" and "blog", etc.
  if (type.includes("post") || type.includes("blog")) return `/blog/${s}`;
  if (type.includes("short")) return `/shorts/${s}`;
  if (type.includes("book")) return `/books/${s}`;
  if (type.includes("canon")) return `/canon/${s}`;
  if (type.includes("download")) return `/downloads/${s}`;
  if (type.includes("event")) return `/events/${s}`;
  if (type.includes("print")) return `/prints/${s}`;
  if (type.includes("resource")) return `/resources/${s}`;
  if (type.includes("strategy")) return `/content/${s}`;

  return `/content/${s}`;
}

export function getCardPropsForDocument(doc: any): PostLike {
  const slug = toStr(doc?.slug) ?? toStr(doc?._raw?.flattenedPath) ?? "";
  const type = normalizeType(doc);

  // Prefer Contentlayer computed field if present
  const urlFromContentlayer = toStr(doc?.url);
  const hrefFromDoc = toStr(doc?.href);
  const resolvedHref =
    urlFromContentlayer ||
    hrefFromDoc ||
    fallbackHrefForType(type, slug);

  const authorName =
    typeof doc?.author === "string"
      ? doc.author
      : toStr(doc?.author?.name) ??
        toStr(doc?.author?.displayName) ??
        null;

  const authorPicture =
    toStr(doc?.authorPicture) ??
    toStr(doc?.author?.picture) ??
    toStr(doc?.author?.avatar) ??
    toStr(doc?.author?.image) ??
    null;

  const readTime =
    toStr(doc?.readTime) ??
    toStr(doc?.readtime) ??
    toStr(doc?.readingTime) ??
    null;

  return {
    slug,
    title: toStr(doc?.title) ?? "Untitled",

    subtitle: toStr(doc?.subtitle),
    excerpt: toStr(doc?.excerpt),
    description: toStr(doc?.description),

    coverImage: toStr(doc?.coverImage),

    coverAspect: (toStr(doc?.coverAspect) as any) ?? null,
    coverFit: (toStr(doc?.coverFit) as any) ?? null,
    coverPosition: (toStr(doc?.coverPosition) as any) ?? null,

    date: toStr(doc?.date) ?? toStr(doc?.eventDate),

    tags: toStrArray(doc?.tags),

    featured: Boolean(doc?.featured),

    accessLevel: toStr(doc?.accessLevel) ?? null,
    lockMessage: toStr(doc?.lockMessage),

    category: toStr(doc?.category),

    readingTime: readTime,

    isNew: Boolean(doc?.isNew),

    href: resolvedHref,

    author: authorName,
    authorPicture,

    volumeNumber: toStr(doc?.volumeNumber),

    downloadUrl: toStr(doc?.downloadUrl) ?? toStr(doc?.fileUrl) ?? toStr(doc?.file),
    fileSize: toStr(doc?.fileSize),

    price: toStr(doc?.price),
    dimensions: toStr(doc?.dimensions),

    type: toStr(doc?.type) ?? (type ? type : null),
  };
}

