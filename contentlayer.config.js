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
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    draft: { type: "boolean", default: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => generateSlug(doc._raw.flattenedPath, "blog"),
    },
    url: {
      type: "string",
      resolve: (doc) =>
        generateUrl(generateSlug(doc._raw.flattenedPath, "blog"), "blog"),
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
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    // Primary path to the PDF in /public/downloads/...
    downloadFile: { type: "string", required: true, default: "" },
    // Optional legacy field if some MDX still uses fileUrl
    fileUrl: { type: "string", default: "" },
    type: { type: "string", default: "download" },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => generateSlug(doc._raw.flattenedPath, "downloads"),
    },
    url: {
      type: "string",
      resolve: (doc) =>
        generateUrl(
          generateSlug(doc._raw.flattenedPath, "downloads"),
          "downloads",
        ),
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
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    author: { type: "string", default: "" },
    publisher: { type: "string", default: "" },
    isbn: { type: "string", default: "" },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => generateSlug(doc._raw.flattenedPath, "books"),
    },
    url: {
      type: "string",
      resolve: (doc) =>
        generateUrl(generateSlug(doc._raw.flattenedPath, "books"), "books"),
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
    slug: {
      type: "string",
      resolve: (doc) => generateSlug(doc._raw.flattenedPath, "events"),
    },
    url: {
      type: "string",
      resolve: (doc) =>
        generateUrl(generateSlug(doc._raw.flattenedPath, "events"), "events"),
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
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    // e.g. "A4", "US Letter"
    dimensions: { type: "string", default: "" },
    // optional PDF path in /public/downloads if distinct
    downloadFile: { type: "string", default: "" },
    price: { type: "string", default: "" },
    available: { type: "boolean", default: true },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => generateSlug(doc._raw.flattenedPath, "prints"),
    },
    url: {
      type: "string",
      resolve: (doc) =>
        generateUrl(
          generateSlug(doc._raw.flattenedPath, "prints"),
          "prints",
        ),
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
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => generateSlug(doc._raw.flattenedPath, "strategy"),
    },
    url: {
      type: "string",
      resolve: (doc) =>
        generateUrl(
          generateSlug(doc._raw.flattenedPath, "strategy"),
          "strategy",
        ),
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
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    resourceType: { type: "string", default: "document" },
    fileUrl: { type: "string", default: "" },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => generateSlug(doc._raw.flattenedPath, "resources"),
    },
    url: {
      type: "string",
      resolve: (doc) =>
        generateUrl(
          generateSlug(doc._raw.flattenedPath, "resources"),
          "resources",
        ),
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
});