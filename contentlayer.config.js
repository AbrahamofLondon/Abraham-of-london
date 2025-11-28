// contentlayer.config.mjs
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

function generateUrl(slug, basePath) {
  const cleanSlug = String(slug).replace(/^\/+|\/+$/gu, "");
  const cleanBase = String(basePath).replace(/^\/+|\/+$/gu, "");
  if (!cleanSlug) return `/${cleanBase}`;
  return `/${cleanBase}/${cleanSlug}`.replace(/\/+/gu, "/");
}

// -----------------------------------------------------------------------------
// Document types
// -----------------------------------------------------------------------------

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Post" },
    date: {
      type: "date",
      required: true,
      default: new Date().toISOString().split("T")[0],
    },
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
    relatedDownloads: {
      type: "list",
      of: { type: "string" },
      required: false,
    },
    resources: { type: "json", required: false },
    keyInsights: { type: "json", required: false },
    authorNote: { type: "string", required: false },
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    draft: { type: "boolean", default: false },
    featured: { type: "boolean", default: false },
    layout: { type: "string", required: false },
    accessLevel: { type: "string", required: false, default: "public" },
    lockMessage: { type: "string", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) =>
        doc.slug || generateSlug(doc._raw.flattenedPath, "blog"),
    },
    url: {
      type: "string",
      resolve: (doc) =>
        generateUrl(
          doc.slug || generateSlug(doc._raw.flattenedPath, "blog"),
          "blog",
        ),
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

export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Download" },
    date: {
      type: "date",
      required: true,
      default: new Date().toISOString().split("T")[0],
    },
    slug: { type: "string", required: false },
    author: { type: "string", required: false },
    readTime: { type: "string", required: false },
    readtime: { type: "string", required: false },
    category: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    file: { type: "string", required: false },
    pdfPath: { type: "string", required: false },
    layout: { type: "string", required: false },
    description: { type: "string", required: false },
    fileSize: { type: "string", required: false },
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    downloadFile: { type: "string", required: false, default: "" },
    fileUrl: { type: "string", default: "" },
    type: { type: "string", default: "download" },
    featured: { type: "boolean", default: false },
    draft: { type: "boolean", default: false },
    downloadUrl: { type: "string", default: "" },
    accessLevel: { type: "string", required: false, default: "public" },
    lockMessage: { type: "string", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) =>
        doc.slug || generateSlug(doc._raw.flattenedPath, "downloads"),
    },
    url: {
      type: "string",
      resolve: (doc) =>
        generateUrl(
          doc.slug || generateSlug(doc._raw.flattenedPath, "downloads"),
          "downloads",
        ),
    },
    downloadHref: {
      type: "string",
      resolve: (doc) => {
        if (doc.downloadUrl) return doc.downloadUrl;
        if (doc.fileUrl) return doc.fileUrl;

        const candidate =
          doc.pdfPath ||
          doc.downloadFile ||
          doc.file ||
          "";

        if (!candidate) return "";

        if (candidate.startsWith("/")) return candidate;

        return `/downloads/${candidate}`.replace(/\/+/g, "/");
      },
    },
  },
}));

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Book" },
    date: {
      type: "date",
      required: true,
      default: new Date().toISOString().split("T")[0],
    },
    slug: { type: "string", required: false },
    readTime: { type: "string", required: false },
    description: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    author: { type: "string", default: "" },
    publisher: { type: "string", default: "" },
    isbn: { type: "string", default: "" },
    draft: { type: "boolean", default: false },
    featured: { type: "boolean", default: false },
    accessLevel: { type: "string", required: false, default: "public" },
    lockMessage: { type: "string", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) =>
        doc.slug || generateSlug(doc._raw.flattenedPath, "books"),
    },
    url: {
      type: "string",
      resolve: (doc) =>
        generateUrl(
          doc.slug || generateSlug(doc._raw.flattenedPath, "books"),
          "books",
        ),
    },
  },
}));

