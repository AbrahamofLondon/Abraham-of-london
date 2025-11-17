// lib/server/books-data.ts
// Books under content/books/*

import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";

export type BookMeta = MdxMeta & {
  author?: string | null;
  readTime?: string | null;
};

export type BookWithContent = BookMeta & {
  content: string;
};

function fromMdxMeta(meta: MdxMeta): BookMeta {
  const anyMeta = meta as any;
  return {
    ...meta,
    author: anyMeta.author ?? null,
    readTime: anyMeta.readTime ?? null,
  };
}

function fromMdxDocument(doc: MdxDocument): BookWithContent {
  const { content, ...rest } = doc;
  const meta = fromMdxMeta(rest);
  return { ...meta, content };
}

export function getAllBooksMeta(): BookMeta[] {
  const metas = getMdxCollectionMeta("books");
  return metas.map(fromMdxMeta);
}

export function getBookBySlug(slug: string): BookWithContent | null {
  const doc = getMdxDocumentBySlug("books", slug);
  return doc ? fromMdxDocument(doc) : null;
}