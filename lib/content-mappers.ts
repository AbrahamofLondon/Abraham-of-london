// lib/content-mappers.ts
import type { Canon, Book, Post, Download, Resource, Event, Print } from "@/lib/contentlayer";

type AnyDoc =
  | Post
  | Book
  | Download
  | Resource
  | Event
  | Print
  | Canon
  | (Record<string, any> & { type?: string; slug?: string; title?: string });

const s = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

// Export type guards
export function isBook(doc: AnyDoc): doc is Book {
  return doc?.type === "Book";
}

export function isPost(doc: AnyDoc): doc is Post {
  return doc?.type === "Post";
}

export function isCanon(doc: AnyDoc): doc is Canon {
  return doc?.type === "Canon";
}

export function mapToBaseCardProps(doc: AnyDoc) {
  return {
    slug: s((doc as any).slug),
    title: s((doc as any).title) || "Untitled",
    subtitle: (doc as any).subtitle ?? null,
    excerpt: (doc as any).excerpt ?? null,
    description: (doc as any).description ?? null,
    coverImage: (doc as any).coverImage ?? null,
    date: (doc as any).date ?? null,
    tags: Array.isArray((doc as any).tags) ? (doc as any).tags : [],
    featured: Boolean((doc as any).featured),
    accessLevel: (doc as any).accessLevel ?? null,
    lockMessage: (doc as any).lockMessage ?? null,
  };
}

export function mapToBookCardProps(doc: Book) {
  return {
    ...mapToBaseCardProps(doc),
    author: (doc as any).author ?? null,
    isbn: (doc as any).isbn ?? null,
    publisher: (doc as any).publisher ?? null,
    publishDate: (doc as any).date ?? null,
  };
}

export function mapToBlogPostCardProps(doc: Post) {
  return {
    ...mapToBaseCardProps(doc),
    author: (doc as any).author ?? null,
    readTime: (doc as any).readTime ?? null,
    category: (doc as any).category ?? null,
  };
}

export function mapToCanonCardProps(doc: Canon) {
  return {
    ...mapToBaseCardProps(doc),
    author: (doc as any).author ?? null,
    volumeNumber: (doc as any).volumeNumber ?? null,
    readTime: (doc as any).readTime ?? null,
  };
}

export function getCardPropsForDocument(doc: AnyDoc) {
  const t = s((doc as any).type);
  if (t === "Book") return mapToBookCardProps(doc as Book);
  if (t === "Post") return mapToBlogPostCardProps(doc as Post);
  if (t === "Canon") return mapToCanonCardProps(doc as Canon);
  return mapToBaseCardProps(doc);
}
