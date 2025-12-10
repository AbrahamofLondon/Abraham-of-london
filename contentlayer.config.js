import path from "node:path";
import {
  defineDocumentType,
  makeSource,
} from "contentlayer2/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const escapeForRegExp = (input: string) =>
  String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const generateSlug = (flattened: string, prefix: string) => {
  if (!flattened) return "untitled";
  try {
    const safePrefix = escapeForRegExp(prefix);
    return (
      flattened
        .replace(new RegExp(`^${safePrefix}/`, "u"), "")
        .replace(/\/index$/u, "") || "untitled"
    );
  } catch {
    return "untitled";
  }
};

const generateUrl = (slug: string, base: string) => {
  const cleanSlug = String(slug).replace(/^\/+|\/+$/gu, "");
  const cleanBase = String(base).replace(/^\/+|\/+$/gu, "");
  return cleanSlug ? `/${cleanBase}/${cleanSlug}` : `/${cleanBase}`;
};

// Ensure safe defaults for all fields
const withDefaults = (fields: Record<string, any>) => {
  const out: Record<string, any> = {};
  for (const [key, cfg] of Object.entries(fields)) {
    if (cfg.type === "string") {
      out[key] = { ...cfg, default: cfg.default ?? "" };
    } else if (cfg.type === "list") {
      out[key] = { ...cfg, default: cfg.default ?? [] };
    } else if (cfg.type === "boolean") {
      out[key] = { ...cfg, default: cfg.default ?? false };
    } else if (cfg.type === "json") {
      out[key] = { ...cfg, default: cfg.default ?? null };
    } else {
      out[key] = cfg;
    }
  }
  return out;
};

/* -------------------------------------------------------------------------- */
/* DOCUMENT TYPES                                                             */
/* -------------------------------------------------------------------------- */

/* ---------------------------------- POST ---------------------------------- */
export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.{md,mdx}",
  contentType: "mdx",
  fields: withDefaults({
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    slug: { type: "string" },
    description: { type: "string" },
    author: { type: "string" },
    authorTitle: { type: "string" },
    readTime: { type: "string" },
    category: { type: "string" },
    ogTitle: { type: "string" },
    ogDescription: { type: "string" },
    socialCaption: { type: "string" },
    coverAspect: { type: "string" },
    coverFit: { type: "string" },
    coverPosition: { type: "string" },
    relatedDownloads: { type: "list", of: { type: "string" } },
    resources: { type: "json" },
    keyInsights: { type: "json" },
    authorNote: { type: "string" },
    excerpt: { type: "string" },
    coverImage: { type: "string" },
    tags: { type: "list", of: { type: "string" } },
    draft: { type: "boolean" },
    featured: { type: "boolean" },
    layout: { type: "string" },
    accessLevel: { type: "string" },
    lockMessage: { type: "string" },
  }),
  computedFields: {
    slug: {
      type: "string",
      resolve: doc => doc.slug || generateSlug(doc._raw.flattenedPath, "blog"),
    },
    url: {
      type: "string",
      resolve: doc =>
        generateUrl(
          doc.slug || generateSlug(doc._raw.flattenedPath, "blog"),
          "blog"
        ),
    },
    readingTime: {
      type: "number",
      resolve: doc => {
        const words = String(doc.body.raw).split(/\s+/u).length;
        return Math.ceil(words / 200);
      },
    },
  },
}));

/* -------------------------------- DOWNLOAD -------------------------------- */
export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/**/*.{md,mdx}",
  contentType: "mdx",
  fields: withDefaults({
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    slug: { type: "string" },
    subtitle: { type: "string" },
    description: { type: "string" },
    file: { type: "string" },
    pdfPath: { type: "string" },
    fileSize: { type: "string" },
    coverImage: { type: "string" },
    tags: { type: "list", of: { type: "string" } },
    type: { type: "string" },
    readTime: { type: "string" },
    featured: { type: "boolean" },
    draft: { type: "boolean" },
    downloadFile: { type: "string" },
    downloadUrl: { type: "string" },
    fileUrl: { type: "string" },
    accessLevel: { type: "string" },
    lockMessage: { type: "string" },
  }),
  computedFields: {
    slug: {
      type: "string",
      resolve: doc =>
        doc.slug ||
        generateSlug(doc._raw.flattenedPath, "downloads"),
    },
    url: {
      type: "string",
      resolve: doc =>
        generateUrl(
          doc.slug ||
            generateSlug(doc._raw.flattenedPath, "downloads"),
          "downloads"
        ),
    },
    downloadHref: {
      type: "string",
      resolve: doc => {
        if (doc.downloadUrl) return doc.downloadUrl;
        if (doc.fileUrl) return doc.fileUrl;
        const c = doc.pdfPath || doc.downloadFile || doc.file || "";
        return c.startsWith("/") ? c : `/downloads/${c}`;
      },
    },
  },
}));

