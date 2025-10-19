// contentlayer.config.ts
import { defineDocumentType, makeSource } from "contentlayer/source-files";
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
    file: { type: "string", required: false },
    description: { type: "string", required: false }
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
    ctaHref: { type: "string", required: false },
    ctaLabel: { type: "string", required: false },
    chatham: { type: "boolean", required: false },
    resources: { type: "json", required: false },
    related: { type: "list", of: { type: "string" }, required: false }
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
    coverPosition: { type: "string", required: true },
    description: { type: "string", required: false },
    ogTitle: { type: "string", required: false },
    ogDescription: { type: "string", required: false },
    socialCaption: { type: "string", required: false },
    category: { type: "string", required: false },
    draft: { type: "boolean", required: false }
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
    slug: { type: "string", required: true },
    author: { type: "string", required: false },
    excerpt: { type: "string", required: false },
    genre: { type: "string", required: false },
    coverImage: { type: "string", required: false },
    buyLink: { type: "string", required: false },
    downloadPdf: { type: "string", required: false },
    downloadEpub: { type: "string", required: false },
    description: { type: "string", required: false },
    date: { type: "string", required: false },
    tags: { type: "list", of: { type: "string" }, required: false }
  }
}));
var Resource = defineDocumentType(() => ({
  name: "Resource",
  filePathPattern: "resources/*.md",
  contentType: "markdown",
  fields: {
    title: { type: "string", required: true }
  }
}));
var Strategy = defineDocumentType(() => ({
  name: "Strategy",
  filePathPattern: "strategy/*.md",
  contentType: "markdown",
  fields: {
    title: { type: "string", required: true }
    // Add other fields from strategy/events-blueprint.md here
  }
}));
var contentlayer_config_default = makeSource({
  contentDirPath: "content",
  // Register ALL document types
  documentTypes: [Download, Event, Post, Book, Resource, Strategy],
  mdx: {
    // TEMPORARILY REMOVED remarkGfm to fix the table parsing error
    remarkPlugins: [],
    rehypePlugins: []
  }
});
export {
  contentlayer_config_default as default
};
//# sourceMappingURL=compiled-contentlayer-config-J7UIEYZY.mjs.map
