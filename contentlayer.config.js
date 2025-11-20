import path from "node:path";
import { defineDocumentType, makeSource } from "contentlayer/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

type RawDoc = {
  _raw: { flattenedPath: string };
  body?: { raw: string };
  [key: string]: unknown;
};

const generateSlug = (rawPath: string, prefix: string): string => {
  try {
    const withoutPrefix = rawPath.replace(new RegExp(`^${prefix}/`), "");
    const cleaned = withoutPrefix.replace(/\/index$/, "");
    return cleaned || "untitled";
  } catch {
    return "untitled";
  }
};

const generateUrl = (slug: string, basePath: string): string => {
  return `/${basePath}/${slug}`.replace(/\/+/g, "/");
};

// -----------------------------------------------------------------------------
// Post
// -----------------------------------------------------------------------------

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `posts/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Post" },
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
      resolve: (doc: RawDoc) =>
        generateSlug(doc._raw.flattenedPath, "posts"),
    },
    url: {
      type: "string",
      resolve: (doc: RawDoc) =>
        generateUrl(generateSlug(doc._raw.flattenedPath, "posts"), "blog"),
    },
    readingTime: {
      type: "number",
      resolve: (doc: RawDoc) => {
        const wordsPerMinute = 200;
        const raw = (doc.body as RawDoc["body"] | undefined)?.raw ?? "";
        const wordCount = raw.split(/\s+/).filter(Boolean).length;
        return Math.ceil(wordCount / wordsPerMinute);
      },
    },
  },
}));

// -----------------------------------------------------------------------------
// Download
// -----------------------------------------------------------------------------

export const Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: `downloads/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Download" },
    excerpt: { type: "string", default: "" },
    type: { type: "string", default: "resource" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    fileUrl: { type: "string", default: "" },
    fileSize: { type: "string", default: "" },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc: RawDoc) =>
        generateSlug(doc._raw.flattenedPath, "downloads"),
    },
    url: {
      type: "string",
      resolve: (doc: RawDoc) =>
        generateUrl(
          generateSlug(doc._raw.flattenedPath, "downloads"),
          "downloads",
        ),
    },
  },
}));

// -----------------------------------------------------------------------------
// Book
// -----------------------------------------------------------------------------

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: `books/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Book" },
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
      resolve: (doc: RawDoc) =>
        generateSlug(doc._raw.flattenedPath, "books"),
    },
    url: {
      type: "string",
      resolve: (doc: RawDoc) =>
        generateUrl(generateSlug(doc._raw.flattenedPath, "books"), "books"),
    },
  },
}));

// -----------------------------------------------------------------------------
// Event
// -----------------------------------------------------------------------------

export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: `events/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Event" },
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
      resolve: (doc: RawDoc) =>
        generateSlug(doc._raw.flattenedPath, "events"),
    },
    url: {
      type: "string",
      resolve: (doc: RawDoc) =>
        generateUrl(generateSlug(doc._raw.flattenedPath, "events"), "events"),
    },
    isUpcoming: {
      type: "boolean",
      resolve: (doc: any) => {
        const baseDate = (doc.eventDate as string) ?? (doc.date as string);
        if (!baseDate) return false;
        const eventDate = new Date(baseDate);
        const now = new Date();
        // Normalise to date-only comparison
        eventDate.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        return eventDate >= now;
      },
    },
  },
}));

// -----------------------------------------------------------------------------
// Print
// -----------------------------------------------------------------------------

export const Print = defineDocumentType(() => ({
  name: "Print",
  filePathPattern: `prints/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Print" },
    date: {
      type: "date",
      required: true,
      default: new Date().toISOString().split("T")[0],
    },
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    dimensions: { type: "string", default: "" },
    price: { type: "string", default: "" },
    available: { type: "boolean", default: true },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc: RawDoc) =>
        generateSlug(doc._raw.flattenedPath, "prints"),
    },
    url: {
      type: "string",
      resolve: (doc: RawDoc) =>
        generateUrl(generateSlug(doc._raw.flattenedPath, "prints"), "prints"),
    },
  },
}));

// -----------------------------------------------------------------------------
// Resource
// -----------------------------------------------------------------------------

export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: `resources/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Resource" },
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
      resolve: (doc: RawDoc) =>
        generateSlug(doc._raw.flattenedPath, "resources"),
    },
    url: {
      type: "string",
      resolve: (doc: RawDoc) =>
        generateUrl(
          generateSlug(doc._raw.flattenedPath, "resources"),
          "resources",
        ),
    },
  },
}));

// -----------------------------------------------------------------------------
// Page (catch-all for any remaining MD/MDX content)
// NOTE: to avoid pattern collisions, this assumes your "real" content
// lives under the known collection folders.
// -----------------------------------------------------------------------------

export const Page = defineDocumentType(() => ({
  name: "Page",
  filePathPattern: `**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Page" },
    date: {
      type: "date",
      default: new Date().toISOString().split("T")[0],
    },
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc: RawDoc) => {
        const flattened = doc._raw.flattenedPath;
        const knownPrefixes = [
          "posts",
          "downloads",
          "books",
          "events",
          "prints",
          "resources",
        ];
        const prefix = knownPrefixes.find((p) =>
          flattened.startsWith(`${p}/`),
        );
        return prefix ? generateSlug(flattened, prefix) : flattened;
      },
    },
    url: {
      type: "string",
      resolve: (doc: RawDoc) => `/${doc._raw.flattenedPath}`,
    },
    contentType: {
      type: "string",
      resolve: (doc: RawDoc) => {
        const path = doc._raw.flattenedPath;
        if (path.startsWith("posts/")) return "post";
        if (path.startsWith("downloads/")) return "download";
        if (path.startsWith("books/")) return "book";
        if (path.startsWith("events/")) return "event";
        if (path.startsWith("prints/")) return "print";
        if (path.startsWith("resources/")) return "resource";
        return "page";
      },
    },
  },
}));

// -----------------------------------------------------------------------------
// makeSource
// -----------------------------------------------------------------------------

export default makeSource({
  contentDirPath: path.join(process.cwd(), "content"),
  documentTypes: [Post, Download, Book, Event, Print, Resource, Page],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
  },
  // Log unknown docs instead of failing builds
  onUnknownDocuments: (unknownDocuments) => {
    if (!unknownDocuments?.length) return;
    console.warn(
      `Found ${unknownDocuments.length} documents without type definition`,
    );
    for (const doc of unknownDocuments) {
      console.warn(`- ${doc._raw.flattenedPath}`);
    }
  },
});