/* ---------------------------------- BOOK ---------------------------------- */
export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/**/*.{md,mdx}",
  contentType: "mdx",
  fields: withDefaults({
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    slug: { type: "string" },
    subtitle: { type: "string" },
    description: { type: "string" },
    excerpt: { type: "string" },
    coverImage: { type: "string" },
    tags: { type: "list", of: { type: "string" } },
    readTime: { type: "string" },
    author: { type: "string" },
    publisher: { type: "string" },
    isbn: { type: "string" },
    draft: { type: "boolean" },
    featured: { type: "boolean" },
    category: { type: "string" },
    accessLevel: { type: "string" },
    lockMessage: { type: "string" },
  }),
  computedFields: {
    slug: {
      type: "string",
      resolve: doc =>
        doc.slug || generateSlug(doc._raw.flattenedPath, "books"),
    },
    url: {
      type: "string",
      resolve: doc =>
        generateUrl(
          doc.slug ||
            generateSlug(doc._raw.flattenedPath, "books"),
          "books"
        ),
    },
  },
}));

/* ---------------------------------- EVENT --------------------------------- */
export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: "events/**/*.{md,mdx}",
  contentType: "mdx",
  fields: withDefaults({
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    slug: { type: "string" },
    time: { type: "string" },
    description: { type: "string" },
    excerpt: { type: "string" },
    coverImage: { type: "string" },
    tags: { type: "list", of: { type: "string" } },
    eventDate: { type: "date" },
    location: { type: "string" },
    registrationUrl: { type: "string" },
    accessLevel: { type: "string" },
    lockMessage: { type: "string" },
  }),
  computedFields: {
    slug: {
      type: "string",
      resolve: doc =>
        doc.slug ||
        generateSlug(doc._raw.flattenedPath, "events"),
    },
    url: {
      type: "string",
      resolve: doc =>
        generateUrl(
          doc.slug ||
            generateSlug(doc._raw.flattenedPath, "events"),
          "events"
        ),
    },
    isUpcoming: {
      type: "boolean",
      resolve: doc => {
        const d = new Date(doc.eventDate || doc.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d >= today;
      },
    },
  },
}));

/* ---------------------------------- PRINT --------------------------------- */
export const Print = defineDocumentType(() => ({
  name: "Print",
  filePathPattern: "prints/**/*.{md,mdx}",
  contentType: "mdx",
  fields: withDefaults({
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    slug: { type: "string" },
    description: { type: "string" },
    excerpt: { type: "string" },
    coverImage: { type: "string" },
    tags: { type: "list", of: { type: "string" } },
    dimensions: { type: "string" },
    downloadFile: { type: "string" },
    price: { type: "string" },
    available: { type: "boolean" },
    accessLevel: { type: "string" },
    lockMessage: { type: "string" },
  }),
  computedFields: {
    slug: {
      type: "string",
      resolve: doc =>
        doc.slug || generateSlug(doc._raw.flattenedPath, "prints"),
    },
    url: {
      type: "string",
      resolve: doc =>
        generateUrl(
          doc.slug ||
            generateSlug(doc._raw.flattenedPath, "prints"),
          "prints"
        ),
    },
  },
}));

