// contentlayer.config.ts
import { defineDocumentType, makeSource } from "contentlayer/source-files";
import remarkGfm from "remark-gfm";
var Download = defineDocumentType(() => ({
  name: "Download",
  filePathPattern: "downloads/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    author: { type: "string", required: true },
    excerpt: { type: "string", required: true },
    readTime: { type: "string", required: true },
    category: { type: "string", required: true },
    tags: { type: "list", of: { type: "string" }, required: false },
    coverImage: { type: "string", required: true },
    coverAspect: { type: "string", required: true },
    coverFit: { type: "string", required: true },
    coverPosition: { type: "string", required: true },
    pdfPath: { type: "string", required: false },
    // NOTE: Check your content files to ensure 'file' is not used instead of 'pdfPath'
    file: { type: "string", required: false }
  },
  computedFields: {
    url_path: {
      type: "string",
      resolve: (doc) => `/downloads/${doc.slug}`
    }
  }
}));
var Event = defineDocumentType(() => ({
  name: "Event",
  filePathPattern: "events/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    endDate: { type: "string", required: false },
    location: { type: "string", required: false },
    summary: { type: "string", required: false },
    heroImage: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false },
    // Fields required to fix the error in pages/events/index.tsx
    ctaHref: { type: "string", required: false },
    ctaLabel: { type: "string", required: false }
  },
  computedFields: {
    url_path: {
      type: "string",
      resolve: (doc) => `/events/${doc.slug}`
    }
  }
}));
var Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    date: { type: "string", required: true },
    author: { type: "string", required: true },
    excerpt: { type: "string", required: true },
    readTime: { type: "string", required: true },
    tags: { type: "list", of: { type: "string" }, required: false },
    coverImage: { type: "string", required: true },
    coverAspect: { type: "string", required: true },
    coverFit: { type: "string", required: true },
    coverPosition: { type: "string", required: true }
    // NOTE: Add other required blog fields here
  },
  computedFields: {
    url_path: {
      type: "string",
      resolve: (doc) => `/blog/${doc.slug}`
    }
  }
}));
var Book = defineDocumentType(() => ({
  name: "Book",
  filePathPattern: "books/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true }
    // NOTE: Add other required book fields here
  }
}));
var Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/*.md",
  // FIX: Change "md" to "markdown"
  contentType: "markdown",
  fields: {
    title: { type: "string", required: true }
    // NOTE: Add other required resource fields here
  }
}));
var contentlayer_config_default = makeSource({
  contentDirPath: "content",
  // Register ALL document types
  documentTypes: [Download, Event, Post, Book, Resource],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: []
  }
});
export {
  contentlayer_config_default as default
};
//# sourceMappingURL=compiled-contentlayer-config-6C6BHFRS.mjs.map
