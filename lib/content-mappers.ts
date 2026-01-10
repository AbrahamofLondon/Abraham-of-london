// lib/content-mappers.ts
import type { 
  Canon, 
  Book, 
  Post, 
  Download, 
  Resource, 
  Event, 
  Print 
} from "@/lib/contentlayer";

// Define strict union of known types + generic fallback
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
  // Use safe access for all fields since AnyDoc might be a generic record
  const d = doc as any;
  return {
    slug: s(d.slug || d._raw?.flattenedPath),
    title: s(d.title) || "Untitled",
    subtitle: d.subtitle ?? null,
    excerpt: d.excerpt ?? null,
    description: d.description ?? null,
    coverImage: d.coverImage ?? null,
    date: d.date ?? null,
    tags: Array.isArray(d.tags) ? d.tags : [],
    featured: Boolean(d.featured),
    accessLevel: d.accessLevel ?? null,
    lockMessage: d.lockMessage ?? null,
    type: d.type || 'Page', // Ensure type is passed through for UI badges
  };
}

export function mapToBookCardProps(doc: Book) {
  const base = mapToBaseCardProps(doc);
  return {
    ...base,
    author: doc.author ?? null,
    isbn: doc.isbn ?? null,
    publisher: doc.publisher ?? null,
    publishDate: doc.date ?? null,
  };
}

export function mapToBlogPostCardProps(doc: Post) {
  const base = mapToBaseCardProps(doc);
  return {
    ...base,
    // Use unsafe access for properties that might not exist on all Post types depending on config
    author: (doc as any).author ?? null,
    readTime: (doc as any).readTime ?? null,
    category: (doc as any).category ?? null,
  };
}

export function mapToCanonCardProps(doc: Canon) {
  const base = mapToBaseCardProps(doc);
  return {
    ...base,
    author: (doc as any).author ?? null,
    volumeNumber: doc.volumeNumber ?? null,
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

