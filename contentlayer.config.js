// contentlayer.config.ts
import path from "node:path";
import { defineDocumentType, makeSource } from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function escapeForRegExp(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Generate a clean slug from flattenedPath + collection prefix
function generateSlug(flattenedPath, prefix) {
  if (!flattenedPath) return "untitled";
  try {
    const safePrefix = escapeForRegExp(prefix);
    return (
      String(flattenedPath)
        .replace(new RegExp(`^${safePrefix}/`, "u"), "")
        .replace(/\/index$/u, "") || "untitled"
    );
  } catch {
    return "untitled";
  }
}

// Build a URL from slug + base path
function generateUrl(slug, basePath) {
  const cleanSlug = String(slug).replace(/^\/+|\/+$/gu, "");
  const cleanBase = String(basePath).replace(/^\/+|\/+$/gu, "");
  if (!cleanSlug) return `/${cleanBase}`;
  return `/${cleanBase}/${cleanSlug}`.replace(/\/+/gu, "/");
}

// -----------------------------------------------------------------------------
// Document types
// -----------------------------------------------------------------------------

// BLOG POSTS (content/blog/**/*)
export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `blog/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
      default: "Untitled Post",
    },
    date: {
      type: "date",
      required: true,
      default: new Date().toISOString().split("T")[0],
    },
    // Fields actually used in your MDX files
    slug: { type: "string", required: false },
    description: { type: "string", required: false },
    author: { type: "string", required: false },
    authorTitle: { type: "string", required: false },
    readTime: { type: "string", required: false },
    category: { type: "string", required: false },
    ogTitle: { type: "string", required: false },
    ogDescription: { type: "string", required: false },
    socialCaption: { type: "string", required: false },
    coverAspect: { type: "string", required: false },
    coverFit: { type: "string", required: false },
    coverPosition: { type: "string", required: false },
    relatedDownloads: { type: "list", of: { type: "string" }, required: false },
    resources: { type: "json", required: false },
    keyInsights: { type: "json", required: false },
    authorNote: { type: "string", required: false },
    // Legacy fields (keep for backwards compatibility)
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    draft: { type: "boolean", default: false },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (doc) => {
        // Use explicit slug if provided, otherwise generate from path
        const finalSlug = doc.slug || generateSlug(doc._raw.flattenedPath, "blog");
        return generateUrl(finalSlug, "blog");
      },
    },
    readingTime: {
      type: "number",
      resolve: (doc) => {
        const wordsPerMinute = 200;
        const wordCount = String(doc.body.raw).split(/\s+/u).length;
        return Math.ceil(wordCount / wordsPerMinute);
      },
    },
  },
}));

// DOWNLOAD RESOURCES (content/downloads/**/*)
export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: `downloads/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
      default: "Untitled Download",
    },
    date: {
      type: "date",
      required: true,
      default: new Date().toISOString().split("T")[0],
    },
    // Fields actually used in your MDX files
    slug: { type: "string", required: false },
    author: { type: "string", required: false },
    readTime: { type: "string", required: false },
    readtime: { type: "string", required: false }, // Note: some files use lowercase
    category: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    file: { type: "string", required: false },
    pdfPath: { type: "string", required: false },
    layout: { type: "string", required: false },
    description: { type: "string", required: false },
    // Legacy fields
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    downloadFile: { type: "string", required: false, default: "" },
    fileUrl: { type: "string", default: "" },
    type: { type: "string", default: "download" },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (doc) => {
        const finalSlug = doc.slug || generateSlug(doc._raw.flattenedPath, "downloads");
        return generateUrl(finalSlug, "downloads");
      },
    },
  },
}));

// BOOKS (content/books/**/*)
export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: `books/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
      default: "Untitled Book",
    },
    date: {
      type: "date",
      required: true,
      default: new Date().toISOString().split("T")[0],
    },
    // NEW: Add missing fields from build log
    slug: { type: "string", required: false },
    readTime: { type: "string", required: false },
    // Legacy fields
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    author: { type: "string", default: "" },
    publisher: { type: "string", default: "" },
    isbn: { type: "string", default: "" },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (doc) => {
        const finalSlug = doc.slug || generateSlug(doc._raw.flattenedPath, "books");
        return generateUrl(finalSlug, "books");
      },
    },
  },
}));

// EVENTS (content/events/**/*)
export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: `events/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
      default: "Untitled Event",
    },
    date: {
      type: "date",
      required: true,
      default: new Date().toISOString().split("T")[0],
    },
    // NEW: Add missing fields from build log
    slug: { type: "string", required: false },
    time: { type: "string", required: false },
    description: { type: "string", required: false },
    // Legacy fields
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    eventDate: {
      type: "date",
      default: new Date().toISOString().split("T")[0],
    },
    location: { type: "string", default: "" },
    registrationUrl: { type: "string", default: "" },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (doc) => {
        const finalSlug = doc.slug || generateSlug(doc._raw.flattenedPath, "events");
        return generateUrl(finalSlug, "events");
      },
    },
    isUpcoming: {
      type: "boolean",
      resolve: (doc) => {
        const eventDate = new Date(doc.eventDate || doc.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today;
      },
    },
  },
}));

// PRINTABLE RESOURCES (content/prints/**/*)
export const Print = defineDocumentType(() => ({
  name: "Print",
  filePathPattern: `prints/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
      default: "Untitled Print",
    },
    date: {
      type: "date",
      required: true,
      default: new Date().toISOString().split("T")[0],
    },
    // NEW: Add missing slug field from build log
    slug: { type: "string", required: false },
    // Legacy fields
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    dimensions: { type: "string", default: "" },
    downloadFile: { type: "string", default: "" },
    price: { type: "string", default: "" },
    available: { type: "boolean", default: true },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (doc) => {
        const finalSlug = doc.slug || generateSlug(doc._raw.flattenedPath, "prints");
        return generateUrl(finalSlug, "prints");
      },
    },
  },
}));

// STRATEGY DOCS (content/strategy/**/*)
export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: `strategy/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
      default: "Untitled Strategy",
    },
    date: {
      type: "date",
      required: true,
      default: new Date().toISOString().split("T")[0],
    },
    // NEW: Add missing fields from build log
    slug: { type: "string", required: false },
    author: { type: "string", required: false },
    description: { type: "string", required: false },
    // Legacy fields
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (doc) => {
        const finalSlug = doc.slug || generateSlug(doc._raw.flattenedPath, "strategy");
        return generateUrl(finalSlug, "strategy");
      },
    },
  },
}));

// GENERIC RESOURCES (content/resources/**/*) – legacy
export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: `resources/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
      default: "Untitled Resource",
    },
    date: {
      type: "date",
      required: true,
      default: new Date().toISOString().split("T")[0],
    },
    // NEW: Add missing fields from build log
    description: { type: "string", required: false },
    slug: { type: "string", required: false },
    author: { type: "string", required: false },
    readtime: { type: "string", required: false },
    // Legacy fields
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    resourceType: { type: "string", default: "document" },
    fileUrl: { type: "string", default: "" },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (doc) => {
        const finalSlug = doc.slug || generateSlug(doc._raw.flattenedPath, "resources");
        return generateUrl(finalSlug, "resources");
      },
    },
  },
}));

// -----------------------------------------------------------------------------
// makeSource
// -----------------------------------------------------------------------------

export default makeSource({
  contentDirPath: path.join(process.cwd(), "content"),
  documentTypes: [Post, Download, Book, Event, Print, Strategy, Resource],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
  },
  disableImportAliasWarning: true, // Suppress the import alias warning
});