// lib/server/mdx-collections.ts
// Generic, file-system based MDX loader for content/* collections.
// No Contentlayer dependency. Safe for Netlify / Next static builds.

import fs from "fs";
import path from "path";
import matter from "gray-matter";

export const CONTENT_ROOT = path.join(process.cwd(), "content");
const MD_EXTS = [".md", ".mdx"] as const;

type RawDoc = {
  collection: string;
  filePath: string;
  slug: string;
  data: Record<string, unknown>;
  content: string;
};

export type MdxMeta = {
  slug: string;
  title?: string;
  date?: string;
  excerpt?: string;
  coverImage?: string;
  [key: string]: unknown;
};

export type MdxDocument = MdxMeta & {
  content: string;
};

/** Sort by date descending, fallback to 0 if no/invalid date */
function sortByDateDesc<T extends { date?: string | null }>(items: T[]): T[] {
  const toKey = (d?: string | null) => {
    if (!d) return 0;
    const t = new Date(d).getTime();
    return Number.isFinite(t) ? t : 0;
  };
  return [...items].sort((a, b) => toKey(b.date) - toKey(a.date));
}

function getCollectionDir(collection: string): string | null {
  const dir = path.join(CONTENT_ROOT, collection);
  try {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      return dir;
    }
  } catch {
    // ignore
  }
  return null;
}

function listCollectionFiles(collection: string): string[] {
  const dir = getCollectionDir(collection);
  if (!dir) return [];
  return fs
    .readdirSync(dir)
    .filter((f) =>
      MD_EXTS.some((ext) => f.toLowerCase().endsWith(ext as string)),
    )
    .map((f) => path.join(dir, f));
}

function readRawDocs(collection: string): RawDoc[] {
  const files = listCollectionFiles(collection);
  return files.map((filePath) => {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);

    const base = path.basename(filePath).replace(/\.(mdx?|MDX?)$/, "");
    const fmSlug = data?.slug;
    const slug = (typeof fmSlug === "string" && fmSlug.trim().length
      ? fmSlug
      : base
    ).trim();

    return {
      collection,
      filePath,
      slug,
      data: (data || {}) as Record<string, unknown>,
      content,
    };
  });
}

function toMeta(doc: RawDoc): MdxMeta {
  const anyData = doc.data as any;
  return {
    slug: doc.slug,
    title: anyData.title ?? undefined,
    date: anyData.date ?? undefined,
    excerpt: anyData.excerpt ?? anyData.description ?? undefined,
    coverImage: anyData.coverImage ?? anyData.image ?? undefined,
    ...anyData,
  };
}

/** Meta-only list for a collection (sorted by date desc if available). */
export function getMdxCollectionMeta(collection: string): MdxMeta[] {
  const docs = readRawDocs(collection).map((doc) => toMeta(doc));
  return sortByDateDesc(docs);
}

/** Full documents (meta + content) for a collection. */
export function getMdxCollectionDocuments(collection: string): MdxDocument[] {
  const docs = readRawDocs(collection).map((doc) => {
    const meta = toMeta(doc);
    return {
      ...meta,
      content: doc.content,
    };
  });
  return sortByDateDesc(docs);
}

/** Single document lookup by slug (case-insensitive). */
export function getMdxDocumentBySlug(
  collection: string,
  slug: string,
): MdxDocument | null {
  const target = String(slug || "").toLowerCase();
  const docs = getMdxCollectionDocuments(collection);
  const match =
    docs.find((d) => String(d.slug || "").toLowerCase() === target) ?? null;
  return match ?? null;
}