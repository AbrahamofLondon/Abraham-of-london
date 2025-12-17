import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

/**
 * 1. RESILIENT COMMON FIELDS
 * Promotes extra metadata (ogTitle, coverAspect, etc.) to valid system properties.
 */
const commonFields = {
  title: { type: "string", required: true },
  date: { type: "date", required: true },
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
  readTime: { type: "string", required: false },
} as const;

/**
 * 2. SHARED NORMALIZATION LOGIC
 * Ensures URLs never have trailing slashes and match local file logic.
 */
function normalizeSlug(doc: any): string {
  if (doc.slug && typeof doc.slug === "string" && doc.slug.trim()) {
    return doc.slug.trim().toLowerCase().replace(/\/$/, "");
  }
  const flattened = doc._raw.flattenedPath;
  const parts = flattened.split("/");
  const last = parts[parts.length - 1];
  return (last === "index" ? parts[parts.length - 2] : last).toLowerCase();
}

/**
 * 3. DOCUMENT DEFINITIONS
 */
export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    author: { type: "string", required: false },
    authorTitle: { type: "string", required: false },
    category: { type: "string", required: false },
    relatedDownloads: { type: "list", of: { type: "string" }, required: false },
    resources: { type: "json", required: false },
    authorNote: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => `/blog/${normalizeSlug(doc)}` },
    slug: { type: "string", resolve: normalizeSlug },
  },
}));

export const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: "canon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    subtitle: { type: "string", required: false },
    author: { type: "string", required: false },
    volumeNumber: { type: "string", required: false },
    order: { type: "number", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => `/canon/${normalizeSlug(doc)}` },
    slug: { type: "string", resolve: normalizeSlug },
  },
}));

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    subtitle: { type: "string", required: false },
    author: { type: "string", required: false },
    publisher: { type: "string", required: false },
    isbn: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => `/books/${normalizeSlug(doc)}` },
    slug: { type: "string", resolve: normalizeSlug },
  },
}));

export const Short = defineDocumentType(() => ({
  name: "Short",
  filePathPattern: "shorts/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    theme: { type: "string", required: false },
    published: { type: "boolean", required: false, default: true },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => `/shorts/${normalizeSlug(doc)}` },
    slug: { type: "string", resolve: normalizeSlug },
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
    url: { type: "string", resolve: (doc) => `/downloads/${normalizeSlug(doc)}` },
    slug: { type: "string", resolve: normalizeSlug },
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
    url: { type: "string", resolve: (doc) => `/resources/${normalizeSlug(doc)}` },
    slug: { type: "string", resolve: normalizeSlug },
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
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => `/events/${normalizeSlug(doc)}` },
    slug: { type: "string", resolve: normalizeSlug },
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
    available: { type: "boolean", default: true },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => `/prints/${normalizeSlug(doc)}` },
    slug: { type: "string", resolve: normalizeSlug },
  },
}));

export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.{md,mdx}",
  contentType: "mdx",
  fields: { ...commonFields, author: { type: "string", required: false } },
  computedFields: {
    url: { type: "string", resolve: (doc) => `/strategy/${normalizeSlug(doc)}` },
    slug: { type: "string", resolve: normalizeSlug },
  },
}));

export default makeSource({
  contentDirPath: "content",
  documentTypes: [Post, Book, Canon, Short, Resource, Download, Event, Print, Strategy],
  mdx: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] },
  onUnknownDocuments: "skip",
  disableImportAliasWarning: true,
});