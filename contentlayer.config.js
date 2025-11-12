import path from "node:path";
import { defineDocumentType, makeSource } from "contentlayer/source-files";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

// Helper function to safely get fields with fallbacks
const getField = (doc, field, fallback = "") => {
  return doc[field] ?? fallback;
};

// Helper function to generate safe slug
const generateSlug = (rawPath, prefix) => {
  try {
    return rawPath.replace(new RegExp(`^${prefix}/`), "").replace(/\/index$/, "") || "untitled";
  } catch {
    return "untitled";
  }
};

// Helper function to generate URL
const generateUrl = (slug, basePath) => {
  return `/${basePath}/${slug}`.replace(/\/+/g, "/");
};

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `posts/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Post" },
    date: { type: "date", required: true, default: new Date().toISOString().split('T')[0] },
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    draft: { type: "boolean", default: false }
  },
  computedFields: {
    slug: { 
      type: "string", 
      resolve: (doc) => generateSlug(doc._raw.flattenedPath, "posts")
    },
    url: { 
      type: "string", 
      resolve: (doc) => generateUrl(
        generateSlug(doc._raw.flattenedPath, "posts"), 
        "blog"
      )
    },
    readingTime: {
      type: "number",
      resolve: (doc) => {
        const wordsPerMinute = 200;
        const wordCount = doc.body.raw.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
      }
    }
  }
}));

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
    fileSize: { type: "string", default: "" }
  },
  computedFields: {
    slug: { 
      type: "string", 
      resolve: (doc) => generateSlug(doc._raw.flattenedPath, "downloads")
    },
    url: { 
      type: "string", 
      resolve: (doc) => generateUrl(
        generateSlug(doc._raw.flattenedPath, "downloads"), 
        "downloads"
      )
    }
  }
}));

export const Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: `books/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Book" },
    date: { type: "date", required: true, default: new Date().toISOString().split('T')[0] },
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    author: { type: "string", default: "" },
    publisher: { type: "string", default: "" },
    isbn: { type: "string", default: "" }
  },
  computedFields: {
    slug: { 
      type: "string", 
      resolve: (doc) => generateSlug(doc._raw.flattenedPath, "books")
    },
    url: { 
      type: "string", 
      resolve: (doc) => generateUrl(
        generateSlug(doc._raw.flattenedPath, "books"), 
        "books"
      )
    }
  }
}));

export const Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: `events/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Event" },
    date: { type: "date", required: true, default: new Date().toISOString().split('T')[0] },
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    eventDate: { type: "date", default: new Date().toISOString().split('T')[0] },
    location: { type: "string", default: "" },
    registrationUrl: { type: "string", default: "" }
  },
  computedFields: {
    slug: { 
      type: "string", 
      resolve: (doc) => generateSlug(doc._raw.flattenedPath, "events")
    },
    url: { 
      type: "string", 
      resolve: (doc) => generateUrl(
        generateSlug(doc._raw.flattenedPath, "events"), 
        "events"
      )
    },
    isUpcoming: {
      type: "boolean",
      resolve: (doc) => {
        const eventDate = new Date(doc.eventDate || doc.date);
        return eventDate >= new Date();
      }
    }
  }
}));

export const Print = defineDocumentType(() => ({
  name: "Print",
  filePathPattern: `prints/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Print" },
    date: { type: "date", required: true, default: new Date().toISOString().split('T')[0] },
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    dimensions: { type: "string", default: "" },
    price: { type: "string", default: "" },
    available: { type: "boolean", default: true }
  },
  computedFields: {
    slug: { 
      type: "string", 
      resolve: (doc) => generateSlug(doc._raw.flattenedPath, "prints")
    },
    url: { 
      type: "string", 
      resolve: (doc) => generateUrl(
        generateSlug(doc._raw.flattenedPath, "prints"), 
        "prints"
      )
    }
  }
}));

export const Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: `resources/**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Resource" },
    date: { type: "date", required: true, default: new Date().toISOString().split('T')[0] },
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] },
    resourceType: { type: "string", default: "document" },
    fileUrl: { type: "string", default: "" }
  },
  computedFields: {
    slug: { 
      type: "string", 
      resolve: (doc) => generateSlug(doc._raw.flattenedPath, "resources")
    },
    url: { 
      type: "string", 
      resolve: (doc) => generateUrl(
        generateSlug(doc._raw.flattenedPath, "resources"), 
        "resources"
      )
    }
  }
}));

// Catch-all for any other content types that might appear
export const Page = defineDocumentType(() => ({
  name: "Page",
  filePathPattern: `**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true, default: "Untitled Page" },
    date: { type: "date", default: new Date().toISOString().split('T')[0] },
    excerpt: { type: "string", default: "" },
    coverImage: { type: "string", default: "" },
    tags: { type: "list", of: { type: "string" }, default: [] }
  },
  computedFields: {
    slug: { 
      type: "string", 
      resolve: (doc) => {
        const path = doc._raw.flattenedPath;
        // Remove known prefixes to avoid duplication
        const knownPrefixes = ['posts', 'downloads', 'books', 'events', 'prints', 'resources'];
        const prefix = knownPrefixes.find(p => path.startsWith(p + '/'));
        return prefix ? generateSlug(path, prefix) : path;
      }
    },
    url: { 
      type: "string", 
      resolve: (doc) => `/${doc._raw.flattenedPath}`
    },
    contentType: {
      type: "string",
      resolve: (doc) => {
        const path = doc._raw.flattenedPath;
        if (path.startsWith('posts/')) return 'post';
        if (path.startsWith('downloads/')) return 'download';
        if (path.startsWith('books/')) return 'book';
        if (path.startsWith('events/')) return 'event';
        if (path.startsWith('prints/')) return 'print';
        if (path.startsWith('resources/')) return 'resource';
        return 'page';
      }
    }
  }
}));

export default makeSource({
  contentDirPath: path.join(process.cwd(), "content"),
  documentTypes: [Post, Download, Book, Event, Print, Resource, Page],
  mdx: { 
    remarkPlugins: [remarkGfm], 
    rehypePlugins: [rehypeSlug],
    onWarning: (warning) => {
      // Log but don't fail build on MDX warnings
      console.warn('MDX Warning:', warning);
    }
  },
  onUnknownDocuments: (unknownDocuments) => {
    // Log unknown documents but don't fail the build
    console.warn(`Found ${unknownDocuments.length} documents without type definition`);
    unknownDocuments.forEach(doc => {
      console.warn(`- ${doc._raw.flattenedPath}`);
    });
  }
});