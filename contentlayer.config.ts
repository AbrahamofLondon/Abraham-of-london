import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

/**
 * -----------------------------------------------------------------------------
 * 1. RESILIENT COMMON FIELDS
 * Expanded to absorb SEO and structural metadata found in existing documents.
 * -----------------------------------------------------------------------------
 */
const commonFields = {
  title: { type: "string", required: true },
  date: { type: "date", required: true },
  
  // Logical Routing
  slug: { type: "string", required: false },
  href: { type: "string", required: false },

  // Content Descriptors
  description: { type: "string", required: false },
  excerpt: { type: "string", required: false },
  
  // Image & Visual Integrity (Forgiving Schema)
  coverImage: { type: "string", required: false },
  coverAspect: { type: "string", required: false }, // Absorbs "wide", "book", etc.
  coverFit: { type: "string", required: false },    // Absorbs "cover", "contain", "fit"
  coverPosition: { type: "string", required: false },

  // System Flags
  tags: { type: "list", of: { type: "string" }, required: false },
  draft: { type: "boolean", required: false, default: false },
  featured: { type: "boolean", required: false, default: false },
  layout: { type: "string", required: false }, // Absorbs "article" layout overrides

  // Access & Membership
  accessLevel: { type: "string", required: false },
  lockMessage: { type: "string", required: false },

  // SEO & Social (The "Marketing" Block)
  ogTitle: { type: "string", required: false },
  ogDescription: { type: "string", required: false },
  socialCaption: { type: "string", required: false },
} as const;

/**
 * -----------------------------------------------------------------------------
 * 2. SHARED LOGIC
 * Ensures slugs generated here match exactly with getStaticPaths logic.
 * -----------------------------------------------------------------------------
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
 * -----------------------------------------------------------------------------
 * 3. DOCUMENT DEFINITIONS
 * -----------------------------------------------------------------------------
 */

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    ...commonFields,
    author: { type: "string", required: false },
    authorTitle: { type: "string", required: false }, // Absorbs Abraham of London title
    readTime: { type: "string", required: false },
    category: { type: "string", required: false },
    relatedDownloads: { type: "list", of: { type: "string" }, required: false },
    resources: { type: "json", required: false }, // Absorbs custom resource JSON
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
    author: { type: "string", required: false }, // Absorbs specific author fields
    readTime: { type: "string", required: false },
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
    readTime: { type: "string", required: false },
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
    readTime: { type: "string", required: false },
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
    readTime: { type: "string", required: false },
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
    available: { type: "boolean", default: true },
    price: { type: "string", required: false },
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
  fields: {
    ...commonFields,
    author: { type: "string", required: false },
  },
  computedFields: {
    url: { type: "string", resolve: (doc) => `/strategy/${normalizeSlug(doc)}` },
    slug: { type: "string", resolve: normalizeSlug },
  },
}));

/**
 * -----------------------------------------------------------------------------
 * 4. SYSTEM SOURCE
 * -----------------------------------------------------------------------------
 */
export default makeSource({
  contentDirPath: "content",
  documentTypes: [Post, Book, Canon, Short, Resource, Download, Event, Print, Strategy],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
  },
  onUnknownDocuments: "skip",
  disableImportAliasWarning: true,
});