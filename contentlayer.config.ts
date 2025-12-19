import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

const commonFields = {
  title: { type: "string", required: true },
  date: { type: "date", required: true },

  // Frontmatter override; do NOT also compute slug field
  slug: { type: "string", required: false },

  href: { type: "string", required: false },
  description: { type: "string", required: false },
  excerpt: { type: "string", required: false },

  coverImage: { type: "string", required: false },
  coverAspect: { type: "string", required: false },
  coverFit: { type: "string", required: false },
  coverPosition: { type: "string", required: false },

  tags: { type: "list", of: { type: "string" }, required: false },
  draft: { type: "boolean", required: false, default: false },
  featured: { type: "boolean", required: false, default: false },

  layout: { type: "string", required: false },
  accessLevel: { type: "string", required: false },
  lockMessage: { type: "string", required: false },

  ogTitle: { type: "string", required: false },
  ogDescription: { type: "string", required: false },
  socialCaption: { type: "string", required: false },

  // allow both variants used in legacy docs
  readTime: { type: "string", required: false },
  readtime: { type: "string", required: false },

  category: { type: "string", required: false },
  author: { type: "string", required: false },
  audience: { type: "string", required: false },
  theme: { type: "string", required: false },
} as const;

function normalizedSlug(doc: any): string {
  const s = typeof doc.slug === "string" ? doc.slug.trim() : "";
  if (s) return s.toLowerCase().replace(/\/+$/, "");

  const fp: string = doc._raw.flattenedPath;
  const parts = fp.split("/");
  const last = parts[parts.length - 1];
  const slug = last === "index" ? parts[parts.length - 2] : last;
  return String(slug).toLowerCase().replace(/\/+$/, "");
}

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    authorTitle: { type: "string", required: false },
    relatedDownloads: { type: "list", of: { type: "string" }, required: false },
    resources: { type: "json", required: false },
    authorNote: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => `/blog/${normalizedSlug(doc)}` },
  },
}));

export const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: "canon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    subtitle: { type: "string", required: false },
    volumeNumber: { type: "string", required: false },
    order: { type: "number", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => `/canon/${normalizedSlug(doc)}` },
  },
}));

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    subtitle: { type: "string", required: false },
    publisher: { type: "string", required: false },
    isbn: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => `/books/${normalizedSlug(doc)}` },
  },
}));

export const Short = defineDocumentType(() => ({
  name: "Short",
  filePathPattern: "shorts/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    published: { type: "boolean", required: false, default: true },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => `/shorts/${normalizedSlug(doc)}` },
  },
}));

export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    subtitle: { type: "string", required: false },
    fileUrl: { type: "string", required: false },
    pdfPath: { type: "string", required: false },
    fileSize: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
    downloadFile: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => `/downloads/${normalizedSlug(doc)}` },
  },
}));

export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    subtitle: { type: "string", required: false },
    resourceType: { type: "string", required: false },
    fileUrl: { type: "string", required: false },
    downloadUrl: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => `/resources/${normalizedSlug(doc)}` },
  },
}));

export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: "events/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    eventDate: { type: "date", required: false },
    location: { type: "string", required: false },
    time: { type: "string", required: false },
    registrationUrl: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => `/events/${normalizedSlug(doc)}` },
  },
}));

export const Print = defineDocumentType(() => ({
  name: "Print",
  filePathPattern: "prints/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    dimensions: { type: "string", required: false },
    price: { type: "string", required: false },
    available: { type: "boolean", required: false, default: true },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => `/prints/${normalizedSlug(doc)}` },
  },
}));

export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.{md,mdx}",
  contentType: "mdx",
  fields: { ...commonFields },
  computedFields: {
    url: { type: "string", resolve: (doc) => `/strategy/${normalizedSlug(doc)}` },
  },
}));

export default makeSource({
  contentDirPath: "content",
  documentTypes: [Post, Book, Canon, Short, Resource, Download, Event, Print, Strategy],
  mdx: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] },
  onUnknownDocuments: "skip",
  disableImportAliasWarning: true,
});