/* -------------------------------- STRATEGY -------------------------------- */
export const Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/**/*.{md,mdx}",
  contentType: "mdx",
  fields: withDefaults({
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    slug: { type: "string" },
    author: { type: "string" },
    description: { type: "string" },
    excerpt: { type: "string" },
    coverImage: { type: "string" },
    tags: { type: "list", of: { type: "string" } },
    accessLevel: { type: "string" },
    lockMessage: { type: "string" },
  }),
  computedFields: {
    slug: {
      type: "string",
      resolve: doc =>
        doc.slug || generateSlug(doc._raw.flattenedPath, "strategy"),
    },
    url: {
      type: "string",
      resolve: doc =>
        generateUrl(
          doc.slug ||
            generateSlug(doc._raw.flattenedPath, "strategy"),
          "strategy"
        ),
    },
  },
}));

/* -------------------------------- RESOURCE -------------------------------- */
export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/**/*.{md,mdx}",
  contentType: "mdx",
  fields: withDefaults({
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    description: { type: "string" },
    slug: { type: "string" },
    author: { type: "string" },
    readTime: { type: "string" },
    subtitle: { type: "string" },
    excerpt: { type: "string" },
    coverImage: { type: "string" },
    tags: { type: "list", of: { type: "string" } },
    resourceType: { type: "string" },
    fileUrl: { type: "string" },
    downloadUrl: { type: "string" },
    featured: { type: "boolean" },
    draft: { type: "boolean" },
    accessLevel: { type: "string" },
    lockMessage: { type: "string" },
  }),
  computedFields: {
    slug: {
      type: "string",
      resolve: doc =>
        doc.slug ||
        generateSlug(doc._raw.flattenedPath, "resources"),
    },
    url: {
      type: "string",
      resolve: doc =>
        generateUrl(
          doc.slug ||
            generateSlug(doc._raw.flattenedPath, "resources"),
          "resources"
        ),
    },
  },
}));

/* ---------------------------------- CANON --------------------------------- */
export const Canon = defineDocumentType(() => ({
  name: "Canon",
  filePathPattern: "canon/**/*.{md,mdx}",
  contentType: "mdx",
  fields: withDefaults({
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    slug: { type: "string" },
    subtitle: { type: "string" },
    description: { type: "string" },
    excerpt: { type: "string" },
    author: { type: "string" },
    coverImage: { type: "string" },
    coverAspect: { type: "string" },
    coverFit: { type: "string" },
    volumeNumber: { type: "string" },
    order: { type: "number" },
    featured: { type: "boolean" },
    draft: { type: "boolean" },
    tags: { type: "list", of: { type: "string" } },
    readTime: { type: "string" },
    accessLevel: { type: "string" },
    lockMessage: { type: "string" },
  }),
  computedFields: {
    slug: {
      type: "string",
      resolve: doc =>
        doc.slug || generateSlug(doc._raw.flattenedPath, "canon"),
    },
    url: {
      type: "string",
      resolve: doc =>
        generateUrl(
          doc.slug ||
            generateSlug(doc._raw.flattenedPath, "canon"),
          "canon"
        ),
    },
  },
}));

/* ----------------------------------- SHORT -------------------------------- */
export const Short = defineDocumentType(() => ({
  name: "Short",
  filePathPattern: "shorts/**/*.mdx",
  contentType: "mdx",
  fields: withDefaults({
    title: { type: "string", required: true },
    theme: { type: "string" },
    audience: { type: "string" },
    readTime: { type: "string" },
    slug: { type: "string" }, // MUST exist to avoid warnings
  }),
  computedFields: {
    slug: {
      type: "string",
      resolve: doc =>
        doc.slug || generateSlug(doc._raw.flattenedPath, "shorts"),
    },
    url: {
      type: "string",
      resolve: doc =>
        generateUrl(
          doc.slug ||
            generateSlug(doc._raw.flattenedPath, "shorts"),
          "shorts"
        ),
    },
  },
}));

/* -------------------------------------------------------------------------- */
/* MAKE SOURCE                                                                */
/* -------------------------------------------------------------------------- */

export default makeSource({
  contentDirPath: path.join(process.cwd(), "content"),
  documentTypes: [
    Post,
    Download,
    Book,
    Event,
    Print,
    Strategy,
    Resource,
    Canon,
    Short,
  ],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
    esbuildOptions: (options) => {
      options.loader = { ...(options.loader || {}), ".mdx": "tsx" };
      options.alias = { ...(options.alias || {}), "@": process.cwd() };
      return options;
    },
  },
  disableImportAliasWarning: true,
});