export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: "events/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Event" },
    date: {
      type: "date",
      required: true,
      default: new Date().toISOString().split("T")[0],
    },
    slug: { type: "string", required: false },
    time: { type: "string", required: false },
    description: { type: "string", required: false },
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    eventDate: {
      type: "date",
      default: new Date().toISOString().split("T")[0],
    },
    location: { type: "string", default: "" },
    registrationUrl: { type: "string", default: "" },
    accessLevel: { type: "string", required: false, default: "public" },
    lockMessage: { type: "string", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) =>
        doc.slug || generateSlug(doc._raw.flattenedPath, "events"),
    },
    url: {
      type: "string",
      resolve: (doc) =>
        generateUrl(
          doc.slug || generateSlug(doc._raw.flattenedPath, "events"),
          "events",
        ),
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

export const Print = defineDocumentType(() => ({
  name: "Print",
  filePathPattern: "prints/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Print" },
    date: {
      type: "date",
      required: true,
      default: new Date().toISOString().split("T")[0],
    },
    slug: { type: "string", required: false },
    description: { type: "string", required: false },
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    dimensions: { type: "string", default: "" },
    downloadFile: { type: "string", default: "" },
    price: { type: "string", default: "" },
    available: { type: "boolean", default: true },
    accessLevel: { type: "string", required: false, default: "public" },
    lockMessage: { type: "string", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) =>
        doc.slug || generateSlug(doc._raw.flattenedPath, "prints"),
    },
    url: {
      type: "string",
      resolve: (doc) =>
        generateUrl(
          doc.slug || generateSlug(doc._raw.flattenedPath, "prints"),
          "prints",
        ),
    },
  },
}));

export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Strategy" },
    date: {
      type: "date",
      required: true,
      default: new Date().toISOString().split("T")[0],
    },
    slug: { type: "string", required: false },
    author: { type: "string", required: false },
    description: { type: "string", required: false },
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    accessLevel: { type: "string", required: false, default: "public" },
    lockMessage: { type: "string", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) =>
        doc.slug || generateSlug(doc._raw.flattenedPath, "strategy"),
    },
    url: {
      type: "string",
      resolve: (doc) =>
        generateUrl(
          doc.slug || generateSlug(doc._raw.flattenedPath, "strategy"),
          "strategy",
        ),
    },
  },
}));

export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Resource" },
    date: {
      type: "date",
      required: true,
      default: new Date().toISOString().split("T")[0],
    },
    description: { type: "string", required: false },
    slug: { type: "string", required: false },
    author: { type: "string", required: false },
    readtime: { type: "string", required: false },
    readTime: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    resourceType: { type: "string", default: "document" },
    fileUrl: { type: "string", default: "" },
    downloadUrl: { type: "string", default: "" },
    featured: { type: "boolean", default: false },
    draft: { type: "boolean", default: false },
    accessLevel: { type: "string", required: false, default: "public" },
    lockMessage: { type: "string", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) =>
        doc.slug || generateSlug(doc._raw.flattenedPath, "resources"),
    },
    url: {
      type: "string",
      resolve: (doc) =>
        generateUrl(
          doc.slug || generateSlug(doc._raw.flattenedPath, "resources"),
          "resources",
        ),
    },
  },
}));

export const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: "canon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
      default: "Untitled Canon Document",
    },
    date: {
      type: "date",
      required: true,
      default: new Date().toISOString().split("T")[0],
    },
    slug: { type: "string", required: false },
    subtitle: { type: "string", required: false },
    description: { type: "string", required: false },
    excerpt: { type: "string", default: "" },
    author: { type: "string", default: "Abraham of London" },
    coverImage: { type: "string", default: "" },
    volumeNumber: { type: "string", required: false },
    order: { type: "number", required: false },
    featured: { type: "boolean", default: false },
    draft: { type: "boolean", default: false },
    tags: { type: "list", of: { type: "string" }, default: [] },
    readTime: { type: "string", required: false },
    accessLevel: { type: "string", required: false, default: "public" },
    lockMessage: { type: "string", required: false },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) =>
        doc.slug || generateSlug(doc._raw.flattenedPath, "canon"),
    },
    url: {
      type: "string",
      resolve: (doc) =>
        generateUrl(
          doc.slug || generateSlug(doc._raw.flattenedPath, "canon"),
          "canon",
        ),
    },
  },
}));

// -----------------------------------------------------------------------------
// makeSource
// -----------------------------------------------------------------------------

export default makeSource({
  contentDirPath: path.join(process.cwd(), "content"),
  documentTypes: [Post, Download, Book, Event, Print, Strategy, Resource, Canon],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
    esbuildOptions: (options) => {
      options.loader = {
        ...(options.loader || {}),
        ".mdx": "tsx",
      };
      options.alias = {
        ...(options.alias || {}),
        "@": process.cwd(),
      };
      return options;
    },
  },
  disableImportAliasWarning: true,
});